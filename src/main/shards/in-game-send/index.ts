import { input } from '@hanxven/league-akari-addons'
import { i18next } from '@main/i18n'
import { IAkariShardInitDispose, Shard, SharedGlobalShard } from '@shared/akari-shard'
import { isBotQueue } from '@shared/types/league-client/game-data'
import { isPveQueue } from '@shared/types/league-client/match-history'
import { formatError } from '@shared/utils/errors'
import { sleep } from '@shared/utils/sleep'
import { toJS } from 'mobx'
import fs from 'node:fs'
import vm from 'node:vm'

import { AppCommonMain } from '../app-common'
import { GameClientMain } from '../game-client'
import { AkariIpcMain } from '../ipc'
import { KeyboardShortcutsMain } from '../keyboard-shortcuts'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { OngoingGameMain } from '../ongoing-game'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { JS_TEMPLATE_CHECK_RESULT, checkContextV1, getExampleTemplate } from './js-template'
import { CustomSend, InGameSendSettings, InGameSendState, TemplateDef } from './state'
import defaultTemplate from './templates/default-template.js?asset'

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
   * 还是需要限制一下
   */
  static MAX_CUSTOM_SEND = 200
  static ENTER_KEY_CODE = 13
  static ENTER_KEY_INTERNAL_DELAY = 20

  public readonly settings = new InGameSendSettings()
  public readonly state = new InGameSendState()

  private _log: AkariLogger
  private _setting: SetterSettingService

  private _vmContexts: Record<string, vm.Context> = {}

  /** 用以记录发送状态, 正在进行中将会被取消 */
  private _currentSendingInfo: {
    id: string | null
    isEnd: () => boolean
    isCancelled: () => boolean
    cancel: () => void
  } | null = null

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
        customSend: { default: this.settings.customSend },
        sendStatsEnabled: { default: this.settings.sendStatsEnabled },
        sendStatsTemplate: { default: this.settings.sendStatsTemplate.template },
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
      'customSend',
      'sendStatsEnabled',
      'sendStatsTemplate',
      'sendInterval',
      'templates',
      'cancelShortcut'
    ])

    this._setting.onChange('sendInterval', (v, { setter }) => {
      if (v < 0) {
        return setter(0)
      }

      return setter(v)
    })
  }

  /**
   * 模拟游戏中的发送流程
   * @param messages
   */
  private async _sendSeparatedStringLines(
    messages: string[],
    type: 'champ-select-chat' | 'send-input' = 'send-input', // 选人界面发送 or 键盘模拟游戏中发送
    identifier: string | null = null
  ) {
    const tasks: (() => Promise<void>)[] = []
    const interval = this.settings.sendInterval

    if (type === 'champ-select-chat') {
      const csRoomId = this._lc.data.chat.conversations.championSelect?.id

      if (csRoomId) {
        for (let i = 0; i < messages.length; i++) {
          tasks.push(async () => {
            await this._lc.api.chat.chatSend(csRoomId, messages[i])
          })

          if (i !== messages.length - 1) {
            tasks.push(() => sleep(interval))
          }
        }
      }
    } else {
      for (let i = 0; i < messages.length; i++) {
        tasks.push(async () => {
          await input.instance.sendKey(InGameSendMain.ENTER_KEY_CODE, true)
          await sleep(InGameSendMain.ENTER_KEY_INTERNAL_DELAY)
          await input.instance.sendKey(InGameSendMain.ENTER_KEY_CODE, false)
          await sleep(interval)
          await input.instance.sendString(messages[i])
          await sleep(interval)
          await input.instance.sendKey(InGameSendMain.ENTER_KEY_CODE, true)
          await sleep(InGameSendMain.ENTER_KEY_INTERNAL_DELAY)
          await input.instance.sendKey(InGameSendMain.ENTER_KEY_CODE, false)
        })

        if (i !== messages.length - 1) {
          tasks.push(() => sleep(interval))
        }
      }
    }

    let isCancelled = false
    let isEnd = false

    this._currentSendingInfo = {
      id: identifier,
      isEnd: () => isEnd,
      isCancelled: () => isCancelled,
      cancel: () => {
        isCancelled = true
      }
    }

    for (const task of tasks) {
      if (isCancelled) {
        break
      }
      await task()
    }

    isEnd = true
  }

  private async _performCustomSend(id: string) {
    if (this._currentSendingInfo && !this._currentSendingInfo.isEnd()) {
      this._currentSendingInfo.cancel()
    }

    if (!GameClientMain.isGameClientForeground()) {
      this._log.warn('游戏当前未在前台')
      return
    }

    const s = this.settings.customSend.find((item) => item.id === id)

    if (!s || !s.enabled) {
      return
    }

    const messages = s.message.split('\n').filter((m) => m.trim().length > 0)

    if (messages.length === 0) {
      this._log.warn('没有消息可以发送')
      return
    }

    this._log.info('将模拟发送如下信息', messages)

    await this._sendSeparatedStringLines(messages, 'send-input', s.id)
  }

  static mapNonFunctionObject<T extends Record<string, any>>(obj: T) {
    const result: Record<string, any> = {}

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value !== 'function') {
        result[key] = value
      }
    }

    return result
  }

  private _createTemplateEnv(options: {
    akariVersion: string
    prefix?: string
    target: 'ally' | 'enemy' | 'all'
  }) {
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
      locale: this._app.settings.locale,
      utils: {
        isBotQueue,
        isPveQueue
      },
      region: this._lc.state.auth?.region,
      rsoPlatformId: this._lc.state.auth?.rsoPlatformId,
      selfPuuid: this._lc.data.summoner.me?.puuid,
      selfTeamId,
      allyMembers: allyMembers,
      enemyMembers: enemyMembers,
      allMembers: allMembers,
      targetMembers: targetMembers,
      gameData: toJS(this._lc.data.gameData),
      settings: InGameSendMain.mapNonFunctionObject(this._og.settings),
      teams: toJS(this._og.state.teams),
      matchHistory: toJS(this._og.state.matchHistory),
      rankedStats: toJS(this._og.state.rankedStats),
      summoner: toJS(this._og.state.summoner),
      queryStage: toJS(this._og.state.queryStage),
      championMastery: toJS(this._og.state.championMastery),
      savedInfo: toJS(this._og.state.savedInfo),
      championSelections: toJS(this._og.state.championSelections),
      positionAssignments: toJS(this._og.state.positionAssignments),
      playerStats: toJS(this._og.state.playerStats),
      gameTimeline: toJS(this._og.state.additionalGame),
      inferredPremadeTeams: toJS(this._og.state.inferredPremadeTeams),
      additionalGame: toJS(this._og.state.additionalGame)
    }
  }

  private async _updateCustomSend(id: string, data: Partial<CustomSend>) {
    const index = this.settings.customSend.findIndex((item) => item.id === id)

    if (index === -1) {
      return
    }

    const { id: _, ...rest } = data

    const merged = { ...this.settings.customSend[index], ...rest } as CustomSend

    // 更新了快捷键, 将重新注册
    if (data.shortcut !== undefined) {
      const targetId = `${InGameSendMain.id}/custom-send/${id}`

      if (data.shortcut === null) {
        if (this._kbd.unregisterByTargetId(targetId)) {
          this._log.info(`已删除快捷键 ${targetId}`)
        }
      } else {
        this._kbd.register(targetId, data.shortcut, 'last-active', () => {
          this._performCustomSend(id)
        })
      }
    }

    if (data.message) {
      merged.message = merged.message
        .split('\n')
        .filter((m) => m.trim().length > 0)
        .join('\n')
    }

    this._setting.set('customSend', [
      ...this.settings.customSend.slice(0, index),
      merged,
      ...this.settings.customSend.slice(index + 1)
    ])

    return merged
  }

  /**
   * 删除快捷键并更新状态
   * @param id
   */
  private async _deleteCustomSend(id: string) {
    const targetId = `${InGameSendMain.id}/custom-send/${id}`

    if (this._kbd.unregisterByTargetId(targetId)) {
      this._log.info(`已删除快捷键 ${targetId}`)
    }

    this._setting.set(
      'customSend',
      this.settings.customSend.filter((item) => item.id !== id)
    )

    return id
  }

  private async _handleIpcCall() {
    this._ipc.onCall(
      InGameSendMain.id,
      'updateCustomSend',
      (_, id: string, data: Partial<CustomSend>) => {
        return this._updateCustomSend(id, data)
      }
    )

    this._ipc.onCall(InGameSendMain.id, 'deleteCustomSend', (_, id: string) => {
      return this._deleteCustomSend(id)
    })
  }

  private async _initShortcuts() {}

  async onInit() {
    await this._handleState()
    this._initShortcuts()
    this._handleIpcCall()

    // For Debugging
    this._handleIpcCall_extra()
  }

  // --- 以下施工中, 未实装 ---

  private _handleIpcCall_extra() {
    this._ipc.onCall(
      InGameSendMain.id,
      'createTemplate',
      (_, data?: Partial<Omit<TemplateDef, 'id'>>) => {
        return this._createTemplate(data)
      }
    )

    this._ipc.onCall(InGameSendMain.id, 'createPresetTemplate', (_, id: string) => {
      return this._createPresetTemplate(id)
    })

    this._ipc.onCall(
      InGameSendMain.id,
      'updateTemplate',
      (_, id: string, data: Partial<Omit<TemplateDef, 'id'>>) => {
        this._updateTemplate(id, data)
      }
    )

    this._ipc.onCall(InGameSendMain.id, 'removeTemplate', (_, id: string) => {
      this._removeTemplate(id)
    })

    this._checkAllTemplates()
  }

  // 初始化时检查模板
  private _checkAllTemplates() {
    let somethingWrong = false
    for (const t of this.settings.templates) {
      const [isValid, metadata, error] = this._checkAndCreateContext(t.id, t.code)
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

  private _updateTemplate(id: string, data: Partial<Omit<TemplateDef, 'id' | 'isValid'>>) {
    const that = this.settings.templates.find((item) => item.id === id)
    if (!that) {
      return
    }

    if (data.code !== undefined) {
      that.code = data.code

      const [isValid, metadata, error] = this._checkAndCreateContext(id, data.code)
      that.isValid = isValid
      that.type = metadata?.type ?? 'unknown'
      that.error = error ? formatError(error) : null
    }

    if (data.name !== undefined) {
      that.name = data.name
    }

    this._setting.set('templates', [...this.settings.templates])
  }

  private _removeTemplate(id: string) {
    const index = this.settings.templates.findIndex((item) => item.id === id)
    if (index === -1) {
      return
    }

    if (this._vmContexts[id]) {
      delete this._vmContexts[id]
    }

    this._setting.set(
      'templates',
      this.settings.templates.filter((item) => item.id !== id)
    )
  }

  private _checkAndCreateContext(
    id: string,
    code: string
  ): [boolean, any | null, JS_TEMPLATE_CHECK_RESULT | Error | null] {
    this._vmContexts[id] = vm.createContext({
      ...this._getAkariContext(),
      template: this.settings.templates.find((item) => item.id === id)
    })

    try {
      const script = new vm.Script(code)
      script.runInContext(this._vmContexts[id])
      const checkResult = checkContextV1(this._vmContexts[id])
      if (checkResult !== JS_TEMPLATE_CHECK_RESULT.VALID) {
        return [false, null, checkResult]
      }
    } catch (error: any) {
      this._log.warn('脚本验证失败', id, error)
      return [false, null, error]
    }

    return [true, this._vmContexts[id].getMetadata(), null]
  }

  private _createTemplate(data?: Partial<Omit<TemplateDef, 'id'>>) {
    if (this.settings.templates.length >= InGameSendMain.MAX_CUSTOM_SEND) {
      return
    }

    const id = crypto.randomUUID()

    const that = {
      id,
      name:
        data?.name ||
        i18next.t('in-game-send-main.newTemplate', { index: this.settings.templates.length + 1 }),
      code: data?.code || getExampleTemplate(),
      isValid: true,
      type: null as string | null,
      error: null as string | null
    }

    const [isValid, metadata, error] = this._checkAndCreateContext(id, that.code)
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

  private _getAkariContext() {
    return {
      // at the discretion of the user. We believe that the user can well handle it
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
}
