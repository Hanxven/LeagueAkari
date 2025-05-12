import { input } from '@hanxven/league-akari-addons'
import { i18next } from '@main/i18n'
import { IAkariShardInitDispose, Shard, SharedGlobalShard } from '@shared/akari-shard'
import { getSgpServerId } from '@shared/data-sources/sgp/utils'
import { isBotQueue } from '@shared/types/league-client/game-data'
import { isPveQueue } from '@shared/types/league-client/match-history'
import { formatError } from '@shared/utils/errors'
import { sleep } from '@shared/utils/sleep'
import { comparer } from 'mobx'
import fs from 'node:fs'
import vm from 'node:vm'

import { AppCommonMain } from '../app-common'
import { AkariIpcMain } from '../ipc'
import { KeyboardShortcutsMain } from '../keyboard-shortcuts'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { OngoingGameMain } from '../ongoing-game'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import {
  JSContextV1,
  JS_TEMPLATE_CHECK_RESULT,
  checkContextV1,
  getExampleTemplate
} from './js-template'
import { InGameSendSettings, InGameSendState, SendableItem, TemplateDef } from './state'
import defaultTemplate from './templates/default-template.js?asset'
import { TemplateEnv } from './templates/env-types'

/**
 * 用于在游戏中模拟发送的相关功能
 *  - 游戏内发送消息
 *  - 英雄选择阶段发送消息
 *  - 一些其他的发送场景
 */
@Shard(InGameSendMain.id)
export class InGameSendMain implements IAkariShardInitDispose {
  static id = 'in-game-send-main'

  /**
   * 硬性大小限制, FOR NO REASON
   */
  static MAX_ITEMS = 100
  static ENTER_KEY_CODE = 13
  static ENTER_KEY_INTERNAL_DELAY = 20

  public readonly settings = new InGameSendSettings()
  public readonly state = new InGameSendState()

  private _log: AkariLogger
  private _setting: SetterSettingService

  private _vmContexts: Record<string, vm.Context> = {}

  private _currentSendController: AbortController | null = null

  constructor(
    private readonly _settingFactory: SettingFactoryMain,
    private readonly _loggerFactory: LoggerFactoryMain,
    private readonly _mobx: MobxUtilsMain,
    private readonly _ipc: AkariIpcMain,
    private readonly _kbd: KeyboardShortcutsMain,
    private readonly _og: OngoingGameMain,
    private readonly _lc: LeagueClientMain,
    private readonly _shared: SharedGlobalShard,
    private readonly _app: AppCommonMain
  ) {
    this._log = _loggerFactory.create(InGameSendMain.id)
    this._setting = _settingFactory.register(
      InGameSendMain.id,
      {
        sendableItems: { default: this.settings.sendableItems },
        sendInterval: { default: this.settings.sendInterval },
        templates: { default: this.settings.templates },
        cancelShortcut: { default: this.settings.cancelShortcut }
      },
      this.settings
    )
  }

  private async _handleState() {
    await this._setting.applyToState()

    this._mobx.propSync(InGameSendMain.id, 'settings', this.settings, [
      'sendInterval',
      'templates',
      'sendableItems',
      'cancelShortcut'
    ])

    this._setting.onChange('sendInterval', (v, { setter }) => {
      if (v < 0) {
        return setter(0)
      }

      return setter(v)
    })
  }

  private _handelCancelShortcut() {
    this._mobx.reaction(
      () => this.settings.cancelShortcut,
      (v) => {
        const targetId = `${InGameSendMain.id}/cancel`

        if (v === null) {
          this._kbd.unregisterByTargetId(targetId)
        } else {
          try {
            this._kbd.register(targetId, v, 'normal', () => {
              if (this._currentSendController) {
                this._currentSendController.abort()
              }
            })
          } catch (error) {
            this.settings.setCancelShortcut(null)
            this._log.error('注册快捷键失败', error)
          }
        }
      },
      { fireImmediately: true }
    )
  }

