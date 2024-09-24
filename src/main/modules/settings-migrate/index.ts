import { MobxBasedBasicModule } from '@main/akari-ipc/mobx-based-basic-module'

import { AppModule } from '../app'
import { AutoGameflowModule } from '../auto-gameflow'
import { AutoReplyModule } from '../auto-reply'
import { AutoSelectModule } from '../auto-select'
import { AutoUpdateModule } from '../auto-update'
import { AuxWindowModule } from '../auxiliary-window'
import { CoreFunctionalityModule } from '../core-functionality'
import { LcuConnectionModule } from '../lcu-connection'
import { LeagueClientModule } from '../league-client'
import { AppLogger, LogModule } from '../log'

export class SettingsMigrateModule extends MobxBasedBasicModule {
  private _am: AppModule
  private _logModule: LogModule
  private _logger: AppLogger
  private _awm: AuxWindowModule
  private _afgm: AutoGameflowModule
  private _arm: AutoReplyModule
  private _cfm: CoreFunctionalityModule
  private _asm: AutoSelectModule
  private _lcm: LcuConnectionModule
  private _lcm2: LeagueClientModule
  private _aum: AutoUpdateModule

  static MIGRATION_125 = 'akari-magic-125'

  constructor() {
    super('settings-migrate')
  }

  override async setup() {
    await super.setup()

    this._am = this.manager.getModule<AppModule>('app')
    this._logModule = this.manager.getModule<LogModule>('log')
    this._logger = this._logModule.createLogger('settings-migrate')
    this._afgm = this.manager.getModule<AutoGameflowModule>('auto-gameflow')
    this._arm = this.manager.getModule<AutoReplyModule>('auto-reply')
    this._cfm = this.manager.getModule<CoreFunctionalityModule>('core-functionality')
    this._asm = this.manager.getModule<AutoSelectModule>('auto-select')
    this._lcm = this.manager.getModule<LcuConnectionModule>('lcu-connection')
    this._aum = this.manager.getModule<AutoUpdateModule>('auto-update')
    this._awm = this.manager.getModule<AuxWindowModule>('auxiliary-window')
    this._lcm2 = this.manager.getModule<LeagueClientModule>('league-client')

    await this._migrateSettingsTo125()

    this._logger.info('初始化完成')
  }

