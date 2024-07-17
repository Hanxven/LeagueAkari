import { SavedPlayer } from '@main/db/entities/SavedPlayers'
import { EMPTY_PUUID } from '@shared/constants/common'
import { PlayerChampionMastery } from '@shared/types/lcu/champion-mastery'
import { Game } from '@shared/types/lcu/match-history'
import { RankedStats } from '@shared/types/lcu/ranked'
import { SummonerInfo } from '@shared/types/lcu/summoner'
import {
  MatchHistoryGamesAnalysisAll,
  MatchHistoryGamesAnalysisTeamSide
} from '@shared/utils/analysis'
import { computed, makeAutoObservable, observable } from 'mobx'

import { lcuConnectionModule as lcm } from '../akari-core/lcu-connection'
import { lcuSyncModule as lcu } from '../lcu-state-sync'

class CoreFunctionalitySettings {
  fetchAfterGame: boolean = true

  ongoingAnalysisEnabled: boolean = true

  autoRouteOnGameStart: boolean = true
  preMadeTeamThreshold: number = 3
  fetchDetailedGame: boolean = true
  matchHistoryLoadCount: number = 20
  sendKdaInGame: boolean = false
  sendKdaInGameWithPreMadeTeams: boolean = false
  sendKdaThreshold: number = 0

  useAuxiliaryWindow: boolean = true

  playerAnalysisFetchConcurrency: number = 3

  delaySecondsBeforeLoading: number = 0

  matchHistorySource: 'lcu' | 'sgp' = 'sgp'

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

  setDelaySecondsBeforeLoading(value: number) {
    this.delaySecondsBeforeLoading = value
  }

  setMatchHistorySource(value: 'lcu' | 'sgp') {
    this.matchHistorySource = value
  }
}

/**
 * 当前正在进行游戏的玩家的基础信息
 */
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
  matchHistory?: MatchHistoryGameWithState[]

  /**
   * 玩家英雄点数相关信息
   */
  championMastery?: PlayerChampionMastery

  /**
   * 记录的玩家信息
   */
  savedInfo?: SavedPlayer & { encounteredGames: number[] }
}

/**
 * 当前正在进行游戏的玩家的分析信息
 */
export interface OngoingPlayerAnalysis {
  puuid: string
}

export interface OngoingTeamAnalysis {
  teamId: string
}

export interface MatchHistoryGameWithState {
  game: Game
  isDetailed: boolean
}

export class CoreFunctionalityState {
  settings = new CoreFunctionalitySettings()

  /**
   * 当前对局中的所有玩家的各自信息
   *
   * 出于性能优化，手动同步该状态
   */
  ongoingPlayers = observable(new Map<string, OngoingPlayer>(), { deep: false })

  /**
   * 当前正在进行的玩家分析
   */
  ongoingPlayerAnalysis: {
    players: Record<string, MatchHistoryGamesAnalysisAll>
    teams: Record<string, MatchHistoryGamesAnalysisTeamSide>
  } | null = null

  isWaitingForDelay = false

  // 用于临时对局分析的游戏详情图
  tempDetailedGames = observable(new Map<number, Game>(), { deep: false })

  ongoingPreMadeTeams: {
    players: string[]
    times: number
    team: string
    _id: number
  }[] = []

  get ongoingGameInfo() {
    if (!lcu.gameflow.session) {
      return null
    }

    return {
      queueType: lcu.gameflow.session.gameData.queue.type,
      gameId: lcu.gameflow.session.gameData.gameId
    }
  }

  /**
   * 当前进行的英雄选择
   */
  get ongoingChampionSelections() {
    if (this.queryState === 'champ-select') {
      if (!lcu.champSelect.session) {
        return null
      }

      const selections: Record<string, number> = {}
      lcu.champSelect.session.myTeam.forEach((p) => {
        if (p.puuid) {
          selections[p.puuid] = p.championId || p.championPickIntent
        }
      })

      lcu.champSelect.session.theirTeam.forEach((p) => {
        if (p.puuid) {
          selections[p.puuid] = p.championId || p.championPickIntent
        }
      })

      return selections
    } else if (this.queryState === 'in-game') {
      if (!lcu.gameflow.session) {
        return null
      }

      const selections: Record<string, number> = {}
      lcu.gameflow.session.gameData.playerChampionSelections.forEach((p) => {
        if (p.puuid) {
          selections[p.puuid] = p.championId
        }
      })

      lcu.gameflow.session.gameData.teamOne.forEach((p) => {
        if (p.championId) {
          selections[p.puuid] = p.championId
        }
      })

      lcu.gameflow.session.gameData.teamTwo.forEach((p) => {
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
    if (this.queryState === 'champ-select') {
      if (!lcu.champSelect.session) {
        return null
      }

      const teams: Record<string, string[]> = {}

      lcu.champSelect.session.myTeam
        .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
        .forEach((p) => {
          const key = p.team ? `our-${p.team}` : 'our'
          if (!teams[key]) {
            teams[key] = []
          }
          teams[key].push(p.puuid)
        })

      lcu.champSelect.session.theirTeam
        .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
        .forEach((p) => {
          const key = p.team ? `their-${p.team}` : 'their'
          if (!teams[key]) {
            teams[key] = []
          }
          teams[key].push(p.puuid)
        })

      return teams
    } else if (this.queryState === 'in-game') {
      if (!lcu.gameflow.session) {
        return null
      }

      const teams: Record<string, string[]> = {
        100: [],
        200: []
      }

      lcu.gameflow.session.gameData.teamOne
        .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
        .forEach((p) => {
          teams['100'].push(p.puuid)
        })

      lcu.gameflow.session.gameData.teamTwo
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
    this.ongoingPlayerAnalysis = null
    this.sendList = {}
    this.isWaitingForDelay = false
  }

  setWaitingForDelay(value: boolean) {
    this.isWaitingForDelay = value
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
  get queryState() {
    if (lcm.state.state !== 'connected') {
      return 'unavailable'
    }

    if (lcu.gameflow.phase === 'ChampSelect' && lcu.champSelect.session) {
      return 'champ-select'
    }

    if (
      lcu.gameflow.session &&
      (lcu.gameflow.phase === 'GameStart' ||
        lcu.gameflow.phase === 'InProgress' ||
        lcu.gameflow.phase === 'WaitingForStats' ||
        lcu.gameflow.phase === 'PreEndOfGame' ||
        lcu.gameflow.phase === 'EndOfGame' ||
        lcu.gameflow.phase === 'Reconnect')
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
      lcu.gameflow.phase === 'WaitingForStats' ||
      lcu.gameflow.phase === 'PreEndOfGame' ||
      lcu.gameflow.phase === 'EndOfGame'
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
      ongoingPreMadeTeams: observable.struct,
      ongoingPlayerAnalysis: observable.struct
    })
  }
}

export const coreFunctionalityState = new CoreFunctionalityState()
