import { EMPTY_PUUID } from '@shared/constants/common'
import { Game, GameTimeline } from '@shared/types/league-client/match-history'
import { RankedStats } from '@shared/types/league-client/ranked'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import {
  MatchHistoryGamesAnalysisAll,
  MatchHistoryGamesAnalysisTeamSide
} from '@shared/utils/analysis'
import { ParsedRole, parseSelectedRole } from '@shared/utils/ranked'
import { computed, makeAutoObservable, observable } from 'mobx'

import { LeagueClientData } from '../league-client/lc-state'
import { SavedPlayer } from '../storage/entities/SavedPlayers'

export class OngoingGameSettings {
  enabled: boolean = true
  premadeTeamThreshold: number = 6
  matchHistoryLoadCount: number = 20

  /**
   * 会拉取战绩中前 n 局的时间线数量
   */
  gameTimelineLoadCount: number = 8
  concurrency: number = 4

  /**
   * 查询战绩时是否优先使用 SGP API
   */
  matchHistoryUseSgpApi: boolean = true

  /**
   * 战绩查询时, 优先查询当前模式还是全部模式, 仅当 SGP API 启用时有效
   */
  matchHistoryTagPreference: 'current' | 'all' = 'current'

  setEnabled(value: boolean) {
    this.enabled = value
  }

  setPreMadeTeamThreshold(value: number) {
    this.premadeTeamThreshold = value
  }

  setMatchHistoryLoadCount(value: number) {
    this.matchHistoryLoadCount = value
  }

  setConcurrency(limit: number) {
    this.concurrency = limit
  }

  setMatchHistoryUseSgpApi(value: boolean) {
    this.matchHistoryUseSgpApi = value
  }

