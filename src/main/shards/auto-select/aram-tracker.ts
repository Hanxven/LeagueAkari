import { ChampSelectSession } from '@shared/types/league-client/champ-select'
import _ from 'lodash'
import { makeAutoObservable, observable } from 'mobx'

export type PlaceInfo =
  | {
      place: 'bench'
    }
  | {
      place: 'player'
      puuid: string
      cellId: number
    }

export type AdditionalPlaceInfo =
  | { place: 'unknown' } // 凭空出现
  | { place: 'reroll' } // reroll
  | { place: 'initial' } // 初始分配

export interface TrackState {
  [key: number]: Array<PlaceInfo & { prev: PlaceInfo | AdditionalPlaceInfo }>
}

export interface TrackEvent {
  championId: number
  from: PlaceInfo | AdditionalPlaceInfo
  to: PlaceInfo
  timestamp: number
}

/**
 * 乱斗模式下, 追踪英雄主人的工具
 * 记录一个英雄辗转的所有玩家路径
 */
export class AramTracker {
  public state = new (class {
    recordedEvents: TrackEvent[] = []
    prevChampionPositionState: TrackState | null = null
    isJoinAfterSession = false

    constructor() {
      makeAutoObservable(this, {
        recordedEvents: observable.ref,
        prevChampionPositionState: observable.ref
      })
    }

    reset() {
      this.recordedEvents = []
      this.prevChampionPositionState = null
      this.isJoinAfterSession = false
    }
  })()

