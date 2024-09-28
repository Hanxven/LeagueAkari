import { MobxBasedBasicModule } from '@main/akari-ipc/mobx-based-basic-module'
import {
  getBannableChampIds,
  getChampSelectSession,
  getChampSelectSummoner,
  getCurrentChamp,
  getDisabledChampions,
  getPickableChampIds
} from '@main/http-api/champ-select'
import { getConversations, getMe, getParticipants } from '@main/http-api/chat'
import { getEntitlementsToken } from '@main/http-api/entitlements'
import {
  getAugments,
  getChampionSummary,
  getItems,
  getPerks,
  getPerkstyles,
  getQueues,
  getSummonerSpells
} from '@main/http-api/game-data'
import { getGameflowPhase, getGameflowSession } from '@main/http-api/gameflow'
import { getV2Ballot } from '@main/http-api/honor'
import { getLobby, getReceivedInvitations } from '@main/http-api/lobby'
import { getLoginQueueState } from '@main/http-api/login'
import { getLolLeagueSessionToken } from '@main/http-api/lol-league-session'
import { getCurrentSummoner } from '@main/http-api/summoner'
import { ChampSelectSummoner } from '@shared/types/lcu/champ-select'
import { Conversation } from '@shared/types/lcu/chat'
import { LcuEvent } from '@shared/types/lcu/event'
import { Ballot } from '@shared/types/lcu/honorV2'
import { formatError } from '@shared/utils/errors'
import { isAxiosError } from 'axios'
import { comparer, computed, makeAutoObservable, observable, runInAction } from 'mobx'
import PQueue from 'p-queue'

import { LcuConnectionModule } from '../lcu-connection'
import { AppLogger, LogModule } from '../log'
import { MainWindowModule } from '../main-window'
import { ChampSelectState } from './champ-select'
import { ChatState } from './chat'
import { EntitlementsState } from './entitlements'
import { GameDataState } from './game-data'
import { GameflowState } from './gameflow'
import { HonorState } from './honor'
import { LobbyState } from './lobby'
import { LoginState } from './login'
import { LolLeagueSessionState } from './lol-league-session'
import { MatchmakingState } from './matchmaking'
import { SummonerState } from './summoner'

interface SyncProgress {
  currentTask: string
  finishedTasks: number
  totalTasks: number
}

class LcuSyncModuleState {
  isInitialized = false

  progress: SyncProgress | null = null

  constructor() {
    makeAutoObservable(this, {
      progress: observable.ref
    })
  }

  setInitialized(value: boolean) {
    this.isInitialized = value
  }

  setProgress(p: SyncProgress | null) {
    this.progress = p
  }
}

export class LcuSyncModule extends MobxBasedBasicModule {
  public state = new LcuSyncModuleState()
  public gameflow = new GameflowState()
  public chat = new ChatState()
  public honor = new HonorState()
  public champSelect = new ChampSelectState()
  public login = new LoginState()
  public lobby = new LobbyState()
  public summoner = new SummonerState()
  public matchmaking = new MatchmakingState()
  public gameData = new GameDataState()
  public entitlements = new EntitlementsState()
  public lolLeagueSession = new LolLeagueSessionState()

  private _logModule: LogModule

  static SUMMONER_FETCH_MAX_RETRIES = 114514

  private _logger: AppLogger
  private _lcm: LcuConnectionModule
  private _mwm: MainWindowModule

  private _gameDataLimiter = new PQueue({
    concurrency: 3
  })

  constructor() {
    super('lcu-state-sync')
  }

  override async setup() {
    await super.setup()

    this._logModule = this.manager.getModule<LogModule>('log')
    this._lcm = this.manager.getModule<LcuConnectionModule>('lcu-connection')
    this._mwm = this.manager.getModule<MainWindowModule>('main-window')
    this._logger = this._logModule.createLogger('lcu-state-sync')

    this._syncLcuGameflow()
    this._syncLcuChampSelect()
    this._syncLcuChat()
    this._syncLcuGameData()
    this._syncLcuHonor()
    this._syncLcuLobby()
    this._syncLcuLogin()
    this._syncLcuMatchmaking()
    this._syncLcuSummoner()
    this._syncLcuEntitlements()
    this._syncLcuLolLeagueSession()

    this._logger.info('初始化完成')
  }

