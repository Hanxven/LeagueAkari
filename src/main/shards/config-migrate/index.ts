import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { EntityManager, Equal } from 'typeorm'

import { AkariLogger } from '../logger-factory'
import { StorageMain } from '../storage'
import { Setting } from '../storage/entities/Settings'

/**
 * 将旧的设置项重新设置, 并设置数据
 */
export class ConfigMigrateMain implements IAkariShardInitDispose {
  static id = 'config-migrate-main'

  /**
   * 设置较高优先级, 以优先加载
   */
  static priority = 2992

  static dependencies = ['storage-main', 'logger-factory-main']

  static MIGRATION_FROM_126 = 'akari-migration-from-1.2.6_patch2'
  static MIGRATION_FROM_134 = 'akari-migration-from-1.3.4_patch1'

  private readonly _st: StorageMain
  private readonly _log: AkariLogger

  constructor(deps: any) {
    this._st = deps['storage-main']
    this._log = deps['logger-factory-main'].create(ConfigMigrateMain.id)
  }

  private async _do(manager: EntityManager, from: string, to: string) {
    const s = await manager.findOneBy(Setting, { key: Equal(from) })

    if (!s) {
      return
    }

    await manager.save(Setting.create(to, s.value))
    await manager.remove(s)
  }

  // NOTE: drop support before League Akari 1.1.x
  private async _migrateFrom126(manager: EntityManager) {
    const hasMigratedSymbol = await manager.findOneBy(Setting, {
      key: Equal(ConfigMigrateMain.MIGRATION_FROM_126)
    })

    if (hasMigratedSymbol) {
      return
    }

    this._log.info('开始迁移设置项', ConfigMigrateMain.MIGRATION_FROM_126)

    await this._do(manager, 'auxiliary-window/opacity', 'window-manager-main/auxWindowOpacity')
    await this._do(manager, 'auxiliary-window/enabled', 'window-manager-main/auxWindowEnabled')
    await this._do(manager, 'respawn-timer/enabled', 'respawn-timer-main/enabled')
    await this._do(manager, 'auto-reply/text', 'auto-reply-main/text')
    await this._do(manager, 'auto-reply/enabled', 'auto-reply-main/enabled')
    await this._do(manager, 'auto-reply/enableOnAway', 'auto-reply-main/enableOnAway')
    await this._do(
      manager,
      'auxiliary-window/functionality',
      'window-manager-main/auxWindowFunctionality'
    )
    await this._do(manager, 'auto-gameflow/autoHonorEnabled', 'auto-gameflow-main/autoHonorEnabled')
    await this._do(manager, 'auto-gameflow/playAgainEnabled', 'auto-gameflow-main/playAgainEnabled')
    await this._do(
      manager,
      'auto-gameflow/autoAcceptEnabled',
      'auto-gameflow-main/autoAcceptEnabled'
    )
    await this._do(
      manager,
      'auto-gameflow/autoAcceptDelaySeconds',
      'auto-gameflow-main/autoAcceptDelaySeconds'
    )
    await this._do(
      manager,
      'auto-gameflomanager, w/autoMatchmakingEnabled',
      'auto-gameflomanager, w-main/autoMatchmakingEnabled'
    ),
      await this._do(
        manager,
        'auto-gameflomanager, w/autoMatchmakingDelaySeconds',
        'auto-gameflomanager, w-main/autoMatchmakingDelaySeconds'
      ),
      await this._do(
        manager,
        'auto-gameflomanager, w/autoMatchmakingMinimumMembers',
        'auto-gameflomanager, w-main/autoMatchmakingMinimumMembers'
      ),
      await this._do(
        manager,
        'auto-gameflomanager, w/autoMatchmakingWaitForInvitees',
        'auto-gameflomanager, w-main/autoMatchmakingWaitForInvitees'
      ),
      await this._do(
        manager,
        'auto-gameflomanager, w/autoMatchmakingRematchStrategy',
        'auto-gameflomanager, w-main/autoMatchmakingRematchStrategy'
      ),
      await this._do(
        manager,
        'auto-gameflomanager, w/autoMatchmakingRematchFixedDuration',
        'auto-gameflomanager, w-main/autoMatchmakingRematchFixedDuration'
      ),
      await this._do(
        manager,
        'app/showFreeSoftwareDeclaration',
        'app-common-main/showFreeSoftwareDeclaration'
      )
    await this._do(manager, 'app/useWmic', 'league-client-ux-main/useWmic')
    await this._do(manager, 'app/isInKyokoMode', 'app-common-main/isInKyokoMode')
    await this._do(manager, 'auto-update/autoCheckUpdates', 'self-update-main/autoCheckUpdates')
    await this._do(manager, 'auto-update/downloadSource', 'self-update-main/downloadSource')
    await this._do(manager, 'auxiliary-window/isPinned', 'window-manager-main/auxWindowPinned')
    await this._do(
      manager,
      'auxiliary-window/showSkinSelector',
      'window-manager-main/auxWindowShowSkinSelector'
    )
    await this._do(manager, 'lcu-connection/autoConnect', 'league-client-main/autoConnect')
    await this._do(manager, 'auto-select/normalModeEnabled', 'auto-select-main/normalModeEnabled')
    await this._do(manager, 'auto-select/expectedChampions', 'auto-select-main/expectedChampions')
    await this._do(
      manager,
      'auto-select/manager, selectTeammateIntendedChampion',
      'auto-select-manager, main/selectTeammateIntendedChampion'
    ),
      await this._do(manager, 'auto-select/showIntent', 'auto-select-main/showIntent')
    await this._do(manager, 'auto-select/benchModeEnabled', 'auto-select-main/benchModeEnabled')
    await this._do(
      manager,
      'auto-select/benchExpectedChampions',
      'auto-select-main/benchExpectedChampions'
    )
    await this._do(manager, 'auto-select/grabDelaySeconds', 'auto-select-main/grabDelaySeconds')
    await this._do(manager, 'auto-select/banEnabled', 'auto-select-main/banEnabled')
    await this._do(manager, 'auto-select/bannedChampions', 'auto-select-main/bannedChampions')
    await this._do(
      manager,
      'auto-select/banTeammateIntendedChampion',
      'auto-select-main/banTeammateIntendedChampion'
    )
    await this._do(
      manager,
      'core-functionality/fetchAfterGame',
      'match-history-tabs-renderer/refreshTabsAfterGameEnds'
    )
    await this._do(
      manager,
      'core-functionality/playerAnalysisFetchConcurrency',
      'ongoing-game-main/concurrency'
    )
    await this._do(
      manager,
      'core-functionality/ongoingAnalysisEnabled',
      'ongoing-game-main/enabled'
    )
    await this._do(
      manager,
      'core-functionality/matchHistoryLoadCount',
      'ongoing-game-main/matchHistoryLoadCount'
    )
    await this._do(
      manager,
      'core-functionality/preMadeTeamThreshold',
      'ongoing-game-main/premadeTeamThreshold'
    )
    await this._do(
      manager,
      'auto-update/lastReadAnnouncementSha',
      'self-update-main/lastReadAnnouncementSha'
    )
    await this._do(
      manager,
      'auto-select/benchSelectFirstAvailableChampion',
      'auto-select-main/benchSelectFirstAvailableChampion'
    )
    await this._do(
      manager,
      'core-functionality/useSgpApi',
      'ongoing-game-main/matchHistoryUseSgpApi'
    )
    await this._do(
      manager,
      'auto-gameflow/autoAcceptInvitationEnabled',
      'auto-gameflow-main/autoHandleInvitationsEnabled'
    )
    await this._do(
      manager,
      'auto-gameflow/invitationHandlingStrategies',
      'auto-gameflow-main/invitationHandlingStrategies'
    )
    await this._do(
      manager,
      'auto-gameflow/autoReconnectEnabled',
      'auto-gameflow-main/autoReconnectEnabled'
    )

    await manager.save(
      Setting.create(ConfigMigrateMain.MIGRATION_FROM_126, ConfigMigrateMain.MIGRATION_FROM_126)
    )

    this._log.info(`迁移完成, 到 ${ConfigMigrateMain.MIGRATION_FROM_126}`)
  }

