import input from '@main/native/la-input-win64.node'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { AkariSharedGlobalShard, SHARED_GLOBAL_ID } from '@shared/akari-shard/manager'
import { isBotQueue } from '@shared/types/league-client/game-data'
import { isPveQueue } from '@shared/types/league-client/match-history'
import { sleep } from '@shared/utils/sleep'
import { Eta } from 'eta'
import { TemplateFunction } from 'eta/dist/types/compile'
import { toJS } from 'mobx'
import fs from 'node:fs'

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
import defaultTemplate from './default-template.ejs?asset'
import { CustomSend, InGameSendSettings, InGameSendState } from './state'

/**
 * 用于在游戏中模拟发送的相关功能
 *  - 游戏内发送消息
 *  - 英雄选择阶段发送消息
 *  - 一些其他的发送场景
 */
export class InGameSendMain implements IAkariShardInitDispose {
  static id = 'in-game-send-main'
  static dependencies = [
    SHARED_GLOBAL_ID,
    'akari-ipc-main',
    'mobx-utils-main',
    'league-client-main',
    'logger-factory-main',
    'setting-factory-main',
    'keyboard-shortcuts-main',
    'ongoing-game-main',
    'app-common-main'
  ]

  /**
   * 还是需要限制一下
   */
  static MAX_CUSTOM_SEND = 20
  static SEND_INTERVAL_MS = 65
  static ENTER_KEY_CODE = 13

  public readonly settings = new InGameSendSettings()
  public readonly state = new InGameSendState()

  private _loggerFactory: LoggerFactoryMain
  private _settingFactory: SettingFactoryMain
  private _log: AkariLogger
  private _mobx: MobxUtilsMain
  private _ipc: AkariIpcMain
  private _setting: SetterSettingService
  private _kbd: KeyboardShortcutsMain
  private _og: OngoingGameMain
  private _lc: LeagueClientMain
  private _shared: AkariSharedGlobalShard
  private _app: AppCommonMain

  private readonly _eta = new Eta()
  private _customCompiledFn: TemplateFunction | null = null
  private _defaultCompliedFn: TemplateFunction | null = null

  /** 用以记录发送状态, 正在进行中将会被取消 */
  private _currentSending: string | null = null

  constructor(deps: any) {
    this._loggerFactory = deps['logger-factory-main']
    this._settingFactory = deps['setting-factory-main']
    this._mobx = deps['mobx-utils-main']
    this._ipc = deps['akari-ipc-main']
    this._kbd = deps['keyboard-shortcuts-main']
    this._og = deps['ongoing-game-main']
    this._lc = deps['league-client-main']
    this._shared = deps[SHARED_GLOBAL_ID]
    this._app = deps['app-common-main']
    this._log = this._loggerFactory.create(InGameSendMain.id)
    this._setting = this._settingFactory.create(
      InGameSendMain.id,
      {
        customSend: { default: this.settings.customSend },
        sendAllyShortcut: { default: this.settings.sendAllyShortcut },
        sendEnemyShortcut: { default: this.settings.sendEnemyShortcut },
        sendAllAlliesShortcut: { default: this.settings.sendAllAlliesShortcut },
        sendAllEnemiesShortcut: { default: this.settings.sendAllEnemiesShortcut },
        sendStatsEnabled: { default: this.settings.sendStatsEnabled },
        sendStatsTemplate: { default: this.settings.sendStatsTemplate.template },
        sendStatsUseDefaultTemplate: { default: this.settings.sendStatsUseDefaultTemplate }
      },
      this.settings
    )
  }

  private async _handleState() {
    await this._setting.applyToState()

    this._mobx.propSync(InGameSendMain.id, 'settings', this.settings, [
      'customSend',
      'sendAllyShortcut',
      'sendEnemyShortcut',
      'sendAllAlliesShortcut',
      'sendAllEnemiesShortcut',
      'sendStatsEnabled',
      'sendStatsTemplate',
      'sendStatsUseDefaultTemplate'
    ])
  }