  private _performSendableItemSend(id: string, target: 'all' | 'ally' | 'enemy') {
    if (this._currentSendController) {
      this._log.info('存在正在发生的任务, 取消')
      this._currentSendController.abort()
    }

    if (
      this._og.state.queryStage.phase !== 'champ-select' &&
      this._og.state.queryStage.phase !== 'in-game'
    ) {
      this._log.warn('当前阶段不支持发送消息', this._og.state.queryStage.phase)
      return
    }

    const s = this.settings.sendableItems.find((item) => item.id === id)

    if (!s) {
      this._log.warn('未找到发送项', id)
      return
    }

    if (!s.enabled) {
      return
    }

    this._currentSendController = new AbortController()

    if (s.content.type === 'plaintext') {
      this._sendTextToChatOrInGame(
        s.content.content.split('\n'),
        this._currentSendController.signal
      )
    } else if (s.content.type === 'template' && s.content.templateId) {
      try {
        const ctx = this._vmContexts[s.content.templateId] as JSContextV1
        if (ctx) {
          const lines = ctx.getMessages(this._createTemplateEnv({ target }))
          this._sendTextToChatOrInGame(lines, this._currentSendController.signal)
        } else {
          this._log.warn('未找到模板上下文', s.content.templateId)
        }
      } catch (error) {
        this._log.warn('模板执行失败', s.content.templateId, error)
        this._currentSendController = null
        this._ipc.sendEvent(InGameSendMain.id, 'error-template-execution-failed', {
          templateId: s.content.templateId,
          error: formatError(error)
        })
      }
    } else {
      this._log.warn('未知的模板类型', s.content)
    }
  }

  private _getDryRunResult(templateId: string, target: 'ally' | 'enemy' | 'all') {
    const ctx = this._vmContexts[templateId] as JSContextV1
    if (!ctx) {
      this._log.warn('未找到模板上下文', templateId)
      return null
    }

    return ctx.getMessages(this._createTemplateEnv({ target }))
  }

  /**
   * 在英雄选择阶段和在游戏中, 会采用不同的策略
   * @param strs
   * @param signal
   */
  private _sendTextToChatOrInGame(strs: string[], signal: AbortSignal) {
    let aborted = false
    signal.addEventListener('abort', () => {
      aborted = true
    })

    const interval = this.settings.sendInterval
    const tasks: (() => Promise<any>)[] = []

    if (this._og.state.queryStage.phase === 'champ-select') {
      const cv = this._lc.data.chat.conversations.championSelect

      if (!cv) {
        this._log.warn('未找到英雄选择阶段的聊天室信息')
        return
      }

      this._log.info('在英雄选择阶段发送消息', strs)

      for (let i = 0; i < strs.length; i++) {
        tasks.push(() => this._lc.api.chat.chatSend(cv.id, strs[i]).catch(() => {}))

        if (i !== strs.length - 1) {
          tasks.push(() => sleep(interval))
        }
      }
    } else if (this._og.state.queryStage.phase === 'in-game') {
      this._log.info('在游戏中发送消息', strs)

      for (let i = 0; i < strs.length; i++) {
        tasks.push(async () => {
          await input.instance.sendKey(InGameSendMain.ENTER_KEY_CODE, true)
          await sleep(InGameSendMain.ENTER_KEY_INTERNAL_DELAY)
          await input.instance.sendKey(InGameSendMain.ENTER_KEY_CODE, false)
          await sleep(interval)
          await input.instance.sendString(strs[i])
          await sleep(interval)
          await input.instance.sendKey(InGameSendMain.ENTER_KEY_CODE, true)
          await sleep(InGameSendMain.ENTER_KEY_INTERNAL_DELAY)
          await input.instance.sendKey(InGameSendMain.ENTER_KEY_CODE, false)
        })

        if (i !== strs.length - 1) {
          tasks.push(() => sleep(interval))
        }
      }
    } else {
      return
    }

    const runTasks = async () => {
      for (const task of tasks) {
        if (aborted) {
          break
        }

        await task()
      }
    }

    runTasks()
  }

  private _createSendableItem(data?: Partial<SendableItem>) {
    if (this.settings.sendableItems.length >= InGameSendMain.MAX_ITEMS) {
      this._ipc.sendEvent(InGameSendMain.id, 'error-sendable-item-max-items-reached')
      return
    }

    const id = crypto.randomUUID()

    const that: SendableItem = {
      id,
      name:
        data?.name ||
        i18next.t('in-game-send-main.newSendableItem', {
          index: this.settings.sendableItems.length + 1
        }),
      enabled: data?.enabled || true,
      sendAllShortcut: data?.sendAllShortcut || null,
      sendAllyShortcut: data?.sendAllyShortcut || null,
      sendEnemyShortcut: data?.sendEnemyShortcut || null,
      content: data?.content || {
        type: 'plaintext',
        content: ''
      }
    }

    const [boundItem] = this._tryApplyingSendableItemShortcuts(that)

    this._setting.set('sendableItems', [...this.settings.sendableItems, boundItem])

    return that
  }