  private async _migrateFrom134(manager: EntityManager) {
    const hasMigratedSymbol = await manager.findOneBy(Setting, {
      key: Equal(ConfigMigrateMain.MIGRATION_FROM_134)
    })

    if (hasMigratedSymbol) {
      return
    }

    this._log.info('开始迁移设置项', ConfigMigrateMain.MIGRATION_FROM_134)

    await this._do(
      manager,
      'window-manager-main/auxWindowFunctionalityBounds',
      'window-manager-main/aux-window/functionalityBounds'
    )
    await this._do(
      manager,
      'window-manager-main/auxWindowFunctionality',
      'window-manager-main/aux-window/functionality'
    )
    await this._do(
      manager,
      'window-manager-main/auxWindowPinned',
      'window-manager-main/aux-window/pinned'
    )
    await this._do(
      manager,
      'window-manager-main/auxWindowOpacity',
      'window-manager-main/aux-window/opacity'
    )
    await this._do(
      manager,
      'window-manager-main/auxWindowEnabled',
      'window-manager-main/aux-window/enabled'
    )
    await this._do(
      manager,
      'window-manager-main/auxWindowAutoShow',
      'window-manager-main/aux-window/autoShow'
    )
    await this._do(
      manager,
      'window-manager-main/auxWindowShowSkinSelector',
      'window-manager-main/aux-window/showSkinSelector'
    )

    await this._do(
      manager,
      'window-manager-main/mainWindowSize',
      'window-manager-main/main-window/size'
    )

    await manager.save(
      Setting.create(ConfigMigrateMain.MIGRATION_FROM_134, ConfigMigrateMain.MIGRATION_FROM_134)
    )

    this._log.info(`迁移完成, 到 ${ConfigMigrateMain.MIGRATION_FROM_134}`)
  }

  async onInit() {
    try {
      await this._st.dataSource.transaction(async (manager) => {
        await this._migrateFrom126(manager)
        await this._migrateFrom134(manager)
      })
    } catch (error) {
      this._log.error('迁移设置项失败', error)
    }
  }
}
