import { lcuConnectionState } from '@main/core-modules/lcu-connection'
import { SavedPlayer } from '@main/db/entities/SavedPlayers'
import { EMPTY_PUUID } from '@shared/constants/common'
import { Game } from '@shared/types/lcu/match-history'
import { RankedStats } from '@shared/types/lcu/ranked'
import { SummonerInfo } from '@shared/types/lcu/summoner'
import { computed, makeAutoObservable, observable } from 'mobx'

import { champSelect } from '../lcu-state-sync/champ-select'
import { gameflow } from '../lcu-state-sync/gameflow'

class CoreFunctionalitySettings {
  fetchAfterGame: boolean = true

  ongoingAnalysisEnabled: boolean = true

  autoRouteOnGameStart: boolean = true
  preMadeTeamThreshold: number = 3
  teamAnalysisPreloadCount: number = 4
  fetchDetailedGame: boolean = true
  matchHistoryLoadCount: number = 20
  sendKdaInGame: boolean = false
  sendKdaInGameWithPreMadeTeams: boolean = false
  sendKdaThreshold: number = 0

  useAuxiliaryWindow: boolean = true

  playerAnalysisFetchConcurrency: number = 3

  constructor() {
    makeAutoObservable(this)
  }

  setOngoingAnalysisEnabled(value: boolean) {
    this.ongoingAnalysisEnabled = value
  }

  setFetchAfterGame(value: boolean) {
    this.fetchAfterGame = value
  }

  setAutoRouteOnGameStart(value: boolean) {
    this.autoRouteOnGameStart = value
  }

  setPreMadeTeamThreshold(value: number) {
    this.preMadeTeamThreshold = value
  }

  setTeamAnalysisPreloadCount(value: number) {
    this.teamAnalysisPreloadCount = value
  }

  setFetchDetailedGame(value: boolean) {
    this.fetchDetailedGame = value
  }

  setMatchHistoryLoadCount(value: number) {
    this.matchHistoryLoadCount = value
  }

  setSendKdaInGame(value: boolean) {
    this.sendKdaInGame = value
  }

  setSendKdaInGameWithPreMadeTeams(value: boolean) {
    this.sendKdaInGameWithPreMadeTeams = value
  }

  setSendKdaThreshold(value: number) {
    this.sendKdaThreshold = value
  }

  setUseAuxiliaryWindow(value: boolean) {
    this.useAuxiliaryWindow = value
  }

  setPlayerAnalysisFetchConcurrency(limit: number) {
    this.playerAnalysisFetchConcurrency = limit
  }
}

export interface OngoingPlayer {
  // 当前的召唤师 ID，和 key 值相同
  puuid: string

  /**
   * 召唤师信息
   */
  summoner?: SummonerInfo

  /**
   * 玩家排位赛信息
   */
  rankedStats?: RankedStats

  /**
   * 用于分析的战绩列表封装
   */
  matchHistory?: MatchHistoryWithState[]

  /**
   * 记录的玩家信息
   */
  savedInfo?: SavedPlayer & { encounteredGames: number[] }
}

export interface MatchHistoryWithState {
  game: Game
  isDetailed: boolean
}

class CoreFunctionalityState {
  settings = new CoreFunctionalitySettings()

  /**
   * 当前对局中的所有玩家的各自信息
   *
   * 出于性能优化，手动同步该状态
   */
  ongoingPlayers = observable(new Map<string, OngoingPlayer>(), { deep: false })

  // 用于临时对局分析的游戏详情图
  tempDetailedGames = observable(new Map<number, Game>(), { deep: false })

  ongoingPreMadeTeams: {
    players: string[]
    times: number
    team: string
    _id: number
  }[] = []

  get ongoingGameInfo() {
    if (!gameflow.session) {
      return null
    }

    return {
      queueType: gameflow.session.gameData.queue.type,
      gameId: gameflow.session.gameData.gameId
    }
  }