  private async _updateSendableItem(id: string, data: Partial<SendableItem>) {
    const item = this.settings.sendableItems.find((item) => item.id === id)

    if (!item) {
      return
    }

    if (data.name !== undefined) {
      item.name = data.name
    }

    if (data.enabled !== undefined) {
      item.enabled = data.enabled
    }

    if (data.sendAllShortcut !== undefined) {
      item.sendAllShortcut = data.sendAllShortcut
    }

    if (item.content.type === 'template' && data.sendAllyShortcut !== undefined) {
      item.sendAllyShortcut = data.sendAllyShortcut
    }

    if (item.content.type === 'template' && data.sendEnemyShortcut !== undefined) {
      item.sendEnemyShortcut = data.sendEnemyShortcut
    }

    if (data.content !== undefined) {
      item.content = data.content

      if (data.content.type === 'plaintext') {
        item.sendAllyShortcut = null
        item.sendEnemyShortcut = null
      }
    }

    this._tryApplyingSendableItemShortcuts(item)

    this._setting.set('sendableItems', [...this.settings.sendableItems])

    return item
  }

  /**
   * 删除快捷键并更新状态
   */
  private async _removeSendableItem(id: string) {
    const item = this.settings.sendableItems.find((item) => item.id === id)

    if (item) {
      this._unregisterSendableItemShortcuts(item)
      this._setting.set(
        'sendableItems',
        this.settings.sendableItems.filter((item) => item.id !== id)
      )
      return true
    }

    return false
  }

  private async _handleIpcCall() {
    this._ipc.onCall(InGameSendMain.id, 'createSendableItem', (_, data: Partial<SendableItem>) => {
      return this._createSendableItem(data)
    })

    this._ipc.onCall(
      InGameSendMain.id,
      'updateSendableItem',
      (_, id: string, data: Partial<SendableItem>) => {
        return this._updateSendableItem(id, data)
      }
    )

    this._ipc.onCall(InGameSendMain.id, 'removeSendableItem', (_, id: string) => {
      return this._removeSendableItem(id)
    })

    this._ipc.onCall(InGameSendMain.id, 'createTemplate', (_, data?: Partial<TemplateDef>) => {
      return this._createTemplate(data)
    })

    this._ipc.onCall(InGameSendMain.id, 'createPresetTemplate', (_, id: string) => {
      return this._createPresetTemplate(id)
    })

    this._ipc.onCall(
      InGameSendMain.id,
      'updateTemplate',
      (_, id: string, data: Partial<TemplateDef>) => {
        return this._updateTemplate(id, data)
      }
    )

    this._ipc.onCall(InGameSendMain.id, 'removeTemplate', (_, id: string) => {
      this._removeTemplate(id)
    })

    this._ipc.onCall(
      InGameSendMain.id,
      'getDryRunResult',
      (_, templateId: string, target: 'ally' | 'enemy' | 'all') => {
        return this._getDryRunResult(templateId, target)
      }
    )
  }

  private _handleTemplateAutoDeprecation() {
    // 时刻检查将不再存在的模板引用设置为 null
    this._mobx.reaction(
      () => this.settings.templates,
      (templates) => {
        const existingTemplateIds = new Set(templates.map((t) => t.id))

        let somethingWrong = false
        for (const item of this.settings.sendableItems) {
          if (item.content.type !== 'template') {
            continue
          }

          if (item.content.templateId && !existingTemplateIds.has(item.content.templateId)) {
            item.content.templateId = null
            somethingWrong = true
          }
        }

        if (somethingWrong) {
          this._setting.set('sendableItems', [...this.settings.sendableItems])
        }
      },
      { fireImmediately: true }
    )
  }

  async onInit() {
    await this._handleState()
    this._checkAndInitTemplates()
    this._checkAndInitShortcuts()
    this._handleTemplateAutoDeprecation()
    this._handelCancelShortcut()
    this._handleIpcCall()
  }

  private _checkAndInitTemplates() {
    let somethingWrong = false
    for (const t of this.settings.templates) {
      const [isValid, metadata, error] = this._checkAndCreateContext(t)
      t.isValid = isValid
      t.type = metadata?.type ?? 'unknown'
      t.error = error ? formatError(error) : null

      if (!isValid) {
        somethingWrong = true
      }
    }

    // 触发一次更新
    if (somethingWrong) {
      this._setting.set('templates', [...this.settings.templates])
    }
  }

