import { i18next } from '@main/i18n'
import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { formatError } from '@shared/utils/errors'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AutoChampConfigSettings, ChampionRunesConfig, SummonerSpellsConfig } from './state'

export class AutoChampionConfigMain implements IAkariShardInitDispose {
  static id = 'auto-champ-config-main'

  static dependencies = [
    'akari-ipc-main',
    'logger-factory-main',
    'setting-factory-main',
    'league-client-main',
    'mobx-utils-main'
  ]

  static GAME_MODE_TYPE_MAP = {
    CLASSIC: 'normal',
    URF: 'urf',
    ARAM: 'aram',
    NEXUSBLITZ: 'nexusblitz',
    ULTBOOK: 'ultbook'
  }

  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _settingFactory: SettingFactoryMain
  private readonly _log: AkariLogger
  private readonly _lc: LeagueClientMain
  private readonly _setting: SetterSettingService
  private readonly _mobx: MobxUtilsMain
  private readonly _ipc: AkariIpcMain

  public readonly settings = new AutoChampConfigSettings()

  constructor(deps: any) {
    this._loggerFactory = deps['logger-factory-main']
    this._settingFactory = deps['setting-factory-main']
    this._log = this._loggerFactory.create(AutoChampionConfigMain.id)
    this._lc = deps['league-client-main']
    this._mobx = deps['mobx-utils-main']
    this._ipc = deps['akari-ipc-main']
    this._setting = this._settingFactory.create(
      AutoChampionConfigMain.id,
      {
        enabled: { default: this.settings.enabled },
        runesV2: { default: this.settings.runesV2 },
        summonerSpells: { default: this.settings.summonerSpells }
      },
      this.settings
    )
  }

  private _handleIpcCall() {
    this._ipc.onCall(
      AutoChampionConfigMain.id,
      'updateRunes',
      async (championId: number, key: string, runes: ChampionRunesConfig | null) => {
        this.settings.updateRunes(championId, key, runes)
        await this._setting.set('runesV2', this.settings.runesV2)
      }
    )

    this._ipc.onCall(
      AutoChampionConfigMain.id,
      'updateSummonerSpells',
      async (championId: number, key: string, spells: SummonerSpellsConfig | null) => {
        this.settings.updateSummonerSpells(championId, key, spells)
        await this._setting.set('summonerSpells', this.settings.summonerSpells)
      }
    )
  }

  private _handleAutoConfig() {
    this._mobx.reaction(
      () => [this._lc.data.champSelect.currentChampion, this.settings.enabled] as const,
      ([championId, enabled]) => {
        if (!enabled || !championId) {
          return
        }

        if (!this._lc.data.gameflow.session || !this._lc.data.champSelect.session) {
          return
        }

        const localPlayerCellId = this._lc.data.champSelect.session.localPlayerCellId
        const self = this._lc.data.champSelect.session.myTeam.find(
          (player) => player.cellId === localPlayerCellId
        )

        if (!self) {
          return
        }

        const gameMode = this._lc.data.gameflow.session.gameData.queue.gameMode
        const queueType = this._lc.data.gameflow.session.gameData.queue.type
        const selfPosition = self.assignedPosition

        let configKey: string
        // CLASSIC 模式下, 特别区分是否是 RANKED
        if (gameMode === 'CLASSIC') {
          // 目前有 RANKED_FLEX_SR, RANKED_SOLO_5x5
          if (queueType.startsWith('RANKED_')) {
            const rankedConfigKey = `ranked-${selfPosition}`
            if (
              this.settings.runesV2[championId] &&
              this.settings.runesV2[championId][rankedConfigKey]
            ) {
              configKey = rankedConfigKey
            } else {
              configKey = 'ranked-default'
            }
          } else {
            configKey = 'normal'
          }
        } else {
          configKey = AutoChampionConfigMain.GAME_MODE_TYPE_MAP[gameMode] || null
        }

        if (!configKey) {
          return
        }

        const runes = this.settings.runesV2[championId]?.[configKey]
        const spells = this.settings.summonerSpells[championId]?.[configKey]

        if (runes) {
          // no await
          this._createOrReplaceRunesPage(runes, { championId, position: selfPosition })
        }

        if (spells) {
          // no await
          this._applySummonerSpells(spells, { championId, position: selfPosition })
        }
      }
    )

    this._mobx.reaction(
      () => this._lc.data.chat.conversations.championSelect?.id,
      (id) => {
        if (id && this._lc.data.gameflow.phase === 'ChampSelect') {
          if (!this._lc.data.champSelect.session) {
            return
          }

          this._sendInChat(`[League Akari] 已启用 自动英雄配置`)
        }
      }
    )
  }