  /**
   * 当前进行的英雄选择
   */
  get ongoingChampionSelections() {
    if (this.ongoingState === 'champ-select') {
      if (!champSelect.session) {
        return null
      }

      const selections: Record<string, number> = {}
      champSelect.session.myTeam.forEach((p) => {
        if (p.puuid) {
          selections[p.puuid] = p.championId || p.championPickIntent
        }
      })

      champSelect.session.theirTeam.forEach((p) => {
        if (p.puuid) {
          selections[p.puuid] = p.championId || p.championPickIntent
        }
      })

      return selections
    } else if (this.ongoingState === 'in-game') {
      if (!gameflow.session) {
        return null
      }

      const selections: Record<string, number> = {}
      gameflow.session.gameData.playerChampionSelections.forEach((p) => {
        if (p.puuid) {
          selections[p.puuid] = p.championId
        }
      })

      gameflow.session.gameData.teamOne.forEach((p) => {
        if (p.championId) {
          selections[p.puuid] = p.championId
        }
      })

      gameflow.session.gameData.teamTwo.forEach((p) => {
        if (p.championId) {
          selections[p.puuid] = p.championId
        }
      })

      return selections
    }

    return null
  }

  /**
   * 当前对局的队伍分配
   */
  get ongoingTeams() {
    if (this.ongoingState === 'champ-select') {
      if (!champSelect.session) {
        return null
      }

      const teams: Record<string, string[]> = {}

      champSelect.session.myTeam
        .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
        .forEach((p) => {
          const key = p.team ? `our-${p.team}` : 'our'
          if (!teams[key]) {
            teams[key] = []
          }
          teams[key].push(p.puuid)
        })

      champSelect.session.theirTeam
        .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
        .forEach((p) => {
          const key = p.team ? `their-${p.team}` : 'their'
          if (!teams[key]) {
            teams[key] = []
          }
          teams[key].push(p.puuid)
        })

      return teams
    } else if (this.ongoingState === 'in-game') {
      if (!gameflow.session) {
        return null
      }

      const teams: Record<string, string[]> = {
        100: [],
        200: []
      }

      gameflow.session.gameData.teamOne
        .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
        .forEach((p) => {
          teams['100'].push(p.puuid)
        })

      gameflow.session.gameData.teamTwo
        .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
        .forEach((p) => {
          teams['200'].push(p.puuid)
        })

      return teams
    }

    return null
  }

  clearOngoingVars() {
    this.ongoingPlayers.clear()
    this.tempDetailedGames.clear()
    this.ongoingPreMadeTeams = []
    this.sendList = {}
  }

  /**
   * 当前游戏的进行状态简化，用于区分 League Akari 的几个主要阶段
   *
   * unavailable - 不需要介入的状态
   *
   * champ-select - 正在英雄选择阶段
   *
   * in-game - 在游戏中或游戏结算中
   */
  get ongoingState() {
    if (lcuConnectionState.state !== 'connected') {
      return 'unavailable'
    }

    if (gameflow.phase === 'ChampSelect') {
      return 'champ-select'
    }

    if (
      gameflow.phase === 'GameStart' ||
      gameflow.phase === 'InProgress' ||
      gameflow.phase === 'WaitingForStats' ||
      gameflow.phase === 'PreEndOfGame' ||
      gameflow.phase === 'EndOfGame' ||
      gameflow.phase === 'Reconnect'
    ) {
      return 'in-game'
    }

    return 'unavailable'
  }

  /**
   * 在游戏结算时，League Akari 会额外进行一些操作
   */
  get isInEndgamePhase() {
    return (
      gameflow.phase === 'WaitingForStats' ||
      gameflow.phase === 'PreEndOfGame' ||
      gameflow.phase === 'EndOfGame'
    )
  }

  /**
   * 游戏内发送时，发送哪些玩家的内容
   */
  sendList: Record<string | number, boolean> = {}

  constructor() {
    makeAutoObservable(this, {
      ongoingChampionSelections: computed.struct,
      ongoingGameInfo: computed.struct,
      ongoingTeams: computed.struct,
      sendList: observable.shallow,
      ongoingPreMadeTeams: observable.struct
    })
  }
}

export const coreFunctionalityState = new CoreFunctionalityState()
