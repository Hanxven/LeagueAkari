import {
  getBannableChampIds,
  getChampSelectSession,
  getChampSelectSummoner,
  getCurrentChamp,
  getPickableChampIds
} from '@main/http-api/champ-select'
import { getConversations, getMe, getParticipants } from '@main/http-api/chat'
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
import { getBallot } from '@main/http-api/honor-v2'
import { getLobby } from '@main/http-api/lobby'
import { getLoginQueueState } from '@main/http-api/login'
import { getCurrentSummoner } from '@main/http-api/summoner'
import { MobxBasedBasicModule } from '@main/akari-ipc/modules/mobx-based-basic-module'
import { ChampSelectSummoner } from '@shared/types/lcu/champ-select'
import { Conversation } from '@shared/types/lcu/chat'
import { LcuEvent } from '@shared/types/lcu/event'
import { BallotLegacy } from '@shared/types/lcu/honorV2'
import { formatError } from '@shared/utils/errors'
import { isAxiosError } from 'axios'
import { comparer, runInAction } from 'mobx'
import PQueue from 'p-queue'

import { LcuConnectionModule } from '../akari-core/lcu-connection'
import { AppLogger, LogModule } from '../akari-core/log'
import { MainWindowModule } from '../akari-core/main-window'
import { ChampSelectState } from './champ-select'
import { ChatState } from './chat'
import { GameDataState } from './game-data'
import { GameflowState } from './gameflow'
import { HonorState } from './honor'
import { LobbyState } from './lobby'
import { LoginState } from './login'
import { MatchmakingState } from './matchmaking'
import { SummonerState } from './summoner'

export class LcuSyncModule extends MobxBasedBasicModule {
  public gameflow = new GameflowState()
  public chat = new ChatState()
  public honor = new HonorState()
  public champSelect = new ChampSelectState()
  public login = new LoginState()
  public lobby = new LobbyState()
  public summoner = new SummonerState()
  public matchmaking = new MatchmakingState()
  public gameData = new GameDataState()

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

    this._syncGameflow()
    this._syncLcuChampSelect()
    this._syncLcuChat()
    this._syncLcuGameData()
    this._syncLcuHonor()
    this._syncLcuLobby()
    this._syncLcuLogin()
    this._syncLcuMatchmaking()
    this._syncLcuSummoner()