  private _getRunesName(
    config: ChampionRunesConfig,
    meta: {
      championId: number
      position: string
    }
  ) {
    const { championId, position } = meta

    const championName = this._lc.data.gameData.champions[championId]?.name || championId
    const positionName = position ? i18next.t(`common.lanes.${position}`) : null

    const primaryStyleName =
      this._lc.data.gameData.perkstyles.styles[config.primaryStyleId]?.name || config.primaryStyleId
    const subStyleName =
      this._lc.data.gameData.perkstyles.styles[config.subStyleId]?.name || config.subStyleId
    const perkNames = config.selectedPerkIds.map(
      (id) => this._lc.data.gameData.perks[id]?.name || id
    )

    if (positionName) {
      return {
        pageName: `${championName} - ${positionName}`,
        message: `${championName} - ${positionName} 的符文页已更新为 [${primaryStyleName}] [${subStyleName}] + [${perkNames.join(', ')}]`,
        errorMessage: `${championName} - ${positionName} 的符文页更新失败`
      }
    } else {
      return {
        pageName: `${championName}`,
        message: `${championName} 的符文页已更新为 [${primaryStyleName}] [${subStyleName}] [${perkNames.join(', ')}]`,
        errorMessage: `${championName} 的符文页更新失败`
      }
    }
  }

  private _getSummonerSpellsName(
    config: SummonerSpellsConfig,
    meta: {
      championId: number
      position: string
    }
  ) {
    const { championId, position } = meta

    const championName = this._lc.data.gameData.champions[championId]?.name || championId
    const positionName = position ? i18next.t(`common.lanes.${position}`) : null

    const spell1Name =
      this._lc.data.gameData.summonerSpells[config.spell1Id]?.name || config.spell1Id
    const spell2Name =
      this._lc.data.gameData.summonerSpells[config.spell2Id]?.name || config.spell2Id

    if (positionName) {
      return {
        message: `${championName} - ${positionName} 的召唤师技能已更新为 [${spell1Name}] [${spell2Name}]`,
        errorMessage: `${championName} - ${positionName} 的召唤师技能更新失败`
      }
    } else {
      return {
        message: `${championName} 的召唤师技能已更新为 [${spell1Name}] [${spell2Name}]`,
        errorMessage: `${championName} 的召唤师技能更新失败`
      }
    }
  }

  private async _createOrReplaceRunesPage(
    config: ChampionRunesConfig,
    meta: {
      championId: number
      position: string
    }
  ) {
    const { message, pageName, errorMessage } = this._getRunesName(config, meta)

    try {
      const inventory = (await this._lc.api.perks.getPerkInventory()).data
      if (inventory.canAddCustomPage) {
        const { data: added } = await this._lc.api.perks.postPerkPage({
          name: pageName,
          isEditable: true,
          primaryStyleId: config.primaryStyleId.toString()
        })
        await this._lc.api.perks.putPage({
          id: added.id,
          isRecommendationOverride: false,
          isTemporary: false,
          name: `[Akari] ${pageName}`,
          primaryStyleId: config.primaryStyleId,
          selectedPerkIds: config.selectedPerkIds,
          subStyleId: config.subStyleId
        })
        await this._lc.api.perks.putCurrentPage(added.id)
      } else {
        const pages = (await this._lc.api.perks.getPerkPages()).data
        if (!pages.length) {
          return
        }

        const page1 = pages[0]
        await this._lc.api.perks.putPage({
          id: page1.id,
          isRecommendationOverride: false,
          isTemporary: false,
          name: `[Akari] ${pageName}`,
          primaryStyleId: config.primaryStyleId,
          selectedPerkIds: config.selectedPerkIds,
          subStyleId: config.subStyleId
        })
        await this._lc.api.perks.putCurrentPage(page1.id)
      }

      await this._sendInChat(message)
      this._log.info(`符文页已更新`, config, meta)
    } catch (error) {
      this._ipc.sendEvent(AutoChampionConfigMain.id, 'error-runes-update', formatError(error))
      this._log.warn(`无法更新符文页`, error)
      await this._sendInChat(errorMessage)
    }
  }

  private async _applySummonerSpells(
    config: SummonerSpellsConfig,
    meta: {
      championId: number
      position: string
    }
  ) {
    const { message, errorMessage } = this._getSummonerSpellsName(config, meta)

    try {
      await this._lc.api.champSelect.setSummonerSpells({
        spell1Id: config.spell1Id,
        spell2Id: config.spell2Id
      })

      await this._sendInChat(message)
    } catch (error) {
      this._ipc.sendEvent(AutoChampionConfigMain.id, 'error-spells-update', formatError(error))
      this._log.warn(`无法更新召唤师技能`, error)
      await this._sendInChat(errorMessage)
    }
  }

  private async _sendInChat(message: string) {
    if (!this._lc.data.chat.conversations.championSelect) {
      return
    }

    try {
      await this._lc.api.chat.chatSend(
        this._lc.data.chat.conversations.championSelect.id,
        `[League Akari] ${message}`,
        'celebration'
      )
    } catch (error) {
      this._ipc.sendEvent(AutoChampionConfigMain.id, 'error-chat-send', formatError(error))
      this._log.warn(`无法发送信息`, error)
    }
  }

  async onInit() {
    await this._setting.applyToState()

    this._mobx.propSync(AutoChampionConfigMain.id, 'settings', this.settings, [
      'enabled',
      'runesV2',
      'summonerSpells'
    ])

    this._handleIpcCall()
    this._handleAutoConfig()
  }
}