  /**
   * 模拟游戏中的发送流程
   * @param messages
   */
  private async _sendSeparatedStringLines(
    messages: string[],
    taskId: string,
    type: 'champ-select-chat' | 'keyboard' = 'keyboard' // 选人界面发送 or 键盘模拟游戏中发送
  ) {
    if (this._currentSending === taskId) {
      this._currentSending = null
      return
    } else {
      if (messages.length === 0) {
        this._currentSending = null
        return
      }

      this._currentSending = taskId
    }

    const tasks: (() => Promise<void>)[] = []

    if (type === 'champ-select-chat') {
      const csRoomId = this._lc.data.chat.conversations.championSelect?.id

      if (csRoomId) {
        for (let i = 0; i < messages.length; i++) {
          tasks.push(async () => {
            await this._lc.api.chat.chatSend(csRoomId, messages[i])
          })

          if (i !== messages.length - 1) {
            tasks.push(() => sleep(InGameSendMain.SEND_INTERVAL_MS))
          }
        }
      }
    } else {
      for (let i = 0; i < messages.length; i++) {
        tasks.push(async () => {
          input.sendKey(InGameSendMain.ENTER_KEY_CODE, true)
          input.sendKey(InGameSendMain.ENTER_KEY_CODE, false)
          await sleep(InGameSendMain.SEND_INTERVAL_MS)
          input.sendKeys(messages[i])
          await sleep(InGameSendMain.SEND_INTERVAL_MS)
          input.sendKey(InGameSendMain.ENTER_KEY_CODE, true)
          input.sendKey(InGameSendMain.ENTER_KEY_CODE, false)
        })

        if (i !== messages.length - 1) {
          tasks.push(() => sleep(InGameSendMain.SEND_INTERVAL_MS))
        }
      }
    }

    for (const task of tasks) {
      if (this._currentSending !== taskId) {
        return
      }

      await task()
    }

    this._currentSending = null
  }

