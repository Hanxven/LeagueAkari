import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { Equal } from 'typeorm'

import { AkariLogger } from '../logger-factory'
import { StorageMain } from '../storage'
import { Setting } from '../storage/entities/Settings'

/**
 * 将旧的设置项重新设置, 并设置数据
 */
export class SettingMigrateMain implements IAkariShardInitDispose {
  static id = 'setting-migrate-main'

  // 引入涉及到的模块的对应依赖, 以保证其在加载其他模块之前完成迁移操作
  static dependencies = [
    'storage-main',
    'logger-factory-main',
    'league-client-main',
    'riot-client-main',
    'game-client-main',
    'self-update-main',
    'ongoing-game-main',
    'league-client-ux-main',
    'respawn-timer-main',
    'auto-reply-main',
    'auto-select-main',
    'auto-gameflow-main',
    'window-manager-main',
    'app-common-main'
  ]

  static MIGRATION_FROM_126 = 'akari-migration-from-1.2.6_patch1'

  private readonly _st: StorageMain
  private readonly _log: AkariLogger

  constructor(deps: any) {
    this._st = deps['storage-main']
    this._log = deps['logger-factory-main'].create(SettingMigrateMain.id)

    this._printDeps(deps)
  }

  private _printDeps(deps: any) {
    const shards = Object.entries(deps).map(([key, _value]) => key)
    return `预先加载: [${shards.join(', ')}]`
  }

  private async _do(from: string, to: string) {
    const s = await this._st.dataSource.manager.findOneBy(Setting, { key: Equal(from) })

    if (!s) {
      return
    }

    await this._st.dataSource.manager.save(Setting.create(to, s.value))
    await this._st.dataSource.manager.remove(s)
  }

