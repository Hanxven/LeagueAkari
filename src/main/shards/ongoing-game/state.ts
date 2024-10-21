import { EMPTY_PUUID } from '@shared/constants/common'
import { Game, MatchHistory } from '@shared/types/lcu/match-history'
import { RankedStats } from '@shared/types/lcu/ranked'
import { SummonerInfo } from '@shared/types/lcu/summoner'
import {
  MatchHistoryGamesAnalysisAll,
  MatchHistoryGamesAnalysisTeamSide
} from '@shared/utils/analysis'
import { parseSelectedRole } from '@shared/utils/ranked'
import { computed, makeAutoObservable, observable } from 'mobx'

import { LeagueClientSyncedData } from '../league-client/data'

export class OngoingGameSettings {
  enabled: boolean = true
  preMadeTeamThreshold: number = 3
  matchHistoryLoadCount: number = 20
  concurrency: number = 3
  orderPlayerBy: 'win-rate' | 'kda' | 'default' | 'akari-score' = 'default'

  /**
   * 查询战绩时是否优先使用 SGP API
   */
  matchHistoryUseSgpApi: boolean = true

  setEnabled(value: boolean) {
    this.enabled = value
  }

  setPreMadeTeamThreshold(value: number) {
    this.preMadeTeamThreshold = value
  }

  setMatchHistoryLoadCount(value: number) {
    this.matchHistoryLoadCount = value
  }

  setConcurrency(limit: number) {
    this.concurrency = limit
  }

  setUseSgpApi(value: boolean) {
    this.matchHistoryUseSgpApi = value
  }

  setOrderPlayerBy(value: 'win-rate' | 'kda' | 'default' | 'akari-score') {
    this.orderPlayerBy = value
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
      queueId: !this._lcData.gameflow.session.gameData.queue.id,
      queueType: !this._lcData.gameflow.session.gameData.queue.type,
      gameId: !this._lcData.gameflow.session.gameData.gameId,
      gameMode: !this._lcData.gameflow.session.gameData.queue.gameMode
    }
  }

  /**
   * 当前进行的英雄选择
   */
  get championSelections() {
    if (this.queryStage.phase === 'champ-select') {
      if (!this._lcData.champSelect.session) {
        return null
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
        return null
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

    return null
  }

  get positionAssignments() {
    if (this.queryStage.phase === 'champ-select') {
      if (!this._lcData.champSelect.session) {
        return null
      }

      const assignments: Record<string, any> = {}

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
        return null
      }

      const assignments: Record<string, any> = {}

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

    return null
  }

  /**
   * 当前对局的队伍分配
   */
  get teams() {
    if (this.queryStage.phase === 'champ-select') {
      if (!this._lcData.champSelect.session) {
        return null
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
        return null
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

    return null
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
        phase: 'champ-select',
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
        phase: 'in-game',
        gameInfo: {
          queueId: this._lcData.gameflow.session.gameData.queue.id,
          queueType: this._lcData.gameflow.session.gameData.queue.type,
          gameId: this._lcData.gameflow.session.gameData.gameId,
          gameMode: this._lcData.gameflow.session.gameData.queue.gameMode
        }
      }
    }

    return {
      phase: 'unavailable',
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
   * 计算出来的预设队伍
   */
  premadeTeams: Record<string, string[][]> = {}

  /**
   * 根据目前所有战绩计算出来的玩家分析数据
   */
  playerStats: {
    players: Record<string, MatchHistoryGamesAnalysisAll>
    teams: Record<string, MatchHistoryGamesAnalysisTeamSide>
  } | null = null

  /**
   * 每名玩家的战绩
   * 手动同步
   */
  matchHistory: Record<
    string,
    {
      source: 'lcu' | 'sgp'
      data: Game[]
    }[]
  > = {}

  /**
   * 每名玩家的召唤师信息
   * 手动同步
   */
  summoner: Record<
    string,
    {
      source: 'lcu' | 'sgp'
      data: SummonerInfo
    }[]
  > = {}

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

  constructor(private readonly _lcData: LeagueClientSyncedData) {
    makeAutoObservable(this, {
      // shallow object
      matchHistory: observable.shallow,
      summoner: observable.shallow,
      rankedStats: observable.shallow,

      // structured data
      championSelections: computed.struct,
      gameInfo: computed.struct,
      positionAssignments: computed.struct,
      teams: computed.struct,
      premadeTeams: observable.struct,
      playerStats: observable.struct,
      queryStage: computed.struct
    })
  }
}