  private _syncLcuGameData() {
    this.propSync('gameData', this.gameData, [
      'champions',
      'items',
      'perks',
      'perkstyles',
      'queues',
      'summonerSpells',
      'augments'
    ])

    this.reaction(
      () => this._lcm.state.state,
      (state) => {
        if (state === 'connected') {
          this._gameDataLimiter.add(() => this._loadSummonerSpells())
          this._gameDataLimiter.add(() => this._loadItems())
          this._gameDataLimiter.add(() => this._loadQueues())
          this._gameDataLimiter.add(() => this._loadPerks())
          this._gameDataLimiter.add(() => this._loadPerkstyles())
          this._gameDataLimiter.add(() => this._loadAugments())
          this._gameDataLimiter.add(() => this._loadChampions())
        }
      },
      { fireImmediately: true }
    )
  }

  private async _loadChampions() {
    try {
      const champions = (await getChampionSummary()).data
      this.gameData.setChampions(
        champions.reduce((prev, cur) => {
          prev[cur.id] = cur
          return prev
        }, {})
      )
    } catch (error) {
      this._mwm.notify.warn('lcu-state-sync', '状态同步', '获取英雄列表失败')
      this._logger.warn(`获取英雄列表失败 ${formatError(error)}`)
    }
  }

  private async _loadAugments() {
    try {
      const augments = (await getAugments()).data
      this.gameData.setAugments(
        augments.reduce((prev, cur) => {
          prev[cur.id] = cur
          return prev
        }, {})
      )
    } catch (error) {
      this._mwm.notify.warn('lcu-state-sync', '状态同步', '获取 augments 失败')
      this._logger.warn(`获取 augments 失败 ${formatError(error)}`)
    }
  }

  private async _loadPerkstyles() {
    try {
      const perkstyles = (await getPerkstyles()).data
      this.gameData.setPerkStyles(
        perkstyles.styles.reduce((prev, cur) => {
          prev[cur.id] = cur
          return prev
        }, {})
      )
    } catch (error) {
      this._mwm.notify.warn('lcu-state-sync', '状态同步', '获取 perkstyles 失败')
      this._logger.warn(`获取 perkstyles 失败 ${formatError(error)}`)
    }
  }

  private async _loadPerks() {
    try {
      const perks = (await getPerks()).data
      this.gameData.setPerks(
        perks.reduce((prev, cur) => {
          prev[cur.id] = cur
          return prev
        }, {})
      )
    } catch (error) {
      this._mwm.notify.warn('lcu-state-sync', '状态同步', '获取 perks 失败')
      this._logger.warn(`获取 perks 失败 ${formatError(error)}`)
    }
  }

  private async _loadQueues() {
    try {
      const queues = (await getQueues()).data
      if (Array.isArray(queues)) {
        const obj = queues.reduce((prev, cur) => {
          // 有多个队列 ID 为 0，忽略除第一个外的其他队列，第一个是自定义队列
          if (cur.id === 0 && prev[0]) {
            return prev
          }

          prev[cur.id] = cur
          return prev
        }, {})
        this.gameData.setQueues(obj)
      } else {
        this.gameData.setQueues(queues as any)
      }
    } catch (error) {
      this._mwm.notify.warn('lcu-state-sync', '状态同步', '获取可用队列失败')
      this._logger.warn(`获取可用队列失败 ${formatError(error)}`)
    }
  }

  private async _loadItems() {
    try {
      const items = (await getItems()).data
      this.gameData.setItems(
        items.reduce((prev, cur) => {
          prev[cur.id] = cur
          return prev
        }, {})
      )
    } catch (error) {
      this._mwm.notify.warn('lcu-state-sync', '状态同步', '获取装备列表失败')
      this._logger.warn(`获取装备列表失败 ${formatError(error)}`)
    }
  }