  // NOTE: drop support before League Akari 1.1.x
  private async _migrate() {
    const isMigratedSymbol = await this._st.dataSource.manager.findOneBy(Setting, {
      key: Equal(SettingMigrateMain.MIGRATION_FROM_126)
    })

    if (isMigratedSymbol) {
      this._log.info('发现已迁移的标志，不进行迁移', isMigratedSymbol)
      return
    }

    this._log.info('开始迁移设置项', SettingMigrateMain.MIGRATION_FROM_126)

    await this._do('auxiliary-window/opacity', 'window-manager-main/auxWindowOpacity')
    await this._do('auxiliary-window/enabled', 'window-manager-main/auxWindowEnabled')
    await this._do('respawn-timer/enabled', 'respawn-timer-main/enabled')
    await this._do('auto-reply/text', 'auto-reply-main/text')
    await this._do('auto-reply/enabled', 'auto-reply-main/enabled')
    await this._do('auto-reply/enableOnAway', 'auto-reply-main/enableOnAway')
    await this._do(
      'auxiliary-window/functionality-bounds',
      'window-manager-main/auxWindowFunctionalityBounds'
    )
    await this._do('auxiliary-window/functionality', 'window-manager-main/auxWindowFunctionality')
    await this._do('auto-gameflow/autoHonorEnabled', 'auto-gameflow-main/autoHonorEnabled')
    await this._do('auto-gameflow/playAgainEnabled', 'auto-gameflow-main/playAgainEnabled')
    await this._do('auto-gameflow/autoAcceptEnabled', 'auto-gameflow-main/autoAcceptEnabled')
    await this._do(
      'auto-gameflow/autoAcceptDelaySeconds',
      'auto-gameflow-main/autoAcceptDelaySeconds'
    )
    await this._do(
      'auto-gameflow/autoMatchmakingEnabled',
      'auto-gameflow-main/autoMatchmakingEnabled'
    )
    await this._do(
      'auto-gameflow/autoMatchmakingDelaySeconds',
      'auto-gameflow-main/autoMatchmakingDelaySeconds'
    )
    await this._do(
      'auto-gameflow/autoMatchmakingMinimumMembers',
      'auto-gameflow-main/autoMatchmakingMinimumMembers'
    )
    await this._do(
      'auto-gameflow/autoMatchmakingWaitForInvitees',
      'auto-gameflow-main/autoMatchmakingWaitForInvitees'
    )
    await this._do(
      'auto-gameflow/autoMatchmakingRematchStrategy',
      'auto-gameflow-main/autoMatchmakingRematchStrategy'
    )
    await this._do(
      'auto-gameflow/autoMatchmakingRematchFixedDuration',
      'auto-gameflow-main/autoMatchmakingRematchFixedDuration'
    )
    await this._do('app/showFreeSoftwareDeclaration', 'app-common-main/showFreeSoftwareDeclaration')
    await this._do('app/useWmic', 'league-client-ux-main/useWmic')
    await this._do('app/isInKyokoMode', 'app-common-main/isInKyokoMode')
    await this._do('auto-update/autoCheckUpdates', 'self-update-main/autoCheckUpdates')
    await this._do('auto-update/downloadSource', 'self-update-main/downloadSource')
    await this._do('auxiliary-window/isPinned', 'window-manager-main/auxWindowPinned')
    await this._do(
      'auxiliary-window/showSkinSelector',
      'window-manager-main/auxWindowShowSkinSelector'
    )
    await this._do('lcu-connection/autoConnect', 'league-client-main/autoConnect')
    await this._do('auto-select/normalModeEnabled', 'auto-select-main/normalModeEnabled')
    await this._do('auto-select/expectedChampions', 'auto-select-main/expectedChampions')
    await this._do(
      'auto-select/selectTeammateIntendedChampion',
      'auto-select-main/selectTeammateIntendedChampion'
    )
    await this._do('auto-select/showIntent', 'auto-select-main/showIntent')
    await this._do('auto-select/benchModeEnabled', 'auto-select-main/benchModeEnabled')
    await this._do('auto-select/benchExpectedChampions', 'auto-select-main/benchExpectedChampions')
    await this._do('auto-select/grabDelaySeconds', 'auto-select-main/grabDelaySeconds')
    await this._do('auto-select/banEnabled', 'auto-select-main/banEnabled')
    await this._do('auto-select/bannedChampions', 'auto-select-main/bannedChampions')
    await this._do(
      'auto-select/banTeammateIntendedChampion',
      'auto-select-main/banTeammateIntendedChampion'
    )
    await this._do(
      'core-functionality/fetchAfterGame',
      'match-history-tabs-renderer/refreshTabsAfterGameEnds'
    )
    await this._do(
      'core-functionality/playerAnalysisFetchConcurrency',
      'ongoing-game-main/concurrency'
    )
    await this._do('core-functionality/ongoingAnalysisEnabled', 'ongoing-game-main/enabled')
    await this._do(
      'core-functionality/matchHistoryLoadCount',
      'ongoing-game-main/matchHistoryLoadCount'
    )
    await this._do(
      'core-functionality/preMadeTeamThreshold',
      'ongoing-game-main/premadeTeamThreshold'
    )
    await this._do(
      'auto-update/lastReadAnnouncementSha',
      'self-update-main/lastReadAnnouncementSha'
    )
    await this._do(
      'auto-select/benchSelectFirstAvailableChampion',
      'auto-select-main/benchSelectFirstAvailableChampion'
    )
    await this._do('core-functionality/useSgpApi', 'ongoing-game-main/matchHistoryUseSgpApi')
    await this._do(
      'auto-gameflow/autoAcceptInvitationEnabled',
      'auto-gameflow-main/autoHandleInvitationsEnabled'
    )
    await this._do(
      'auto-gameflow/invitationHandlingStrategies',
      'auto-gameflow-main/invitationHandlingStrategies'
    )
    await this._do('auto-gameflow/autoReconnectEnabled', 'auto-gameflow-main/autoReconnectEnabled')

    await this._st.dataSource.manager.save(
      Setting.create(SettingMigrateMain.MIGRATION_FROM_126, SettingMigrateMain.MIGRATION_FROM_126)
    )

    this._log.info(`迁移完成, 到 ${SettingMigrateMain.MIGRATION_FROM_126}`)
  }

  async onInit() {
    await this._migrate()
  }
}