  private async _performCustomSend(id: string) {
    const s = this.settings.customSend.find((item) => item.id === id)

    if (!s || !s.enabled) {
      return
    }

    const messages = s.message.split('\n').filter((m) => m.trim().length > 0)

    await this._sendSeparatedStringLines(messages, s.id)
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
      gameData: toJS(this._lc.data.gameData),
      allyMembers: allyMembers,
      enemyMembers: enemyMembers,
      allMembers: allMembers,
      targetMembers: targetMembers,
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
      gameTimeline: toJS(this._og.state.gameTimeline),
      premadeTeams: toJS(this._og.state.premadeTeams)
    }
  }

  private async _performStatsSend(options: {
    akariVersion: string
    prefix?: string
    target: 'ally' | 'enemy' | 'all'
  }) {
    if (!this.settings.sendStatsEnabled || this._og.state.queryStage.phase === 'unavailable') {
      return
    }

    const sendType =
      this._og.state.queryStage.phase === 'champ-select' ? 'champ-select-chat' : 'keyboard'

    if (sendType === 'keyboard' && !GameClientMain.isGameClientForeground()) {
      this._log.warn('游戏当前未在前台')
      return
    }

    if (this.settings.sendStatsUseDefaultTemplate) {
      if (!this._defaultCompliedFn) {
        this._log.warn('默认发送模板未编译, 无法发送')
        return
      }

      try {
        const messages = this._defaultCompliedFn
          .call(this._eta, this._createTemplateEnv(options))
          .split('\n')
          .filter((m) => m.trim().length > 0)
          .map((m) => (options.prefix && sendType === 'keyboard' ? `${options.prefix} ${m}` : m))

        await this._sendSeparatedStringLines(messages, 'send-stats', sendType)
      } catch (error) {
        this._log.warn('发送时模板发生错误', error)
      }
    } else {
      if (!this._customCompiledFn) {
        this._log.warn('自定义发送模板未编译, 无法发送')
        return
      }

      try {
        const messages = this._customCompiledFn
          .call(this._eta, this._createTemplateEnv(options))
          .split('\n')
          .filter((m) => m.trim().length > 0)
          .map((m) => (options.prefix ? `${options.prefix} ${m}` : m))

        this._log.info('将模拟发送如下信息', messages)

        await this._sendSeparatedStringLines(messages, 'send-stats', sendType)
      } catch (error) {
        this._ipc.sendEvent(InGameSendMain.id, 'send-stats-error', (error as Error).message)
        this._log.warn('发送时模板发生错误', error)
      }
    }
  }

  private async createCustomSend(name = '') {
    if (this.settings.customSend.length >= InGameSendMain.MAX_CUSTOM_SEND) {
      return
    }

    const newItem = {
      id: crypto.randomUUID(),
      enabled: false,
      name,
      message: '',
      shortcut: null
    }

    this._setting.set('customSend', [...this.settings.customSend, newItem])

    return newItem
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
        } else {
          this._log.warn(`删除快捷键 ${targetId} 失败, 未找到对应快捷键`)
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
    } else {
      this._log.warn(`删除快捷键 ${targetId} 失败, 未找到对应快捷键`)
    }

    this._setting.set(
      'customSend',
      this.settings.customSend.filter((item) => item.id !== id)
    )

    return id
  }

  private async _updateSendStatsTemplate(template: string) {
    try {
      this._customCompiledFn = this._eta.compile(template)
      this._setting.set('sendStatsTemplate', { template, isValid: true })
      this._log.info('编译自定义模板')
    } catch (error) {
      this._customCompiledFn = null
      this._setting.set('sendStatsTemplate', { template, isValid: false })
      this._log.warn('编译自定义模板失败', error)
    }

    return this.settings.sendStatsTemplate
  }

  private async _handleIpcCall() {
    this._ipc.onCall(InGameSendMain.id, 'createCustomSend', (name?: string) => {
      return this.createCustomSend(name)
    })

    this._ipc.onCall(
      InGameSendMain.id,
      'updateCustomSend',
      (id: string, data: Partial<CustomSend>) => {
        return this._updateCustomSend(id, data)
      }
    )

    this._ipc.onCall(InGameSendMain.id, 'deleteCustomSend', (id: string) => {
      return this._deleteCustomSend(id)
    })

    this._ipc.onCall(InGameSendMain.id, 'updateSendStatsTemplate', (template: string) => {
      return this._updateSendStatsTemplate(template)
    })

    this._ipc.onCall(InGameSendMain.id, 'dryRunStatsSend', () => {
      return this._dryRunStatsSend()
    })
  }

  private async _initShortcuts() {
    // 程序启动时, 按照持久化的设置项进行初始化快捷键流程
    // 目前的快捷键初始化逻辑存在较大冗余, 等待日后进一步封装
    const checked: CustomSend[] = []
    for (const s of this.settings.customSend) {
      if (s.shortcut) {
        const r = this._kbd.getRegistration(s.shortcut)

        if (r) {
          checked.push({ ...s, shortcut: null })
          this._log.warn(
            `尝试初始化快捷键 ${s.shortcut} 时, 发现快捷键已被 ${r.targetId} 占用, 将重置快捷键`,
            s
          )
        } else {
          // 不存在则可以直接注册, 并完成初始化监听
          const targetId = `${InGameSendMain.id}/custom-send/${s.id}`
          this._kbd.register(targetId, s.shortcut, 'last-active', () => {
            this._performCustomSend(s.id)
          })
          checked.push(s)
        }
      } else {
        checked.push(s)
      }
    }

    await this._setting.set('customSend', checked)

    const sendStatsShortcuts = [
      {
        shortcut: this.settings.sendAllyShortcut,
        targetId: `${InGameSendMain.id}/send-ally`,
        options: {
          akariVersion: this._shared.global.version,
          target: 'ally' as 'ally' | 'enemy'
        },
        resetter: async () => {
          await this._setting.set('sendAllyShortcut', null)
        }
      },
      {
        shortcut: this.settings.sendEnemyShortcut,
        targetId: `${InGameSendMain.id}/send-enemy`,
        options: {
          akariVersion: this._shared.global.version,
          target: 'enemy' as 'ally' | 'enemy'
        },
        resetter: async () => {
          await this._setting.set('sendEnemyShortcut', null)
        }
      },
      {
        shortcut: this.settings.sendAllAlliesShortcut,
        targetId: `${InGameSendMain.id}/send-all-allies`,
        options: {
          akariVersion: this._shared.global.version,
          prefix: '/all',
          target: 'ally' as 'ally' | 'enemy'
        },
        resetter: async () => {
          await this._setting.set('sendAllAlliesShortcut', null)
        }
      },
      {
        shortcut: this.settings.sendAllEnemiesShortcut,
        targetId: `${InGameSendMain.id}/send-all-enemies`,
        options: {
          akariVersion: this._shared.global.version,
          prefix: '/all',
          target: 'enemy' as 'ally' | 'enemy'
        },
        resetter: async () => {
          await this._setting.set('sendAllEnemiesShortcut', null)
        }
      }
    ].filter((item) => item.shortcut)

    for (const s of sendStatsShortcuts) {
      const r = this._kbd.getRegistration(s.shortcut!)

      if (r) {
        s.resetter()
        this._log.warn(
          `尝试初始化快捷键 ${s.shortcut} 时, 发现快捷键已被 ${r.targetId} 占用, 将重置快捷键`
        )
      } else {
        this._kbd.register(s.targetId, s.shortcut!, 'last-active', () => {
          this._performStatsSend(s.options)
        })
      }
    }

    // 很乱, 但暂时先这样写
    this._setting.onChange('sendAllyShortcut', async (v, { setter }) => {
      if (v === null) {
        this._kbd.unregisterByTargetId(`${InGameSendMain.id}/send-ally`)
      } else {
        try {
          this._kbd.register(`${InGameSendMain.id}/send-ally`, v, 'last-active', () => {
            this._performStatsSend({
              akariVersion: this._shared.global.version,
              target: 'ally'
            })
          })
        } catch {
          this._log.warn('注册快捷键失败', v)
          await setter(null)
          return
        }
      }

      await setter()
    })

    this._setting.onChange('sendEnemyShortcut', async (v, { setter }) => {
      if (v === null) {
        this._kbd.unregisterByTargetId(`${InGameSendMain.id}/send-enemy`)
      } else {
        try {
          this._kbd.register(`${InGameSendMain.id}/send-enemy`, v, 'last-active', () => {
            this._performStatsSend({
              akariVersion: this._shared.global.version,
              target: 'enemy'
            })
          })
        } catch {
          this._log.warn('注册快捷键失败', v)
          await setter(null)
          return
        }
      }

      await setter()
    })

    this._setting.onChange('sendAllAlliesShortcut', async (v, { setter }) => {
      if (v === null) {
        this._kbd.unregisterByTargetId(`${InGameSendMain.id}/send-all-allies`)
      } else {
        try {
          this._kbd.register(`${InGameSendMain.id}/send-all-allies`, v, 'last-active', () => {
            this._performStatsSend({
              akariVersion: this._shared.global.version,
              prefix: '/all',
              target: 'ally'
            })
          })
        } catch {
          this._log.warn('注册快捷键失败', v)
          await setter(null)
          return
        }
      }

      await setter()
    })

    this._setting.onChange('sendAllEnemiesShortcut', async (v, { setter }) => {
      if (v === null) {
        this._kbd.unregisterByTargetId(`${InGameSendMain.id}/send-all-enemies`)
      } else {
        try {
          this._kbd.register(`${InGameSendMain.id}/send-all-enemies`, v, 'last-active', () => {
            this._performStatsSend({
              akariVersion: this._shared.global.version,
              prefix: '/all',
              target: 'enemy'
            })
          })
        } catch {
          this._log.warn('注册快捷键失败', v)
          await setter(null)
          return
        }
      }

      await setter()
    })
  }

  private async _initTemplateCompilation() {
    const defaultT = await fs.promises.readFile(defaultTemplate, 'utf-8')

    try {
      this._defaultCompliedFn = this._eta.compile(defaultT)
    } catch (error) {
      // 大无语事件发生, 理论来说不太可能出现的情况
      this._defaultCompliedFn = null
      this._log.error('发生了预料之外的情况，默认发送模板无法编译成功', error)
    }

    if (this.settings.sendStatsTemplate.isValid) {
      try {
        this._customCompiledFn = this._eta.compile(this.settings.sendStatsTemplate.template)
        this._log.info('编译自定义发送模板')
      } catch (error) {
        this.settings.setSendStatsTemplate(this.settings.sendStatsTemplate.template, false)
        this._customCompiledFn = null
        this._log.warn('自定义发送模板无法编译成功', error)
      }
    }
  }

  /**
   * 仅用于测试发送内容, 返回字符串
   */
  private async _dryRunStatsSend() {
    if (this._og.state.queryStage.phase === 'unavailable') {
      this._log.warn('Dry-Run: 当前不在可发送阶段，无数据')
      return { error: true, reason: 'stage-unavailable', data: [] }
    }

    const usingFn = this.settings.sendStatsUseDefaultTemplate
      ? this._defaultCompliedFn
      : this._customCompiledFn

    if (!usingFn) {
      this._log.warn('Dry-Run: 目标模板未编译, 无法发送')
      return { error: true, reason: 'not-compiled', data: [] }
    }

    try {
      const messages = usingFn
        .call(
          this._eta,
          this._createTemplateEnv({
            akariVersion: this._shared.global.version,
            target: 'all'
          })
        )
        .split('\n')
        .filter((m) => m.trim().length > 0)

      return { error: false, reason: null, data: messages }
    } catch (error) {
      this._log.warn('Dry-Run: 执行模板发生错误', error)
      return { error: true, reason: 'execution-error', data: [], extra: (error as Error).message }
    }
  }

  async onInit() {
    await this._handleState()
    await this._initTemplateCompilation()
    this._initShortcuts()
    this._handleIpcCall()
  }
}