  track(
    currentChampionPositionState: Pick<
      ChampSelectSession,
      'benchEnabled' | 'benchChampions' | 'myTeam'
    >
  ) {
    if (!currentChampionPositionState.benchEnabled) {
      this.reset()
      return
    }

    const bench = currentChampionPositionState.benchChampions
    const players = currentChampionPositionState.myTeam

    if (this.state.prevChampionPositionState) {
      const newState = _.cloneDeep(this.state.prevChampionPositionState)

      bench.forEach((champ) => {
        if (newState[champ.championId]) {
          // 获取上一个该英雄的状态
          // last 事实上不可能为空, 下同
          const last = newState[champ.championId][newState[champ.championId].length - 1]

          // 既然不在 bench 上, 那么一定是在 player 上
          // event: 从 player 上移动到 bench 上
          if (last && last.place !== 'bench') {
            newState[champ.championId].push({
              place: 'bench',
              prev: {
                place: last.place,
                puuid: last.puuid,
                cellId: last.cellId
              }
            })

            this.state.recordedEvents = [
              ...this.state.recordedEvents,
              {
                championId: champ.championId,
                timestamp: Date.now(),
                from: {
                  place: last.place,
                  puuid: last.puuid,
                  cellId: last.cellId
                },
                to: { place: 'bench' }
              }
            ]
          }
        } else {
          // 既然已经出现在 bench 上, 按照道理来说, 它之前一定是在 player 上
          // 但根据条件判断, 并没有该英雄的历史记录, 说明是在 bench 上凭空出现的新英雄, 这在正常情况下是不可能的
          // event: 从 bench 上凭空出现的英雄
          newState[champ.championId] = [{ place: 'bench', prev: { place: 'unknown' } }]

          this.state.recordedEvents = [
            ...this.state.recordedEvents,
            {
              championId: champ.championId,
              timestamp: Date.now(),
              from: { place: 'unknown' },
              to: { place: 'bench' }
            }
          ]
        }
      })

      players.forEach((player) => {
        if (newState[player.championId]) {
          // 获取上一个该英雄的状态
          const last = newState[player.championId][newState[player.championId].length - 1]

          if (last) {
            // 如果之前在 bench 上, 那么说明是从 bench 上换下来的
            // 如果之前在 player 上, 但是不是同一个玩家, 那么说明是玩家之间 trade 得到的
            if (last.place === 'bench') {
              // event: from bench
              newState[player.championId].push({
                place: 'player',
                puuid: player.puuid,
                cellId: player.cellId,
                prev: {
                  place: 'bench'
                }
              })

              this.state.recordedEvents = [
                ...this.state.recordedEvents,
                {
                  championId: player.championId,
                  timestamp: Date.now(),
                  from: { place: 'bench' },
                  to: {
                    place: 'player',
                    puuid: player.puuid,
                    cellId: player.cellId
                  }
                }
              ]
            } else if (last.place === 'player' && last.puuid !== player.puuid) {
              // event: by trade
              newState[player.championId].push({
                place: 'player',
                puuid: player.puuid,
                cellId: player.cellId,
                prev: {
                  place: 'player',
                  puuid: last.puuid,
                  cellId: last.cellId
                }
              })

              this.state.recordedEvents = [
                ...this.state.recordedEvents,
                {
                  championId: player.championId,
                  timestamp: Date.now(),
                  from: {
                    place: 'player',
                    puuid: last.puuid,
                    cellId: last.cellId
                  },
                  to: {
                    place: 'player',
                    puuid: player.puuid,
                    cellId: player.cellId
                  }
                }
              ]
            }
          }
        } else {
          // 但既然应用已经追踪了状态, 说明但之前并任何没有移动记录, 可以排除是通过 bench 或 trade 得到的
          // 如果是初始分配, 那么一定会在第一次追踪时被记录, 但显然这里并没有
          // 那么结果显而易见, 这是通过 reroll 得到的英雄
          // event: reroll 得到的英雄
          newState[player.championId] = [
            {
              place: 'player',
              puuid: player.puuid,
              cellId: player.cellId,
              prev: { place: 'reroll' }
            }
          ]
          this.state.recordedEvents = [
            ...this.state.recordedEvents,
            {
              championId: player.championId,
              timestamp: Date.now(),
              from: { place: 'reroll' },
              to: {
                place: 'player',
                puuid: player.puuid,
                cellId: player.cellId
              }
            }
          ]
        }
      })

      this.state.prevChampionPositionState = newState
    } else {
      // 在不存在 prevState 的情况下, 说明是应用第一次追踪状态
      const newState: TrackState = {}

      bench.forEach((champ) => {
        // 已知应用是第一次进入英雄选择阶段, 但 bench 上已经存在英雄, 可推算知应用一定是在在英雄选择阶段中途才开始统计
        // 要知道, 要保证准确追踪, 应用必须在英雄选择阶段开始时就开始追踪
        // 因此, 可将此处将标记设置为 true
        this.state.isJoinAfterSession = true

        // 自然地, 也无法得知 bench 上的英雄是哪名玩家的, 所以只能设置为 unknown
        // event: 从 bench 上凭空出现的英雄
        newState[champ.championId] = [{ place: 'bench', prev: { place: 'unknown' } }]

        this.state.recordedEvents = [
          ...this.state.recordedEvents,
          {
            championId: champ.championId,
            timestamp: Date.now(),
            from: { place: 'unknown' },
            to: { place: 'bench' }
          }
        ]
      })

      // 第一次开始统计的英雄位于玩家身上, 虽然也无法得知其来源 (极端情况下, 可能是 bench 上换来的, 也可能是玩家之间 trade 得到的)
      // 但这里统一标记为初始分配给玩家的, 不完全对但也不会有太大影响
      // event: 可能的初始分配操作 (如果已经判断为中途加入, 则可能是从 bench 上换下来的, 也可能是玩家之间 trade 得到的, 或者压根没动过)
      players.forEach((player) => {
        newState[player.championId] = [
          {
            place: 'player',
            puuid: player.puuid,
            cellId: player.cellId,
            prev: { place: 'initial' }
          }
        ]

        this.state.recordedEvents = [
          ...this.state.recordedEvents,
          {
            championId: player.championId,
            timestamp: Date.now(),
            from: { place: 'initial' },
            to: {
              place: 'player',
              puuid: player.puuid,
              cellId: player.cellId
            }
          }
        ]
      })

      this.state.prevChampionPositionState = newState
    }
  }

  getOrigin(championId: number) {
    if (!this.state.prevChampionPositionState) {
      return null
    }

    const state = this.state.prevChampionPositionState[championId]

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
    this.state.reset()
  }
}