  // from v1.2.x -> v1.2.5
  // 该版本将不再考虑远古 1.1.x 版本的设置迁移
  private async _migrateSettingsTo125() {
    const isMigrated = await this._sm.settings.get(SettingsMigrateModule.MIGRATION_125, false)
    if (isMigrated) {
      return
    }

    const migrate = async (
      from: string,
      to: string,
      defaultValue: any,
      stateUpdater: (v: any) => void
    ) => {
      if (await this._sm.settings.has(from)) {
        const value = await this._sm.settings.get(from, defaultValue)
        await this._sm.settings.set(to, value)
        await this._sm.settings.remove(from)
        stateUpdater(value)
      }
    }

    /*
      module: auto-gameflow
      auto-honor-enabled autoHonorEnabled
      auto-honor-strategy autoHonorStrategy
      play-again-enabled playAgainEnabled
      auto-accept-enabled autoAcceptEnabled
      auto-accept-delay-seconds autoAcceptDelaySeconds
      auto-search-match-enabled autoMatchmakingEnabled
      auto-search-match-delay-seconds autoMatchmakingDelaySeconds
      auto-search-match-minimum-members autoMatchmakingMinimumMembers
      auto-search-match-wait-for-invitees autoMatchmakingWaitForInvitees
      auto-search-match-rematch-strategy autoMatchmakingRematchStrategy
      auto-search-match-rematch-fixed-duration autoMatchmakingRematchFixedDuration
    */
    await migrate(
      'auto-gameflow/auto-honor-enabled',
      'auto-gameflow/autoHonorEnabled',
      false,
      (v) => this._afgm.state.settings.setAutoHonorEnabled(v)
    )
    await migrate(
      'auto-gameflow/auto-honor-strategy',
      'auto-gameflow/autoHonorStrategy',
      this._afgm.state.settings.autoHonorStrategy,
      (v) => this._afgm.state.settings.setAutoHonorStrategy(v)
    )
    await migrate(
      'auto-gameflow/play-again-enabled',
      'auto-gameflow/playAgainEnabled',
      this._afgm.state.settings.playAgainEnabled,
      (v) => this._afgm.state.settings.setPlayAgainEnabled(v)
    )
    await migrate(
      'auto-gameflow/auto-accept-enabled',
      'auto-gameflow/autoAcceptEnabled',
      this._afgm.state.settings.autoAcceptEnabled,
      (v) => this._afgm.state.settings.setAutoAcceptEnabled(v)
    )
    await migrate(
      'auto-gameflow/auto-accept-delay-seconds',
      'auto-gameflow/autoAcceptDelaySeconds',
      this._afgm.state.settings.autoAcceptDelaySeconds,
      (v) => this._afgm.state.settings.setAutoAcceptDelaySeconds(v)
    )
    await migrate(
      'auto-gameflow/auto-search-match-enabled',
      'auto-gameflow/autoMatchmakingEnabled',
      this._afgm.state.settings.autoMatchmakingEnabled,
      (v) => this._afgm.state.settings.setAutoMatchmakingEnabled(v)
    )
    await migrate(
      'auto-gameflow/auto-search-match-delay-seconds',
      'auto-gameflow/autoMatchmakingDelaySeconds',
      this._afgm.state.settings.autoMatchmakingDelaySeconds,
      (v) => this._afgm.state.settings.setAutoMatchmakingDelaySeconds(v)
    )
    await migrate(
      'auto-gameflow/auto-search-match-minimum-members',
      'auto-gameflow/autoMatchmakingMinimumMembers',
      this._afgm.state.settings.autoMatchmakingMinimumMembers,
      (v) => this._afgm.state.settings.setAutoMatchmakingMinimumMembers(v)
    )
    await migrate(
      'auto-gameflow/auto-search-match-wait-for-invitees',
      'auto-gameflow/autoMatchmakingWaitForInvitees',
      this._afgm.state.settings.autoMatchmakingWaitForInvitees,
      (v) => this._afgm.state.settings.setAutoMatchmakingWaitForInvitees(v)
    )
    await migrate(
      'auto-gameflow/auto-search-match-rematch-strategy',
      'auto-gameflow/autoMatchmakingRematchStrategy',
      this._afgm.state.settings.autoMatchmakingRematchStrategy,
      (v) => this._afgm.state.settings.setAutoMatchmakingRematchStrategy(v)
    )
    await migrate(
      'auto-gameflow/auto-search-match-rematch-fixed-duration',
      'auto-gameflow/autoMatchmakingRematchFixedDuration',
      this._afgm.state.settings.autoMatchmakingRematchFixedDuration,
      (v) => this._afgm.state.settings.setAutoMatchmakingRematchFixedDuration(v)
    )

    /*
      module: app
      show-free-software-declaration showFreeSoftwareDeclaration
      close-strategy closeStrategy
      use-wmic useWmic
      is-in-kyoko-mode isInKyokoMode
    */
    await migrate(
      'app/show-free-software-declaration',
      'app/showFreeSoftwareDeclaration',
      this._am.state.settings.showFreeSoftwareDeclaration,
      (v) => this._am.state.settings.setShowFreeSoftwareDeclaration(v)
    )
    await migrate(
      'app/close-strategy',
      'app/closeStrategy',
      this._am.state.settings.closeStrategy,
      (v) => this._am.state.settings.setCloseStrategy(v)
    )
    await migrate('app/use-wmic', 'app/useWmic', this._am.state.settings.useWmic, (v) =>
      this._am.state.settings.setUseWmic(v)
    )
    await migrate(
      'app/is-in-kyoko-mode',
      'app/isInKyokoMode',
      this._am.state.settings.isInKyokoMode,
      (v) => this._am.state.settings.setInKyokoMode(v)
    )

    /*
      module: auto-update
      auto-check-updates autoCheckUpdates
      auto-download-updates autoDownloadUpdates
      download-source downloadSource
    */
    await migrate(
      'auto-update/auto-check-updates',
      'auto-update/autoCheckUpdates',
      this._aum.state.settings.autoCheckUpdates,
      (v) => this._aum.state.settings.setAutoCheckUpdates(v)
    )
    await migrate(
      'auto-update/auto-download-updates',
      'auto-update/autoDownloadUpdates',
      this._aum.state.settings.autoDownloadUpdates,
      (v) => this._aum.state.settings.setAutoDownloadUpdates(v)
    )
    await migrate(
      'auto-update/download-source',
      'auto-update/downloadSource',
      this._aum.state.settings.downloadSource,
      (v) => this._aum.state.settings.setDownloadSource(v)
    )
    // 不算设置项, 但也能迁移
    await migrate(
      'auto-update/last-read-announcement-sha',
      'auto-update/lastReadAnnouncementSha',
      '',
      () => {}
    )

    /*
      module: auxiliary-window
      is-pinned isPinned
      show-skin-selector showSkinSelector
      zoom-factor zoomFactor
     */
    await migrate(
      'auxiliary-window/is-pinned',
      'auxiliary-window/isPinned',
      this._awm.state.settings.isPinned,
      (v) => this._awm.state.settings.setPinned(v)
    )
    await migrate(
      'auxiliary-window/show-skin-selector',
      'auxiliary-window/showSkinSelector',
      this._awm.state.settings.showSkinSelector,
      (v) => this._awm.state.settings.setShowSkinSelector(v)
    )
    await migrate(
      'auxiliary-window/zoom-factor',
      'auxiliary-window/zoomFactor',
      this._awm.state.settings.zoomFactor,
      (v) => this._awm.state.settings.setZoomFactor(v)
    )

    /*
      module: lcu-connection
      auto-connect autoConnect
     */
    await migrate(
      'auto/auto-connect',
      'lcu-connection/autoConnect',
      this._lcm.state.settings.autoConnect,
      (v) => this._lcm.state.settings.setAutoConnect(v)
    )
    await migrate(
      'lcu-connection/auto-connect',
      'lcu-connection/autoConnect',
      this._lcm.state.settings.autoConnect,
      (v) => this._lcm.state.settings.setAutoConnect(v)
    )

    /**
      module: league-client
      fix-window-method-a-options fixWindowMethodAOptions
      terminate-game-client-on-alt-f4 terminateGameClientOnAltF4
     */

    await migrate(
      'league-client/fix-window-method-a-options',
      'league-client/fixWindowMethodAOptions',
      {
        baseWidth: 1600,
        baseHeight: 900
      },
      (v) => this._lcm2.settings.setFixWindowMethodAOptions(v)
    )
    await migrate(
      'league-client/terminate-game-client-on-alt-f4',
      'league-client/terminateGameClientOnAltF4',
      this._lcm2.settings.terminateGameClientOnAltF4,
      (v) => this._lcm2.settings.setTerminateGameClientOnAltF4(v)
    )

    /*
      module: auto-reply
      enable-on-away enabledOnAway
    */
    await migrate(
      'auto-reply/enable-on-away',
      'auto-reply/enableOnAway',
      this._arm.state.settings.enableOnAway,
      (v) => this._arm.state.settings.setEnableOnAway(v)
    )

    /*
      module: auto-select
      normal-mode-enabled normalModeEnabled
      expected-champions-multi expectedChampionsMulti
      select-teammate-intended-champion selectTeammateIntendedChampion
      show-intent showIntent
      completed completed
      bench-mode-enabled benchModeEnabled
      bench-select-first-available-champion benchSelectFirstAvailableChampion
      bench-expected-champions benchExpectedChampions
      grab-delay-seconds grabDelaySeconds
      ban-enabled banEnabled
      banned-champions-multi bannedChampionsMulti
      ban-teammate-intended-champion banTeammateIntendedChampion
     */

    await migrate(
      'auto-select/normal-mode-enabled',
      'auto-select/normalModeEnabled',
      this._asm.state.settings.normalModeEnabled,
      (v) => this._asm.state.settings.setNormalModeEnabled(v)
    )
    await migrate(
      'auto-select/expected-champions-multi',
      'auto-select/expectedChampions',
      this._asm.state.settings.expectedChampions,
      (v) => this._asm.state.settings.setExpectedChampions(v)
    )
    await migrate(
      'auto-select/select-teammate-intended-champion',
      'auto-select/selectTeammateIntendedChampion',
      this._asm.state.settings.selectTeammateIntendedChampion,
      (v) => this._asm.state.settings.setSelectTeammateIntendedChampion(v)
    )
    await migrate(
      'auto-select/show-intent',
      'auto-select/showIntent',
      this._asm.state.settings.showIntent,
      (v) => this._asm.state.settings.setShowIntent(v)
    )
    await migrate(
      'auto-select/completed',
      'auto-select/completed',
      this._asm.state.settings.completed,
      (v) => this._asm.state.settings.setCompleted(v)
    )
    await migrate(
      'auto-select/bench-mode-enabled',
      'auto-select/benchModeEnabled',
      this._asm.state.settings.benchModeEnabled,
      (v) => this._asm.state.settings.setBenchModeEnabled(v)
    )
    await migrate(
      'auto-select/bench-select-first-available-champion',
      'auto-select/benchSelectFirstAvailableChampion',
      this._asm.state.settings.benchSelectFirstAvailableChampion,
      (v) => this._asm.state.settings.setBenchSelectFirstAvailableChampion(v)
    )
    await migrate(
      'auto-select/bench-expected-champions',
      'auto-select/benchExpectedChampions',
      this._asm.state.settings.benchExpectedChampions,
      (v) => this._asm.state.settings.setBenchExpectedChampions(v)
    )
    await migrate(
      'auto-select/grab-delay-seconds',
      'auto-select/grabDelaySeconds',
      this._asm.state.settings.grabDelaySeconds,
      (v) => this._asm.state.settings.setGrabDelaySeconds(v)
    )
    await migrate(
      'auto-select/ban-enabled',
      'auto-select/banEnabled',
      this._asm.state.settings.banEnabled,
      (v) => this._asm.state.settings.setBanEnabled(v)
    )
    await migrate(
      'auto-select/banned-champions-multi',
      'auto-select/bannedChampions',
      this._asm.state.settings.bannedChampions,
      (v) => this._asm.state.settings.setBannedChampions(v)
    )
    await migrate(
      'auto-select/ban-teammate-intended-champion',
      'auto-select/banTeammateIntendedChampion',
      this._asm.state.settings.banTeammateIntendedChampion,
      (v) => this._asm.state.settings.setBanTeammateIntendedChampion(v)
    )

    /**
      module: core-functionality
      auto-route-on-game-start autoRouteOnGameStart
      fetch-detailed-game fetchDetailedGame
      send-kda-in-game sendKdaInGame
      send-kda-in-game-with-pre-made-teams sendKdaInGameWithPreMadeTeams
      send-kda-threshold sendKdaThreshold
      fetch-after-game fetchAfterGame
      player-analysis-fetch-concurrency playerAnalysisFetchConcurrency
      ongoing-analysis-enabled ongoingAnalysisEnabled
      match-history-load-count matchHistoryLoadCount
      pre-made-team-threshold preMadeTeamThreshold
      use-sgp-api useSgpApi
   */

    await migrate(
      'core-functionality/auto-route-on-game-start',
      'core-functionality/autoRouteOnGameStart',
      this._cfm.state.settings.autoRouteOnGameStart,
      (v) => this._cfm.state.settings.setAutoRouteOnGameStart(v)
    )
    await migrate(
      'core-functionality/fetch-detailed-game',
      'core-functionality/fetchDetailedGame',
      this._cfm.state.settings.fetchAfterGame,
      (v) => this._cfm.state.settings.setFetchDetailedGame(v)
    )
    await migrate(
      'core-functionality/send-kda-in-game',
      'core-functionality/sendKdaInGame',
      this._cfm.state.settings.sendKdaInGame,
      (v) => this._cfm.state.settings.setSendKdaInGame(v)
    )
    await migrate(
      'core-functionality/send-kda-in-game-with-pre-made-teams',
      'core-functionality/sendKdaInGameWithPreMadeTeams',
      this._cfm.state.settings.sendKdaInGameWithPreMadeTeams,
      (v) => this._cfm.state.settings.setSendKdaInGameWithPreMadeTeams(v)
    )
    await migrate(
      'core-functionality/send-kda-threshold',
      'core-functionality/sendKdaThreshold',
      this._cfm.state.settings.sendKdaThreshold,
      (v) => this._cfm.state.settings.setSendKdaThreshold(v)
    )
    await migrate(
      'core-functionality/fetch-after-game',
      'core-functionality/fetchAfterGame',
      this._cfm.state.settings.fetchAfterGame,
      (v) => this._cfm.state.settings.setFetchAfterGame(v)
    )
    await migrate(
      'core-functionality/player-analysis-fetch-concurrency',
      'core-functionality/playerAnalysisFetchConcurrency',
      this._cfm.state.settings.playerAnalysisFetchConcurrency,
      (v) => this._cfm.state.settings.setPlayerAnalysisFetchConcurrency(v)
    )
    await migrate(
      'core-functionality/ongoing-analysis-enabled',
      'core-functionality/ongoingAnalysisEnabled',
      this._cfm.state.settings.ongoingAnalysisEnabled,
      (v) => this._cfm.state.settings.setOngoingAnalysisEnabled(v)
    )
    await migrate(
      'core-functionality/match-history-load-count',
      'core-functionality/matchHistoryLoadCount',
      this._cfm.state.settings.matchHistoryLoadCount,
      (v) => this._cfm.state.settings.setMatchHistoryLoadCount(v)
    )
    await migrate(
      'core-functionality/pre-made-team-threshold',
      'core-functionality/preMadeTeamThreshold',
      this._cfm.state.settings.preMadeTeamThreshold,
      (v) => this._cfm.state.settings.setPreMadeTeamThreshold(v)
    )
    await migrate(
      'core-functionality/use-sgp-api',
      'core-functionality/useSgpApi',
      this._cfm.state.settings.useSgpApi,
      (v) => this._cfm.state.settings.setUseSgpApi(v)
    )

    // 保存迁移标记
    await this._sm.settings.set(SettingsMigrateModule.MIGRATION_125, true)
  }
}

export const settingsMigrateModule = new SettingsMigrateModule()