    this._logger.info('初始化完成')
  }

  private _syncLcuGameData() {
    this.simpleSync('lcu/game-data/augments', () => this.gameData.augments)
    this.simpleSync('lcu/game-data/champions', () => this.gameData.champions)
    this.simpleSync('lcu/game-data/items', () => this.gameData.items)
    this.simpleSync('lcu/game-data/perks', () => this.gameData.perks)
    this.simpleSync('lcu/game-data/perkstyles', () => this.gameData.perkstyles)
    this.simpleSync('lcu/game-data/queues', () => this.gameData.queues)
    this.simpleSync('lcu/game-data/summoner-spells', () => this.gameData.summonerSpells)

    this.autoDisposeReaction(
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
      this.gameData.setQueues(queues)
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
    this.simpleSync('lcu/honor/ballot', () => this.honor.ballot)

    this.autoDisposeReaction(
      () => this._lcm.state.state,
      async (state) => {
        if (state === 'connected') {
          try {
            this.honor.setBallot((await getBallot()).data)
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

    const d = this._lcm.lcuEventBus.on<LcuEvent<BallotLegacy>>(
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
    this.simpleSync('lcu/champ-select/session', () => this.champSelect.session)

    this.simpleSync(
      'lcu/champ-select/pickable-champion-ids',
      () => this.champSelect.currentPickableChampionArray
    )

    this.simpleSync(
      'lcu/champ-select/bannable-champion-ids',
      () => this.champSelect.currentBannableChampionArray
    )

    this.simpleSync('lcu/champ-select/current-champion', () => this.champSelect.currentChampion)

    this.autoDisposeReaction(
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
    this.autoDisposeReaction(
      () => this._lcm.state.state,
      async (state) => {
        if (state === 'connected') {
          try {
            const a = (async () => {
              try {
                const pickables = (await getPickableChampIds()).data
                this.champSelect.setCurrentPickableChampionArray(pickables)
              } catch (error) {
                if (isAxiosError(error) && error.response?.status === 404) {
                  this.champSelect.setCurrentPickableChampionArray([])
                  return
                }

                throw error
              }
            })()

            const b = (async () => {
              try {
                const bannables = (await getBannableChampIds()).data
                this.champSelect.setCurrentBannableChampionArray(bannables)
              } catch (error) {
                if (isAxiosError(error) && error.response?.status === 404) {
                  this.champSelect.setCurrentBannableChampionArray([])
                  return
                }

                throw error
              }
            })()

            await Promise.all([a, b])
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
    this.autoDisposeReaction(
      () => [this.champSelect.session?.myTeam, this.summoner.me?.puuid] as const,
      async ([myTeam, puuid]) => {
        if (!isCellSummonerUpdated && myTeam && puuid) {
          const self = myTeam.find((t) => t.puuid === puuid)
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

    this.autoDisposeReaction(
      () => this._lcm.state.state,
      (state) => {
        if (state !== 'connected') {
          this.champSelect.setSelfSummoner(null)
          isCellSummonerUpdated = false
        }
      },
      { fireImmediately: true }
    )

    this.autoDisposeReaction(
      () => this._lcm.state.state,
      async (state) => {
        if (state === 'connected') {
          try {
            const c = (await getCurrentChamp()).data
            this.champSelect.setCurrentChampion(c)
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
              this.champSelect.setCurrentChampion(null)
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
          this.champSelect.setCurrentPickableChampionArray(event.data)
        }
      }
    )

    const d3 = this._lcm.lcuEventBus.on<LcuEvent<number[]>>(
      '/lol-champ-select/v1/bannable-champion-ids',
      (event) => {
        if (event.eventType === 'Delete') {
          this.champSelect.setCurrentBannableChampionArray([])
        } else {
          this.champSelect.setCurrentBannableChampionArray(event.data)
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
        if (event.eventType === 'Delete') {
          this.champSelect.setCurrentChampion(null)
        }

        this.champSelect.setCurrentChampion(event.data)
      }
    )

    this._disposers.add(d1)
    this._disposers.add(d2)
    this._disposers.add(d3)
    this._disposers.add(d4)
    this._disposers.add(d5)
  }

  private _syncLcuChat() {
    this.simpleSync('lcu/chat/me', () => this.chat.me)
    this.simpleSync(
      'lcu/chat/conversations/champ-select',
      () => this.chat.conversations.championSelect
    )
    this.simpleSync('lcu/chat/conversations/post-game', () => this.chat.conversations.postGame)
    this.simpleSync('lcu/chat/conversations/custom-game', () => this.chat.conversations.customGame)

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

    this.autoDisposeReaction(
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

    this.autoDisposeReaction(
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
    this.simpleSync('lcu/matchmaking/ready-check', () => this.matchmaking.readyCheck)
    this.simpleSync('lcu/matchmaking/search', () => this.matchmaking.search)

    const d1 = this._lcm.lcuEventBus.on('/lol-matchmaking/v1/ready-check', (event) => {
      this.matchmaking.setReadyCheck(event.data)
    })

    const d2 = this._lcm.lcuEventBus.on('/lol-matchmaking/v1/search', (event) => {
      this.matchmaking.setSearch(event.data)
    })

    this._disposers.add(d1)
    this._disposers.add(d2)
  }

  private _syncGameflow() {
    this.simpleSync('lcu/gameflow/phase', () => this.gameflow.phase)
    this.simpleSync('lcu/gameflow/session', () => this.gameflow.session)

    // 立即初始化
    this.autoDisposeReaction(
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

    this.autoDisposeReaction(
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
    this.simpleSync('lcu/lobby/lobby', () => this.lobby.lobby)

    const d1 = this._lcm.lcuEventBus.on('/lol-lobby/v2/lobby', (event) => {
      this.lobby.setLobby(event.data)
    })

    this.autoDisposeReaction(
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

    this._disposers.add(d1)
  }

  private _syncLcuLogin() {
    this.simpleSync('lcu/login/login-queue-state', () => this.login.loginQueueState)

    const d1 = this._lcm.lcuEventBus.on('/lol-login/v1/login-queue-state', (event) => {
      this.login.setLoginQueueState(event.data)
    })

    this.autoDisposeReaction(
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

    this.autoDisposeReaction(
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

    this.simpleSync('lcu/summoner/me', () => this.summoner.me)

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

    this.autoDisposeReaction(
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
}

export const lcuSyncModule = new LcuSyncModule()