  private async _loadSummonerSpells() {
    try {
      const spells = (await getSummonerSpells()).data
      this.gameData.setSummonerSpells(
        spells.reduce((prev, cur) => {
          prev[cur.id] = cur
          return prev
        }, {})
      )
    } catch (error) {
      this._mwm.notify.warn('lcu-state-sync', '状态同步', '获取召唤师技能失败')
      this._logger.warn(`获取召唤师技能失败 ${formatError(error)}`)
    }
  }

  private _syncLcuHonor() {
    this.propSync('honor', this.honor, 'ballot')

    this.reaction(
      () => this._lcm.state.state,
      async (state) => {
        if (state === 'connected') {
          try {
            this.honor.setBallot((await getV2Ballot()).data)
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
              this.honor.setBallot(null)
              return
            }

            this._mwm.notify.warn('lcu-state-sync', '状态同步', '获取 honor ballot 失败')
            this._logger.warn(`获取 honor ballot 失败 ${formatError(error)}`)
          }
        } else {
          this.honor.setBallot(null)
        }
      },
      { fireImmediately: true }
    )

    const d = this._lcm.lcuEventBus.on<LcuEvent<Ballot>>(
      '/lol-honor-v2/v1/ballot',
      async (event) => {
        if (event.eventType === 'Delete') {
          this.honor.setBallot(null)
          return
        }

        this.honor.setBallot(event.data)
      }
    )

