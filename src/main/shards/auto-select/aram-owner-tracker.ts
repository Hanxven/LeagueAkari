import { ChampSelectSession } from '@shared/types/league-client/champ-select'

export interface TrackState {
  [key: number]: Array<
    | {
        place: 'bench'
      }
    | {
        place: 'player'
        puuid: string
        cellId: number
      }
  >
}

/**
 * 乱斗模式下, 追踪英雄主人的工具
 * 记录一个英雄辗转的所有玩家路径
 */
export class AramOwnerTracker {
  prevState: TrackState | null = null

  isJoinAfterSession = false

  update(current: Pick<ChampSelectSession, 'benchEnabled' | 'benchChampions' | 'myTeam'>) {
    if (!current.benchEnabled) {
      this.reset()
      return
    }

    const bench = current.benchChampions
    const players = current.myTeam

    if (this.prevState) {
      const newState = { ...this.prevState }
      bench.forEach((champ) => {
        if (newState[champ.championId]) {
          const last = newState[champ.championId][newState[champ.championId].length - 1]

          if (last && last.place !== 'bench') {
            newState[champ.championId].push({ place: 'bench' })
          }
        } else {
          newState[champ.championId] = [{ place: 'bench' }]
        }
      })

      players.forEach((player) => {
        if (newState[player.championId]) {
          const last = newState[player.championId][newState[player.championId].length - 1]

          if (
            last &&
            (last.place === 'bench' || (last.place === 'player' && last.puuid !== player.puuid))
          ) {
            newState[player.championId].push({
              place: 'player',
              puuid: player.puuid,
              cellId: player.cellId
            })
          }
        } else {
          newState[player.championId] = [
            { place: 'player', puuid: player.puuid, cellId: player.cellId }
          ]
        }
      })

      this.prevState = newState
    } else {
      const newState: TrackState = {}
      bench.forEach((champ) => {
        this.isJoinAfterSession = true
        newState[champ.championId] = [{ place: 'bench' }]
      })

      players.forEach((player) => {
        newState[player.championId] = [
          { place: 'player', puuid: player.puuid, cellId: player.cellId }
        ]
      })
    }
  }

  getOrigin(championId: number) {
    if (!this.prevState) {
      return null
    }

    const state = this.prevState[championId]

    if (!state) {
      return null
    }

    const last = state[0]

    if (last.place === 'player') {
      return last
    }

    return null
  }

  reset() {
    this.prevState = null
    this.isJoinAfterSession = false
  }
}
