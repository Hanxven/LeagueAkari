import { i18next } from '@main/i18n'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { formatError } from '@shared/utils/errors'
import { comparer } from 'mobx'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AutoChampConfigSettings, ChampionRunesConfig, SummonerSpellsConfig } from './state'

@Shard(AutoChampionConfigMain.id)
export class AutoChampionConfigMain implements IAkariShardInitDispose {
  static id = 'auto-champ-config-main'

  static GAME_MODE_TYPE_MAP = {
    CLASSIC: 'normal',
    URF: 'urf',
    ARAM: 'aram',
    NEXUSBLITZ: 'nexusblitz',
    ULTBOOK: 'ultbook'
  }

  public readonly settings = new AutoChampConfigSettings()

  private readonly _log: AkariLogger

  constructor(
    private readonly _loggerFactory: LoggerFactoryMain,
    private readonly _settingFactory: SettingFactoryMain,
    private readonly _lc: LeagueClientMain,
    private readonly _setting: SetterSettingService,
    private readonly _mobx: MobxUtilsMain,
    private readonly _ipc: AkariIpcMain
  ) {
    this._log = _loggerFactory.create(AutoChampionConfigMain.id)
    this._setting = _settingFactory.register(
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
      async (_, championId: number, key: string, runes: ChampionRunesConfig | null) => {
        this.settings.updateRunes(championId, key, runes)
        await this._setting.set('runesV2', this.settings.runesV2)
      }
    )

    this._ipc.onCall(
      AutoChampionConfigMain.id,
      'updateSummonerSpells',
      async (_, championId: number, key: string, spells: SummonerSpellsConfig | null) => {
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
      () =>
        [
          this._lc.data.chat.conversations.championSelect?.id,
          Boolean(this._lc.data.gameflow.session),
          Boolean(this._lc.data.champSelect.session)
        ] as const,
      ([id, g, c]) => {
        if (
          this.settings.enabled &&
          id &&
          this._lc.data.gameflow.phase === 'ChampSelect' &&
          g &&
          c
        ) {
          const gSession = this._lc.data.gameflow.session!
          const cSession = this._lc.data.champSelect.session!

          const localPlayerCellId = cSession.localPlayerCellId
          const self = cSession.myTeam.find((player) => player.cellId === localPlayerCellId)

          if (!self) {
            return
          }

          const gameMode = gSession.gameData.queue.gameMode
          const queueType = gSession.gameData.queue.type
          const selfPosition = self.assignedPosition

          const isRankedMode = queueType.startsWith('RANKED_')

          let configKey: string
          if (gameMode === 'CLASSIC') {
            if (isRankedMode) {
              configKey = `ranked-${selfPosition}`
            } else {
              configKey = 'normal'
            }
          } else {
            configKey = AutoChampionConfigMain.GAME_MODE_TYPE_MAP[gameMode] || null
          }

          if (!configKey) {
            return
          }

          // 寻找已配置的所有英雄
          const runesChampionIds: number[] = []
          const spellsChampionIds: number[] = []

          Object.entries(this.settings.runesV2).forEach(([championId, runesConfig]) => {
            if (runesConfig[configKey]) {
              runesChampionIds.push(Number(championId))
            } else {
              if (isRankedMode && runesConfig['ranked-default']) {
                runesChampionIds.push(Number(championId))
              }
            }
          })

          Object.entries(this.settings.summonerSpells).forEach(([championId, spellsConfig]) => {
            if (spellsConfig[configKey]) {
              spellsChampionIds.push(Number(championId))
            } else {
              if (isRankedMode && spellsConfig['ranked-default']) {
                spellsChampionIds.push(Number(championId))
              }
            }
          })

          const unionChampionIds = Array.from(new Set([...runesChampionIds, ...spellsChampionIds]))
          const names = unionChampionIds
            .map((id) => this._lc.data.gameData.champions[id]?.name || id)
            .slice(0, 16)

          if (names.length) {
            this._sendInChat(
              i18next.t('auto-champ-config-main.auto-config-enabled', {
                names: names.join(', ')
              })
            )
          } else {
            this._sendInChat(i18next.t('auto-champ-config-main.auto-config-enabled-no-champion'))
          }
        }
      },
      { equals: comparer.shallow }
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
        pageName: `[Akari] ${i18next.t('auto-champ-config-main.runes.pageNameWithPosition', {
          name: championName,
          position: positionName
        })}`,
        message: i18next.t('auto-champ-config-main.runes.appliedWithPosition', {
          name: championName,
          primary: primaryStyleName,
          sub: subStyleName,
          all: perkNames.join(', '),
          position: positionName
        }),
        errorMessage: i18next.t('auto-champ-config-main.runes.errorAppliedWithPosition', {
          name: championName,
          position: positionName
        })
      }
    } else {
      return {
        pageName: `[Akari] ${i18next.t('auto-champ-config-main.runes.pageName', {
          name: championName
        })}`,
        message: i18next.t('auto-champ-config-main.runes.applied', {
          name: championName,
          primary: primaryStyleName,
          sub: subStyleName,
          all: perkNames.join(', ')
        }),
        errorMessage: i18next.t('auto-champ-config-main.runes.errorApplied', {
          name: championName
        })
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
        message: i18next.t('auto-champ-config-main.summonerSpells.appliedWithPosition', {
          name: championName,
          spell1: spell1Name,
          spell2: spell2Name,
          position: positionName
        }),
        errorMessage: i18next.t('auto-champ-config-main.summonerSpells.errorAppliedWithPosition', {
          name: championName,
          position: positionName
        })
      }
    } else {
      return {
        message: i18next.t('auto-champ-config-main.summonerSpells.applied', {
          name: championName,
          spell1: spell1Name,
          spell2: spell2Name
        }),
        errorMessage: i18next.t('auto-champ-config-main.summonerSpells.errorApplied', {
          name: championName
        })
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
          name: pageName,
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
          name: pageName,
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