  private _checkAndInitShortcuts() {
    let oneOfThemMutated = false
    for (const item of this.settings.sendableItems) {
      const [_, mutated] = this._tryApplyingSendableItemShortcuts(item)
      if (mutated) {
        oneOfThemMutated = true
      }
    }

    if (oneOfThemMutated) {
      this._setting.set('sendableItems', [...this.settings.sendableItems])
    }
  }

  private _updateTemplate(id: string, data: Partial<TemplateDef>) {
    const that = this.settings.templates.find((item) => item.id === id)
    if (!that) {
      return
    }

    if (data.code !== undefined) {
      that.code = data.code

      const [isValid, metadata, error] = this._checkAndCreateContext(that)
      that.isValid = isValid
      that.type = metadata?.type ?? 'unknown'
      that.error = error ? formatError(error) : null
    }

    if (data.name !== undefined) {
      that.name = data.name
    }

    this._setting.set('templates', [...this.settings.templates])

    return that
  }

  private _removeTemplate(id: string) {
    const index = this.settings.templates.findIndex((item) => item.id === id)
    if (index === -1) {
      return false
    }

    if (this._vmContexts[id]) {
      delete this._vmContexts[id]
    }

    this._setting.set(
      'templates',
      this.settings.templates.filter((item) => item.id !== id)
    )

    return true
  }

  private _checkAndCreateContext(
    template: TemplateDef
  ): [boolean, any | null, JS_TEMPLATE_CHECK_RESULT | Error | null] {
    this._vmContexts[template.id] = vm.createContext({
      ...this._getAkariContext(),
      template
    })

    try {
      const script = new vm.Script(template.code)
      script.runInContext(this._vmContexts[template.id])
      const checkResult = checkContextV1(this._vmContexts[template.id])
      if (checkResult !== JS_TEMPLATE_CHECK_RESULT.VALID) {
        return [false, null, checkResult]
      }
    } catch (error: any) {
      this._log.warn('脚本验证失败', template.id, error)
      return [false, null, error]
    }

    return [true, this._vmContexts[template.id].getMetadata(), null]
  }

  private _createTemplate(data?: Partial<TemplateDef>) {
    if (this.settings.templates.length >= InGameSendMain.MAX_ITEMS) {
      this._ipc.sendEvent(InGameSendMain.id, 'error-template-max-items-reached')
      return
    }

    const id = crypto.randomUUID()

    const that: TemplateDef = {
      id,
      name:
        data?.name ||
        i18next.t('in-game-send-main.newTemplate', { index: this.settings.templates.length + 1 }),
      code: data?.code || getExampleTemplate(),
      isValid: true,
      type: 'unknown',
      error: null
    }

    const [isValid, metadata, error] = this._checkAndCreateContext(that)
    that.isValid = isValid
    that.type = metadata?.type ?? 'unknown'
    that.error = error ? formatError(error) : null

    this._setting.set('templates', [...this.settings.templates, that])

    return that
  }

  private async _createPresetTemplate(id: string) {
    switch (id) {
      case 'ongoing-game-default':
        return this._createTemplate({
          name: i18next.t('in-game-send-main.templatePresets.ongoing-game'),
          code: await fs.promises.readFile(defaultTemplate, 'utf-8')
        })
      default:
        return null
    }
  }