  setGameTimelineLoadCount(value: number) {
    this.gameTimelineLoadCount = value
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class OngoingGameState {
  get gameInfo() {
    if (!this._lcData.gameflow.session) {
      return null
    }

    return {
      queueId: this._lcData.gameflow.session.gameData.queue.id,
      queueType: this._lcData.gameflow.session.gameData.queue.type,
      gameId: this._lcData.gameflow.session.gameData.gameId,
      gameMode: this._lcData.gameflow.session.gameData.queue.gameMode
    }
  }

  /**
   * 当前进行的英雄选择
   */
  get championSelections() {
    if (this.queryStage.phase === 'champ-select') {
      if (!this._lcData.champSelect.session) {
        return {}
      }

      const selections: Record<string, number> = {}
      this._lcData.champSelect.session.myTeam.forEach((p) => {
        if (p.puuid && p.puuid !== EMPTY_PUUID) {
          selections[p.puuid] = p.championId || p.championPickIntent
        }
      })

      this._lcData.champSelect.session.theirTeam.forEach((p) => {
        if (p.puuid && p.puuid !== EMPTY_PUUID) {
          selections[p.puuid] = p.championId || p.championPickIntent
        }
      })

      return selections
    } else if (this.queryStage.phase === 'in-game') {
      if (!this._lcData.gameflow.session) {
        return {}
      }

      const selections: Record<string, number> = {}
      this._lcData.gameflow.session.gameData.playerChampionSelections.forEach((p) => {
        if (p.puuid && p.puuid !== EMPTY_PUUID) {
          selections[p.puuid] = p.championId
        }
      })

      this._lcData.gameflow.session.gameData.teamOne.forEach((p) => {
        if (p.championId) {
          selections[p.puuid] = p.championId
        }
      })

      this._lcData.gameflow.session.gameData.teamTwo.forEach((p) => {
        if (p.championId) {
          selections[p.puuid] = p.championId
        }
      })

      return selections
    }

    return {}
  }

  get positionAssignments() {
    if (this.queryStage.phase === 'champ-select') {
      if (!this._lcData.champSelect.session) {
        return {}
      }

      const assignments: Record<
        string,
        {
          position: string
          role: ParsedRole | null
        }
      > = {}

      this._lcData.champSelect.session.myTeam.forEach((p) => {
        if (p.puuid && p.puuid !== EMPTY_PUUID) {
          assignments[p.puuid] = {
            position: p.assignedPosition.toUpperCase(),
            role: null
          }
        }
      })

      this._lcData.champSelect.session.theirTeam.forEach((p) => {
        if (p.puuid && p.puuid !== EMPTY_PUUID) {
          assignments[p.puuid] = {
            position: p.assignedPosition.toUpperCase(),
            role: null
          }
        }
      })

      return assignments
    } else if (this.queryStage.phase === 'in-game') {
      if (!this._lcData.gameflow.session) {
        return {}
      }

      const assignments: Record<
        string,
        {
          position: string
          role: ParsedRole | null
        }
      > = {}

      this._lcData.gameflow.session.gameData.teamOne.forEach((p) => {
        if (p.puuid && p.puuid !== EMPTY_PUUID) {
          assignments[p.puuid] = {
            position: p.selectedPosition,
            role: parseSelectedRole(p.selectedRole)
          }
        }
      })

      this._lcData.gameflow.session.gameData.teamTwo.forEach((p) => {
        if (p.puuid && p.puuid !== EMPTY_PUUID) {
          assignments[p.puuid] = {
            position: p.selectedPosition,
            role: parseSelectedRole(p.selectedRole)
          }
        }
      })

      return assignments
    }

    return {}
  }

  /**
   * 当前对局的队伍分配
   */
  get teams() {
    if (this.queryStage.phase === 'champ-select') {
      if (!this._lcData.champSelect.session) {
        return {}
      }

      if (this.queryStage.gameInfo.queueType === 'CHERRY') {
        return {
          all: [
            ...this._lcData.champSelect.session.myTeam,
            ...this._lcData.champSelect.session.theirTeam
          ]
            .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
            .map((p) => p.puuid)
        }
      }

      const teams: Record<string, string[]> = {}

      this._lcData.champSelect.session.myTeam
        .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
        .forEach((p) => {
          const key = p.team ? `our-${p.team}` : 'our'
          if (!teams[key]) {
            teams[key] = []
          }
          teams[key].push(p.puuid)
        })

      this._lcData.champSelect.session.theirTeam
        .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
        .forEach((p) => {
          const key = p.team ? `their-${p.team}` : 'their'
          if (!teams[key]) {
            teams[key] = []
          }
          teams[key].push(p.puuid)
        })

      return teams
    } else if (this.queryStage.phase === 'in-game') {
      if (!this._lcData.gameflow.session) {
        return {}
      }

      if (this.queryStage.gameInfo.queueType === 'CHERRY') {
        return {
          all: [
            ...this._lcData.gameflow.session.gameData.teamOne,
            ...this._lcData.gameflow.session.gameData.teamTwo
          ]
            .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
            .map((p) => p.puuid)
        }
      }

      const teams: Record<string, string[]> = {
        100: [],
        200: []
      }

      this._lcData.gameflow.session.gameData.teamOne
        .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
        .forEach((p) => {
          teams['100'].push(p.puuid)
        })

      this._lcData.gameflow.session.gameData.teamTwo
        .filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)
        .forEach((p) => {
          teams['200'].push(p.puuid)
        })

      return teams
    }

    return {}
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
  get queryStage() {
    if (
      this._lcData.gameflow.session &&
      this._lcData.gameflow.session.phase === 'ChampSelect' &&
      this._lcData.champSelect.session
    ) {
      return {
        phase: 'champ-select' as 'champ-select' | 'in-game',
        gameInfo: {
          queueId: this._lcData.gameflow.session.gameData.queue.id,
          queueType: this._lcData.gameflow.session.gameData.queue.type,
          gameId: this._lcData.gameflow.session.gameData.gameId,
          gameMode: this._lcData.gameflow.session.gameData.queue.gameMode
        }
      }
    }

    if (
      this._lcData.gameflow.session &&
      (this._lcData.gameflow.session.phase === 'GameStart' ||
        this._lcData.gameflow.session.phase === 'InProgress' ||
        this._lcData.gameflow.session.phase === 'WaitingForStats' ||
        this._lcData.gameflow.session.phase === 'PreEndOfGame' ||
        this._lcData.gameflow.session.phase === 'EndOfGame' ||
        this._lcData.gameflow.session.phase === 'Reconnect')
    ) {
      return {
        phase: 'in-game' as 'champ-select' | 'in-game',
        gameInfo: {
          queueId: this._lcData.gameflow.session.gameData.queue.id,
          queueType: this._lcData.gameflow.session.gameData.queue.type,
          gameId: this._lcData.gameflow.session.gameData.gameId,
          gameMode: this._lcData.gameflow.session.gameData.queue.gameMode
        }
      }
    }

    return {
      phase: 'unavailable' as const,
      gameInfo: null
    }
  }

  /**
   * 在游戏结算时，League Akari 会额外进行一些操作
   */
  get isInEog() {
    return (
      this._lcData.gameflow.phase === 'WaitingForStats' ||
      this._lcData.gameflow.phase === 'PreEndOfGame' ||
      this._lcData.gameflow.phase === 'EndOfGame'
    )
  }

  /**
   * teamParticipantId -> puuids
   *
   * 更加精准的队伍预测
   */
  get teamParticipantGroups() {
    if (!this._lcData.gameflow.session) {
      return {}
    }

    const groups: Record<string, string[]> = {}
    for (const p of [
      ...this._lcData.gameflow.session.gameData.teamOne,
      ...this._lcData.gameflow.session.gameData.teamTwo
    ]) {
      if (!groups[p.teamParticipantId]) {
        groups[p.teamParticipantId] = []
      }

      groups[p.teamParticipantId].push(p.puuid)
    }

    return groups
  }

  /**
   * 计算出来的预设队伍
   */
  inferredPremadeTeams: Record<string, string[][]> = {}

  setInferredPremadeTeams(value: Record<string, string[][]>) {
    this.inferredPremadeTeams = value
  }

  /**
   * 根据目前所有战绩计算出来的玩家分析数据
   */
  playerStats: {
    players: Record<string, MatchHistoryGamesAnalysisAll>
    teams: Record<string, MatchHistoryGamesAnalysisTeamSide>
  } | null = null

  setPlayerStats(
    value: {
      players: Record<string, MatchHistoryGamesAnalysisAll>
      teams: Record<string, MatchHistoryGamesAnalysisTeamSide>
    } | null
  ) {
    this.playerStats = value
  }

  /**
   * 战绩列表的 tag, 用于 SGP API
   */
  matchHistoryTag: string

  setMatchHistoryTag(value: string) {
    this.matchHistoryTag = value
  }

  /**
   * 每名玩家的战绩
   * 手动同步
   */
  matchHistory: Record<
    string,
    {
      /** 战绩源, lc 为通过 LC 代理查询服务器, SGP 为直接查询服务器. 前者高可用 */
      source: 'lcu' | 'sgp'

      /** 适用于 SGP 的 tag string, 当设置为 lcu 时, 该选项会被忽略 */
      tag?: string

      /** 目标加载数量, 非实际数量 */
      targetCount: number

      /** 大概不用说明 */
      data: Game[]
    }
  > = {}

  /**
   * 玩家战绩加载情况, 可为 'loaded' | 'loading' | 'error'
   */
  matchHistoryLoadingState: Record<string, string> = {}

  setMatchHistoryLoadingState(player: string, state: string) {
    this.matchHistoryLoadingState = {
      ...this.matchHistoryLoadingState,
      [player]: state
    }
  }

  /**
   * 每名玩家的召唤师信息
   * 手动同步
   */
  summoner: Record<
    string,
    {
      source: 'lcu' | 'sgp'
      data: SummonerInfo
    }
  > = {}

  /**
   * 玩家召唤师信息加载情况, 可为 'loaded' | 'loading' | 'error'
   */
  summonerLoadingState: Record<string, string> = {}

  /**
   * 每名玩家的段位
   * 手动同步
   */
  rankedStats: Record<
    string,
    {
      source: 'lcu' | 'sgp'
      data: RankedStats
    }
  > = {}

  /**
   * 玩家段位加载情况, 可为 'loaded' | 'loading' | 'error'
   */
  rankedStatsLoadingState: Record<string, string> = {}

  /**
   * 每名玩家的段位
   * 手动同步
   */
  championMastery: Record<
    string,
    {
      source: 'lcu' | 'sgp'
      data: Record<
        number,
        {
          championId: number
          championLevel: number
          championPoints: number
        }
      >
    }
  > = {}

  /**
   * 英雄成就加载情况, 可为 'loaded' | 'loading' | 'error'
   */
  championMasteryLoadingState: Record<string, string> = {}

  savedInfo: Record<string, SavedPlayer> = {}

  /**
   * 已记录信息加载情况, 可为 'loaded' | 'loading' | 'error'
   */
  savedInfoLoadingState: Record<string, string> = {}

  gameTimeline: Record<
    number,
    {
      source: 'lcu' | 'sgp'
      data: GameTimeline
    }
  > = {}

  /**
   * 除了战绩中的对局外, 额外被加载的对局信息
   */
  additionalGame: Record<
    number,
    {
      source: 'lcu' | 'sgp'
      data: Game
    }
  > = {}

  gameTimelineLoadingState: Record<number, string> = {}

  clear() {
    this.playerStats = null
    this.inferredPremadeTeams = {}
    this.matchHistory = {}
    this.summoner = {}
    this.savedInfo = {}
    this.rankedStats = {}
    this.championMastery = {}
    this.matchHistoryTag = 'all'
    this.matchHistoryLoadingState = {}
    this.summonerLoadingState = {}
    this.savedInfoLoadingState = {}
    this.rankedStatsLoadingState = {}
    this.championMasteryLoadingState = {}
    this.gameTimeline = {}
    this.additionalGame = {}
  }

  constructor(private readonly _lcData: LeagueClientData) {
    makeAutoObservable(this, {
      // shallow object
      matchHistory: observable.shallow,
      summoner: observable.shallow,
      rankedStats: observable.shallow,
      savedInfo: observable.shallow,
      championMastery: observable.shallow,
      gameTimeline: observable.shallow,
      additionalGame: observable.shallow,

      // ref object, override only, no modification
      matchHistoryLoadingState: observable.ref,
      summonerLoadingState: observable.ref,
      rankedStatsLoadingState: observable.ref,
      savedInfoLoadingState: observable.ref,
      gameTimelineLoadingState: observable.ref,

      // structured data
      championSelections: computed.struct,
      gameInfo: computed.struct,
      positionAssignments: computed.struct,
      teams: computed.struct,
      inferredPremadeTeams: observable.struct,
      playerStats: observable.struct,
      queryStage: computed.struct,
      teamParticipantGroups: computed.struct
    })
  }
}