    this._disposers.add(d)
  }

  private _syncLcuChampSelect() {
    this.propSync('champSelect', this.champSelect, [
      'session',
      'currentPickableChampionIds',
      'currentBannableChampionIds',
      'disabledChampionIds',
      'currentChampion'
    ])

    this.reaction(
      () => this._lcm.state.state,
      async (state) => {
        if (state === 'connected') {
          try {
            this.champSelect.setSession((await getChampSelectSession()).data)
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
              this.champSelect.setSession(null)
              this.champSelect.setSelfSummoner(null)
              return
            }

            this._mwm.notify.warn('lcu-state-sync', '状态同步', '获取 champ-select 会话失败')
            this._logger.warn(`获取 champ-select 会话失败 ${formatError(error)}`)
          }
        } else {
          this.champSelect.setSession(null)
        }
      },
      { fireImmediately: true }
    )

    // 处理中场进入的情况，主动获取可用英雄列表
    this.reaction(
      () => this._lcm.state.state,
      async (state) => {
        if (state === 'connected') {
          try {
            const loadPickables = async () => {
              try {
                const pickables = (await getPickableChampIds()).data
                this.champSelect.setCurrentPickableChampionArray(pickables)
                this._logger.info(`加载可选用英雄列表, 共 ${pickables.length} 个`)
              } catch (error) {
                if (isAxiosError(error) && error.response?.status === 404) {
                  this.champSelect.setCurrentPickableChampionArray([])
                  return
                }

                throw error
              }
            }

            const loadBannables = async () => {
              try {
                const bannables = (await getBannableChampIds()).data
                this.champSelect.setCurrentBannableChampionArray(bannables)
                this._logger.info(`加载可禁用英雄列表, 共 ${bannables.length} 个`)
              } catch (error) {
                if (isAxiosError(error) && error.response?.status === 404) {
                  this.champSelect.setCurrentBannableChampionArray([])
                  return
                }

                throw error
              }
            }

            await Promise.all([loadPickables(), loadBannables()])
          } catch (error) {
            this._mwm.notify.warn('lcu-state-sync', '状态同步', '获取可选英雄/可禁用英雄失败')
            this._logger.warn(`获取可选英雄/可禁用英雄失败 ${formatError(error)}`)
          }
        } else {
          this.champSelect.setCurrentPickableChampionArray([])
          this.champSelect.setCurrentBannableChampionArray([])
        }
      },
      { fireImmediately: true }
    )

    let isCellSummonerUpdated = false
    this.reaction(
      () => this.champSelect.session,
      async (session) => {
        if (!isCellSummonerUpdated && session) {
          const self = session.myTeam.find((t) => t.cellId === session.localPlayerCellId)
          if (self) {
            try {
              const s = await getChampSelectSummoner(self.cellId)

              // 如果没有被更新，用于区分首次加载的情况
              if (!isCellSummonerUpdated) {
                this.champSelect.setSelfSummoner(s.data)
                isCellSummonerUpdated = true
              }
            } catch (error) {
              this._mwm.notify.warn('lcu-state-sync', '状态同步', '获取当前英雄选择召唤师状态失败')
              this._logger.warn(`获取当前英雄选择召唤师状态失败 ${formatError(error)}`)
            }
          }
        }
      },
      { fireImmediately: true }
    )

    const selfSummonerExtracted = computed(() => {
      if (!this.champSelect.selfSummoner) {
        return null
      }

      const { championId, cellId, isActingNow, isPickIntenting } = this.champSelect.selfSummoner

      return {
        championId,
        cellId,
        isActingNow,
        isPickIntenting
      }
    })

    this.reaction(
      () => selfSummonerExtracted.get(),
      (s) => {
        this._logger.info(`Self Summoner Cell: ${JSON.stringify(s)}`)
      },
      { equals: comparer.structural }
    )

    this.reaction(
      () => this._lcm.state.state,
      (state) => {
        if (state !== 'connected') {
          this.champSelect.setSelfSummoner(null)
          isCellSummonerUpdated = false
        }
      },
      { fireImmediately: true }
    )

    this.reaction(
      () => this._lcm.state.state,
      async (state) => {
        if (state === 'connected') {
          try {
            const c = (await getCurrentChamp()).data
            this.champSelect.setCurrentChampion(c)
            this._logger.info(`当前选择的英雄: ${c}`)
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
              this.champSelect.setCurrentChampion(null)
              this._logger.info(`当前选择的英雄: 无`)
              return
            }

            throw error
          }
        } else {
          this.champSelect.setCurrentChampion(null)
        }
      },
      { fireImmediately: true }
    )

    this.reaction(
      () => this._lcm.state.state,
      async (state) => {
        if (state === 'connected') {
          try {
            const c = (await getDisabledChampions()).data
            this.champSelect.setDisabledChampionIds(c)
            this._logger.info(`已被禁用的英雄: ${c}`)
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
              this.champSelect.setDisabledChampionIds([])
              this._logger.info(`已被禁用的英雄: 无`)
              return
            }

            throw error
          }
        } else {
          this.champSelect.setDisabledChampionIds([])
        }
      },
      { fireImmediately: true }
    )

    const d1 = this._lcm.lcuEventBus.on('/lol-champ-select/v1/session', (event) => {
      if (event.eventType === 'Delete') {
        this.champSelect.setSession(null)
        this.champSelect.setSelfSummoner(null)
      } else {
        this.champSelect.setSession(event.data)
      }
    })

    const d2 = this._lcm.lcuEventBus.on<LcuEvent<number[]>>(
      '/lol-champ-select/v1/pickable-champion-ids',
      (event) => {
        if (event.eventType === 'Delete') {
          this.champSelect.setCurrentPickableChampionArray([])
        } else {
          this._logger.info(`更新可选用英雄列表, 共 ${event.data?.length} 个`)
          this.champSelect.setCurrentPickableChampionArray(event.data)
        }
      }
    )

    // 额外的检查步骤, 下同
    // 在后面的时机再次检查一下是否存在数据
    this.reaction(
      () => this.gameflow.phase,
      async (phase) => {
        if (
          phase === 'ChampSelect' &&
          this.champSelect.currentPickableChampionIdArray.length === 0
        ) {
          const { data } = await getPickableChampIds()
          if (data.length) {
            this.champSelect.setCurrentPickableChampionArray(data)
          }
        }
      }
    )

    const d3 = this._lcm.lcuEventBus.on<LcuEvent<number[]>>(
      '/lol-champ-select/v1/bannable-champion-ids',
      (event) => {
        if (event.eventType === 'Delete') {
          this.champSelect.setCurrentBannableChampionArray([])
        } else {
          this._logger.info(`更新可禁用英雄列表, 共 ${event.data?.length} 个`)
          this.champSelect.setCurrentBannableChampionArray(event.data)
        }
      }
    )

    this.reaction(
      () => this.gameflow.phase,
      async (phase) => {
        if (
          phase === 'ChampSelect' &&
          this.champSelect.currentPickableChampionIdArray.length === 0
        ) {
          const { data } = await getBannableChampIds()
          if (data.length) {
            this.champSelect.setCurrentBannableChampionArray(data)
          }
        }
      }
    )
    const d4 = this._lcm.lcuEventBus.on<LcuEvent<ChampSelectSummoner>>(
      '/lol-champ-select/v1/summoners/*',
      (event) => {
        if (event.data && event.data.isSelf) {
          isCellSummonerUpdated = true
          this.champSelect.setSelfSummoner(event.data)
        }
      }
    )

    const d5 = this._lcm.lcuEventBus.on<LcuEvent<number>>(
      '/lol-champ-select/v1/current-champion',
      (event) => {
        this._logger.info(`当前选择的英雄: ${event.data}`)

        if (event.eventType === 'Delete') {
          this.champSelect.setCurrentChampion(null)
        }

        this.champSelect.setCurrentChampion(event.data)
      }
    )

    const d6 = this._lcm.lcuEventBus.on('/lol-champ-select/v1/disabled-champion-ids', (event) => {
      this._logger.info(`被禁用的英雄: ${event.data?.length}`)

      if (event.eventType === 'Delete') {
        this.champSelect.setDisabledChampionIds([])
      } else {
        this.champSelect.setDisabledChampionIds(event.data)
      }
    })

    this._disposers.add(d1)
    this._disposers.add(d2)
    this._disposers.add(d3)
    this._disposers.add(d4)
    this._disposers.add(d5)
    this._disposers.add(d6)
  }

  private _syncLcuChat() {
    this.propSync('chat', this.chat, [
      'me',
      'participants.postGame',
      'participants.customGame',
      'participants.championSelect',
      'conversations.postGame',
      'conversations.customGame',
      'conversations.championSelect'
    ])

    const d1 = this._lcm.lcuEventBus.on<LcuEvent<Conversation>>(
      '/lol-chat/v1/conversations/:id',
      (event, { id }) => {
        if (event.eventType === 'Delete') {
          const decodedId = decodeURIComponent(id) // 需要解码
          if (this.chat.conversations.championSelect?.id === decodedId) {
            runInAction(() => {
              this.chat.setConversationChampSelect(null)
              this.chat.setParticipantsChampSelect(null)
            })
          } else if (this.chat.conversations.postGame?.id === decodedId) {
            runInAction(() => {
              this.chat.setConversationPostGame(null)
              this.chat.setParticipantsPostGame(null)
            })
          } else if (this.chat.conversations.customGame?.id === decodedId) {
            runInAction(() => {
              this.chat.setConversationCustomGame(null)
              this.chat.setParticipantsPostGame(null)
            })
          }
          return
        }

        switch (event.data.type) {
          case 'championSelect':
            if (!event.data.id.includes('lol-champ-select')) {
              return
            }

            if (event.eventType === 'Create') {
              runInAction(() => {
                this.chat.setConversationChampSelect(event.data)
                this.chat.setParticipantsChampSelect([])
              })
            } else if (event.eventType === 'Update') {
              this.chat.setConversationChampSelect(event.data)
            }
            break
          case 'postGame':
            if (event.eventType === 'Create') {
              runInAction(() => {
                this.chat.setConversationPostGame(event.data)
                this.chat.setParticipantsPostGame([])
              })
            } else if (event.eventType === 'Update') {
              this.chat.setConversationPostGame(event.data)
            }
            break

          case 'customGame':
            if (event.eventType === 'Create') {
              runInAction(() => {
                this.chat.setConversationCustomGame(event.data)
                this.chat.setParticipantsCustomGame([])
              })
            } else if (event.eventType === 'Update') {
              this.chat.setConversationCustomGame(event.data)
            }
            break
        }
      }
    )

    // 监测用户进入房间
    const d2 = this._lcm.lcuEventBus.on(
      '/lol-chat/v1/conversations/:conversationId/messages/:messageId',
      (event, param) => {
        if (event.data && event.data.type === 'system' && event.data.body === 'joined_room') {
          if (!event.data.fromSummonerId) {
            return
          }

          if (
            this.chat.conversations.championSelect &&
            this.chat.conversations.championSelect.id === param.conversationId
          ) {
            const p = Array.from(
              new Set([...(this.chat.participants.championSelect ?? []), event.data.fromSummonerId])
            )
            this.chat.setParticipantsChampSelect(p)
          } else if (
            this.chat.conversations.postGame &&
            this.chat.conversations.postGame.id === param.conversationId
          ) {
            const p = Array.from(
              new Set([...(this.chat.participants.postGame ?? []), event.data.fromSummonerId])
            )
            this.chat.setParticipantsPostGame(p)
          } else if (
            this.chat.conversations.customGame &&
            this.chat.conversations.customGame.id === param.conversationId
          ) {
            const p = Array.from(
              new Set([...(this.chat.participants.customGame ?? []), event.data.fromSummonerId])
            )
            this.chat.setParticipantsCustomGame(p)
          }
        }
      }
    )

    const d3 = this._lcm.lcuEventBus.on('/lol-chat/v1/me', (event) => {
      if (event.eventType === 'Update' || event.eventType === 'Create') {
        this.chat.setMe(event.data)
        return
      }

      this.chat.setMe(null)
    })

    this.reaction(
      () => this._lcm.state.state,
      async (state) => {
        if (state === 'connected') {
          try {
            this.chat.setMe((await getMe()).data)
          } catch (error) {
            this._mwm.notify.warn('lcu-state-sync', '状态同步', '获取聊天状态失败')
            this._logger.warn(`获取聊天状态失败 ${formatError(error)}`)
          }
        } else {
          this.chat.setMe(null)
        }
      },
      { fireImmediately: true }
    )

    this.reaction(
      () => this._lcm.state.state,
      async (state) => {
        if (state === 'connected') {
          try {
            const cvs = (await getConversations()).data

            const t: Promise<any>[] = []
            for (const c of cvs) {
              const _load = async () => {
                switch (c.type) {
                  case 'championSelect':
                    if (!c.id.includes('lol-champ-select')) {
                      return
                    }

                    this.chat.setConversationChampSelect(c)
                    const ids1 = (await getParticipants(c.id)).data.map((cc) => cc.summonerId)
                    runInAction(() => this.chat.setParticipantsChampSelect(ids1))
                    break
                  case 'postGame':
                    this.chat.setConversationPostGame(c)
                    const ids2 = (await getParticipants(c.id)).data.map((cc) => cc.summonerId)
                    runInAction(() => this.chat.setParticipantsPostGame(ids2))
                    break
                  case 'customGame':
                    this.chat.setConversationCustomGame(c)
                    const ids3 = (await getParticipants(c.id)).data.map((cc) => cc.summonerId)
                    runInAction(() => this.chat.setParticipantsCustomGame(ids3))
                }
              }
              t.push(_load())
            }

            Promise.allSettled(t)
          } catch (error) {
            if ((error as any)?.response?.data?.message !== 'not connected to RC chat yet') {
              this._mwm.notify.warn('lcu-state-sync', '状态同步', '获取现有对话失败')
              this._logger.warn(`无法获取当前的对话 ${formatError(error)}`)
            }
          }
        } else {
          this.chat.setConversationChampSelect(null)
          this.chat.setConversationPostGame(null)
          this.chat.setConversationCustomGame(null)
          this.chat.setParticipantsChampSelect(null)
          this.chat.setParticipantsChampSelect(null)
          this.chat.setParticipantsPostGame(null)
          this.chat.setParticipantsCustomGame(null)
        }
      },
      { fireImmediately: true }
    )

    this._disposers.add(d1)
    this._disposers.add(d2)
    this._disposers.add(d3)
  }

  private _syncLcuMatchmaking() {
    this.propSync('matchmaking', this.matchmaking, ['readyCheck', 'search'])

    const d1 = this._lcm.lcuEventBus.on('/lol-matchmaking/v1/ready-check', (event) => {
      this.matchmaking.setReadyCheck(event.data)
    })

    const d2 = this._lcm.lcuEventBus.on('/lol-matchmaking/v1/search', (event) => {
      this.matchmaking.setSearch(event.data)
    })

    this._disposers.add(d1)
    this._disposers.add(d2)
  }

  private _syncLcuGameflow() {
    this.propSync('gameflow', this.gameflow, ['phase', 'session'])

    // 立即初始化
    this.reaction(
      () => this._lcm.state.state,
      async (state) => {
        if (state === 'connected') {
          this.gameflow.setPhase((await getGameflowPhase()).data)
        } else {
          this.gameflow.setPhase(null)
        }
      },
      { fireImmediately: true }
    )

    this.reaction(
      () => this._lcm.state.state,
      async (state) => {
        if (state === 'connected') {
          try {
            this.gameflow.setSession((await getGameflowSession()).data)
          } catch {
            this.gameflow.setSession(null)
          }
        } else {
          this.gameflow.setSession(null)
        }
      },
      { fireImmediately: true }
    )

    const d1 = this._lcm.lcuEventBus.on('/lol-gameflow/v1/gameflow-phase', (event) => {
      this.gameflow.setPhase(event.data)
    })

    const d2 = this._lcm.lcuEventBus.on('/lol-gameflow/v1/session', (event) => {
      this.gameflow.setSession(event.data)
    })

    this._disposers.add(d1)
    this._disposers.add(d2)
  }

  private _syncLcuLobby() {
    this.propSync('lobby', this.lobby, 'lobby')
    this.propSync('lobby', this.lobby, 'receivedInvitations')

    const d1 = this._lcm.lcuEventBus.on('/lol-lobby/v2/lobby', (event) => {
      this.lobby.setLobby(event.data)
    })

    const d2 = this._lcm.lcuEventBus.on('/lol-lobby/v2/received-invitations', (event) => {
      this.lobby.setReceivedInvitations(event.data)
    })

    this.reaction(
      () => this._lcm.state.state,
      async (state) => {
        if (state === 'connected') {
          try {
            const lb = (await getLobby()).data
            this.lobby.setLobby(lb)
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
              this.lobby.setLobby(null)
              return
            }

            this._mwm.notify.warn('lcu-state-sync', '状态同步', '获取房间信息失败')
            this._logger.warn(`获取房间信息失败 ${formatError(error)}`)
          }
        } else {
          this.lobby.setLobby(null)
        }
      },
      { fireImmediately: true }
    )

    this.reaction(
      () => this._lcm.state.state,
      async (state) => {
        if (state === 'connected') {
          try {
            const inv = (await getReceivedInvitations()).data
            this.lobby.setReceivedInvitations(inv)
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
              this.lobby.setReceivedInvitations([])
              return
            }

            this._mwm.notify.warn('lcu-state-sync', '状态同步', '获取房间邀请失败')
            this._logger.warn(`获取房间邀请失败 ${formatError(error)}`)
          }
        } else {
          this.lobby.setReceivedInvitations([])
        }
      },
      { fireImmediately: true }
    )

    this._disposers.add(d1)
    this._disposers.add(d2)
  }

  private _syncLcuLogin() {
    this.propSync('login', this.login, 'loginQueueState')

    const d1 = this._lcm.lcuEventBus.on('/lol-login/v1/login-queue-state', (event) => {
      this.login.setLoginQueueState(event.data)
    })

    this.reaction(
      () => this._lcm.state.state,
      async (state) => {
        if (state === 'connected') {
          try {
            const q = (await getLoginQueueState()).data
            this.login.setLoginQueueState(q)
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
              this.login.setLoginQueueState(null)
              return
            }

            this._mwm.notify.warn('lcu-state-sync', '状态同步', '获取登录队列信息失败')
            this._logger.warn(`获取登录队列信息失败 ${formatError(error)}`)
          }
        } else {
          this.login.setLoginQueueState(null)
        }
      },
      { fireImmediately: true }
    )

    this.reaction(
      () => !!this.login.loginQueueState,
      (isQueueing) => {
        if (isQueueing) {
          this._logger.info(`正在登录排队中`)
        }
      },
      { fireImmediately: true }
    )

    this._disposers.add(d1)
  }

  private _syncLcuSummoner() {
    let error: Error
    let retryCount = 0
    let timerId: NodeJS.Timeout | null = null

    this.propSync('summoner', this.summoner, 'me')

    /**
     * 个人信息获取十分关键，因此必须优先获取，以实现后续功能
     */
    const retryFetching = async () => {
      if (retryCount < LcuSyncModule.SUMMONER_FETCH_MAX_RETRIES) {
        try {
          const data = (await getCurrentSummoner()).data
          this.summoner.setMe(data)
          retryCount = 0
          this.summoner.setNewIdSystemEnabled(Boolean(data.tagLine))
        } catch (error) {
          error = error as Error
          retryCount++
          timerId = setTimeout(retryFetching, 1000)
        }
      } else {
        if (timerId) {
          clearTimeout(timerId)
          timerId = null
        }

        this._mwm.notify.warn('lcu-state-sync', '状态同步', '获取召唤师信息失败')
        this._logger.warn(`获取召唤师信息失败 ${formatError(error)}`)
      }
    }

    this.reaction(
      () => [this._lcm.state.state, this.login.loginQueueState] as const,
      ([state, queue]) => {
        if (state === 'connected' && !queue) {
          retryFetching()
        } else if (state === 'disconnected' || queue) {
          if (timerId) {
            clearTimeout(timerId)
            timerId = null
          }
          this.summoner.setMe(null)
          retryCount = 0
        }
      },
      { equals: comparer.structural, fireImmediately: true }
    )

    const d1 = this._lcm.lcuEventBus.on('/lol-summoner/v1/current-summoner', (event) => {
      this.summoner.setMe(event.data)
    })

    this._disposers.add(d1)
  }

  private _syncLcuEntitlements() {
    this.propSync('entitlements', this.entitlements, 'token')

    this.reaction(
      () => this._lcm.state.state,
      async (state) => {
        if (state === 'connected') {
          try {
            const t = (await getEntitlementsToken()).data
            this.entitlements.setToken(t)
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
              this.entitlements.setToken(null)
              return
            }

            this._mwm.notify.warn('lcu-state-sync', '状态同步', '获取 entitlements token 失败')
            this._logger.warn(`获取 entitlements token 失败 ${formatError(error)}`)
          }
        } else {
          this.entitlements.setToken(null)
        }
      },
      { fireImmediately: true }
    )

    const d1 = this._lcm.lcuEventBus.on('/entitlements/v1/token', (event) => {
      this.entitlements.setToken(event.data)
    })

    this._disposers.add(d1)
  }

  private _syncLcuLolLeagueSession() {
    this.propSync('lolLeagueSession', this.lolLeagueSession, 'token')

    this.reaction(
      () => this._lcm.state.state,
      async (state) => {
        if (state === 'connected') {
          try {
            const data = (await getLolLeagueSessionToken()).data
            this.lolLeagueSession.setToken(data)
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
              this.lolLeagueSession.setToken(null)
              return
            }

            this._logger.warn(`获取 LOL League Session 失败 ${formatError(error)}`)
          }
        } else {
          this.lolLeagueSession.setToken(null)
        }
      },
      { fireImmediately: true }
    )

    const d1 = this._lcm.lcuEventBus.on('/lol-league-session/v1/league-session-token', (event) => {
      this.lolLeagueSession.setToken(event.data)
    })

    this._disposers.add(d1)
  }
}

export const lcuSyncModule = new LcuSyncModule()