  private _createTemplateEnv(options: { target: 'ally' | 'enemy' | 'all' }): TemplateEnv {
    const selfPuuid = this._lc.data.summoner.me?.puuid
    const teams = this._og.state.teams || {}
    const teamEntries = Object.entries(teams)

    const selfTeamEntry = selfPuuid
      ? teamEntries.find(([, members]) => members.includes(selfPuuid))
      : null

    const selfTeamId = selfTeamEntry ? selfTeamEntry[0] : null
    const selfTeamMembers = selfTeamEntry ? selfTeamEntry[1] : null

    const allMembers = teamEntries.flatMap(([, members]) => members)

    const allyMembers = selfTeamMembers ? [...selfTeamMembers] : []
    const enemyMembers = selfTeamMembers
      ? teamEntries.filter(([teamId]) => teamId !== selfTeamId).flatMap(([, members]) => members)
      : allMembers

    const targetMembers =
      options.target === 'all' ? allMembers : options.target === 'ally' ? allyMembers : enemyMembers

    return {
      ...options,

      // base
      locale: this._app.settings.locale,
      utils: {
        isBotQueue,
        isPveQueue
      },

      // computed
      sgpServerId: getSgpServerId(
        this._lc.state.auth?.region || 'UNKNOWN',
        this._lc.state.auth?.rsoPlatformId
      ),
      region: this._lc.state.auth?.region || 'UNKNOWN',
      rsoPlatformId: this._lc.state.auth?.rsoPlatformId || 'UNKNOWN',
      selfPuuid: this._lc.data.summoner.me?.puuid || 'UNKNOWN',
      selfTeamId: selfTeamId || 'UNKNOWN',
      allyMembers,
      enemyMembers,
      allMembers,
      targetMembers,

      // gameData
      gameData: this._lc.data.gameData,

      // og settings
      settings: this._og.settings,

      // state
      teams: this._og.state.teams,
      matchHistory: this._og.state.matchHistory,
      rankedStats: this._og.state.rankedStats,
      summoner: this._og.state.summoner,
      queryStage: this._og.state.queryStage,
      championMastery: this._og.state.championMastery,
      savedInfo: this._og.state.savedInfo,
      championSelections: this._og.state.championSelections,
      positionAssignments: this._og.state.positionAssignments,
      playerStats: this._og.state.playerStats,
      gameTimeline: this._og.state.gameTimeline,
      inferredPremadeTeams: this._og.state.inferredPremadeTeams,
      teamParticipantGroups: this._og.state.teamParticipantGroups,
      additionalGame: this._og.state.additionalGame
    }
  }

  /**
   * 在提供完全的控制权的同时, 危险程度也相应提高
   * @returns
   */
  private _getAkariContext() {
    return {
      MAX_VERSION_SUPPORTED: 10,
      require,
      process,
      akariManager: this._shared.manager,
      console,
      module,
      __filename,
      __dirname,
      mainGlobal: global,
      Buffer,
      setTimeout,
      setInterval,
      setImmediate
    }
  }

  private _getShortcutTargetId(id: string) {
    return {
      ally: `${InGameSendMain.id}/sendable-item/${id}/send-ally`,
      enemy: `${InGameSendMain.id}/sendable-item/${id}/send-enemy`,
      all: `${InGameSendMain.id}/sendable-item/${id}/send-all`
    }
  }

  /**
   * 这个函数尝试处理一个 item 的快捷键设置, 如果某些快捷键无效, 则设置对应项为 null
   * @param item
   * @returns 处理后的 item (部分快捷键字段可能设置为 null)
   */
  private _tryApplyingSendableItemShortcuts(item: SendableItem) {
    const { all, ally, enemy } = this._getShortcutTargetId(item.id)

    let mutated = false
    if (item.sendAllShortcut) {
      if (!this._kbd.getRegistrationByTargetId(all)) {
        try {
          this._kbd.register(all, item.sendAllShortcut, 'last-active', () => {
            this._performSendableItemSend(item.id, 'all')
          })
        } catch (error) {
          this._log.error(`添加快捷键 ${all} 失败`, error)
          item.sendAllShortcut = null
          mutated = true
        }
      }
    } else {
      this._kbd.unregisterByTargetId(all)
    }

    if (item.sendAllyShortcut) {
      if (!this._kbd.getRegistrationByTargetId(ally)) {
        try {
          this._kbd.register(ally, item.sendAllyShortcut, 'last-active', () => {
            this._performSendableItemSend(item.id, 'ally')
          })
        } catch (error) {
          this._log.error(`添加快捷键 ${ally} 失败`, error)
          item.sendAllyShortcut = null
          mutated = true
        }
      }
    } else {
      this._kbd.unregisterByTargetId(ally)
    }

    if (item.sendEnemyShortcut) {
      if (!this._kbd.getRegistrationByTargetId(enemy)) {
        try {
          this._kbd.register(enemy, item.sendEnemyShortcut, 'last-active', () => {
            this._performSendableItemSend(item.id, 'enemy')
          })
        } catch (error) {
          this._log.error(`添加快捷键 ${enemy} 失败`, error)
          item.sendEnemyShortcut = null
          mutated = true
        }
      }
    } else {
      this._kbd.unregisterByTargetId(enemy)
    }

    return [item, mutated] as const
  }

  /**
   * 移除所有快捷键, 在删除时触发
   * @param item
   */
  private _unregisterSendableItemShortcuts(item: SendableItem) {
    const { all, ally, enemy } = this._getShortcutTargetId(item.id)

    this._kbd.unregisterByTargetId(all)
    this._kbd.unregisterByTargetId(ally)
    this._kbd.unregisterByTargetId(enemy)
  }
}
