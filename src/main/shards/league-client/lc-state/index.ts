import { ChampSelectSummoner, OngoingTrade } from '@shared/types/league-client/champ-select'
import { Conversation } from '@shared/types/league-client/chat'
import { LcuEvent } from '@shared/types/league-client/event'
import { Ballot } from '@shared/types/league-client/honorV2'
import { isAxiosError } from 'axios'
import { comparer, computed, makeAutoObservable, observable, runInAction } from 'mobx'

import type { LeagueClientMainContext } from '..'
import { TaskRunner } from '../utils/task-runner'
import { ChampSelectState } from './champ-select'
import { ChatState } from './chat'
import { EntitlementsState } from './entitlements'
import { GameDataState } from './game-data'
import { GameflowState } from './gameflow'
import { HonorState } from './honor'
import { LeagueSessionState } from './league-session'
import { LobbyState } from './lobby'
import { LoginState } from './login'
import { MatchmakingState } from './matchmaking'
import { SummonerState } from './summoner'

type InitializationProgress = {
  currentId: string | null
  finished: string[]
  all: string[]
}

class InitializationState {
  progress: InitializationProgress | null = null

  setProgress(progress: InitializationProgress | null) {
    this.progress = progress
  }

  constructor() {
    makeAutoObservable(this, {
      progress: observable.ref
    })
  }
}

export class LeagueClientData {
  private _stateInitializer = new TaskRunner()

  public initialization = new InitializationState()

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
  public leagueSession = new LeagueSessionState()

  constructor(private readonly _context: LeagueClientMainContext) {
    this._initStateInitializer()
  }

  private _onLcuNotConnectedFnSubs: Function[] = []

  private _onLcuNotConnected(fn: Function) {
    this._onLcuNotConnectedFnSubs.push(fn)
  }

  private _initStateInitializer() {
    this._stateInitializer.createGroup('game-data', { concurrency: 3 })

    const set = new Set<string>()

    this._stateInitializer.on('start', () => {
      this.initialization.setProgress({
        currentId: null,
        finished: [],
        all: []
      })
    })

    this._stateInitializer.on('task-complete', ({ id }) => {
      set.add(id)

      this.initialization.setProgress({
        currentId: id,
        finished: Array.from(set.values()),
        all: Array.from(this._stateInitializer.tasks.values().map((v) => v.id))
      })
    })

    this._stateInitializer.on('stop', () => {
      set.clear()
      this.initialization.setProgress(null)
    })
  }

  private _syncLcuGameflow() {
    this._context.mobx.propSync(this._context.namespace, 'gameflow', this.gameflow, [
      'phase',
      'session'
    ])

    const loadPhase = async () => {
      const phase = await this._context.lc.api.gameflow.getGameflowPhase()
      this.gameflow.setPhase(phase.data)
    }

    const loadSession = async () => {
      const session = await this._context.lc.api.gameflow.getGameflowSession()
      this.gameflow.setSession(session.data)
    }

    this._stateInitializer.register('gameflow-phase', loadPhase)
    this._stateInitializer.register('gameflow-session', loadSession)

    this._onLcuNotConnected(() => {
      this.gameflow.setPhase(null)
      this.gameflow.setSession(null)
    })

    this._context.lc.events.on('/lol-gameflow/v1/gameflow-phase', (event) => {
      this.gameflow.setPhase(event.data)
    })

    this._context.lc.events.on('/lol-gameflow/v1/session', (event) => {
      this.gameflow.setSession(event.data)
    })
  }

  private _syncLcuLobby() {
    this._context.mobx.propSync(this._context.namespace, 'lobby', this.lobby, [
      'lobby',
      'receivedInvitations'
    ])

    const loadLobby = async () => {
      try {
        const lb = (await this._context.lc.api.lobby.getLobby()).data
        this.lobby.setLobby(lb)
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          this.lobby.setLobby(null)
          return
        }

        this._context.ipc.sendEvent(this._context.namespace, 'error-sync-data', 'get-lobby')
        this._context.log.warn(`获取房间信息失败`, error)
      }
    }

    const loadReceivedInvitations = async () => {
      try {
        const inv = (await this._context.lc.api.lobby.getReceivedInvitations()).data
        this.lobby.setReceivedInvitations(inv)
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          this.lobby.setReceivedInvitations([])
          return
        }

        this._context.ipc.sendEvent(
          this._context.namespace,
          'error-sync-data',
          'get-received-invitations'
        )
        this._context.log.warn(`获取房间邀请失败`, error)
      }
    }

    this._stateInitializer.register('lobby-lobby', loadLobby)
    this._stateInitializer.register('lobby-received-invitations', loadReceivedInvitations)

    this._onLcuNotConnected(() => {
      this.lobby.setLobby(null)
      this.lobby.setReceivedInvitations([])
    })

    this._context.lc.events.on('/lol-lobby/v2/lobby', (event) => {
      this.lobby.setLobby(event.data)
    })

    this._context.lc.events.on('/lol-lobby/v2/received-invitations', (event) => {
      this.lobby.setReceivedInvitations(event.data)
    })
  }

  private _syncLcuLogin() {
    this._context.mobx.propSync(this._context.namespace, 'login', this.login, 'loginQueueState')

    const loadLoginQueueState = async () => {
      try {
        const q = (await this._context.lc.api.login.getLoginQueueState()).data
        this.login.setLoginQueueState(q)
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          this.login.setLoginQueueState(null)
          return
        }

        this._context.ipc.sendEvent(
          this._context.namespace,
          'error-sync-data',
          'get-login-queue-state'
        )
        this._context.log.warn(`获取登录队列信息失败`, error)
      }
    }

    this._stateInitializer.register('login-login-queue-state', loadLoginQueueState)

    this._onLcuNotConnected(() => {
      this.login.setLoginQueueState(null)
    })

    this._context.lc.events.on('/lol-login/v1/login-queue-state', (event) => {
      this.login.setLoginQueueState(event.data)
    })

    this._context.mobx.reaction(
      () => !!this.login.loginQueueState,
      (isQueueing) => {
        if (isQueueing) {
          this._context.log.debug(`正在登录排队中`)
        }
      },
      { fireImmediately: true }
    )
  }

  private _syncLcuSummoner() {
    this._context.mobx.propSync(this._context.namespace, 'summoner', this.summoner, [
      'me',
      'profile'
    ])

    const loadCurrentSummoner = async () => {
      try {
        const data = (await this._context.lc.api.summoner.getCurrentSummoner()).data
        this.summoner.setMe(data)
        this.summoner.setNewIdSystemEnabled(Boolean(data.tagLine))
      } catch (error) {
        // sometimes it's not loaded yet but will receive the lcu event update soon
        if (isAxiosError(error) && error.response?.status === 404) {
          this.summoner.setMe(null)
          return
        }

        this._context.ipc.sendEvent(this._context.namespace, 'error-sync-data', 'get-summoner')
        this._context.log.warn(`获取召唤师信息失败`, error)
      }
    }

    // 由于优先级设置, 一定会在 login-queue 之后加载
    this._stateInitializer.register('summoner-current-summoner', loadCurrentSummoner)

    this._onLcuNotConnected(() => {
      this.summoner.setMe(null)
      this.summoner.setProfile(null)
      this.summoner.setNewIdSystemEnabled(false)
    })

    // 此部分仅跟随 current-summoner 之后加载. 因为它不重要
    this._context.mobx.reaction(
      () => this.summoner.me,
      async (me) => {
        if (me && !this.summoner.profile) {
          try {
            const { data } = await this._context.lc.api.summoner.getCurrentSummonerProfile()
            this.summoner.setProfile(data)
          } catch (error) {
            this._context.ipc.sendEvent(
              this._context.namespace,
              'error-sync-data',
              'get-summoner-profile'
            )
            this._context.log.warn(`获取召唤师 profile 信息失败`, error)
          }
        }
      }
    )

    this._context.lc.events.on('/lol-summoner/v1/current-summoner', (event) => {
      this.summoner.setMe(event.data)
      this.summoner.setNewIdSystemEnabled(Boolean(event.data?.tagLine))
    })

    this._context.lc.events.on('/lol-summoner/v1/current-summoner/summoner-profile', (event) => {
      this.summoner.setProfile(event.data)
    })
  }

  private _syncLcuEntitlements() {
    this._context.mobx.propSync(this._context.namespace, 'entitlements', this.entitlements, 'token')

    const loadEntitlementsToken = async () => {
      try {
        const token = (await this._context.lc.api.entitlements.getEntitlementsToken()).data
        this.entitlements.setToken(token)
      } catch (error) {
        this._context.ipc.sendEvent(
          this._context.namespace,
          'error-sync-data',
          'get-entitlements-token'
        )
        this._context.log.warn(`获取 entitlements token 失败`, error)
      }
    }

    this._stateInitializer.register('entitlements-token', loadEntitlementsToken, { priority: 200 })

    this._onLcuNotConnected(() => {
      this.entitlements.setToken(null)
    })

    this._context.lc.events.on('/entitlements/v1/token', (event) => {
      this.entitlements.setToken(event.data)
    })
  }

  private _syncLcuLeagueSession() {
    this._context.mobx.propSync(
      this._context.namespace,
      'leagueSession',
      this.leagueSession,
      'token'
    )

    const loadLeagueSessionToken = async () => {
      try {
        const token = (await this._context.lc.api.leagueSession.getLeagueSessionToken()).data
        this.leagueSession.setToken(token)
      } catch (error) {
        this._context.ipc.sendEvent(
          this._context.namespace,
          'error-sync-data',
          'get-league-session-token'
        )
        this._context.log.warn(`获取 League Session 失败`, error)
      }
    }

    this._stateInitializer.register('league-session-league-session-token', loadLeagueSessionToken, {
      priority: 200
    })

    this._onLcuNotConnected(() => {
      this.leagueSession.setToken(null)
    })

    this._context.lc.events.on('/lol-league-session/v1/league-session-token', (event) => {
      this.leagueSession.setToken(event.data)
    })
  }

  // 这里并没有主动初始化的逻辑, 因为目前并没有使用到
  private _syncLcuMatchmaking() {
    this._context.mobx.propSync(this._context.namespace, 'matchmaking', this.matchmaking, [
      'readyCheck',
      'search'
    ])

    this._onLcuNotConnected(() => {
      this.matchmaking.setReadyCheck(null)
      this.matchmaking.setSearch(null)
    })

    this._context.lc.events.on('/lol-matchmaking/v1/ready-check', (event) => {
      this.matchmaking.setReadyCheck(event.data)
    })

    this._context.lc.events.on('/lol-matchmaking/v1/search', (event) => {
      this.matchmaking.setSearch(event.data)
    })
  }

  private _syncLcuChat() {
    this._context.mobx.propSync(this._context.namespace, 'chat', this.chat, [
      'me',
      'participants.postGame',
      'participants.customGame',
      'participants.championSelect',
      'conversations.postGame',
      'conversations.customGame',
      'conversations.championSelect'
    ])

    const loadMe = async () => {
      try {
        const me = (await this._context.lc.api.chat.getMe()).data
        this.chat.setMe(me)
      } catch (error) {
        this._context.ipc.sendEvent(this._context.namespace, 'error-sync-data', 'get-me')
        this._context.log.warn(`获取聊天状态失败`, error)
      }
    }

    const loadConversation = async () => {
      try {
        const cvs = (await this._context.lc.api.chat.getConversations()).data

        const t: Promise<any>[] = []
        for (const c of cvs) {
          const _load = async () => {
            switch (c.type) {
              case 'championSelect':
                if (!c.id.includes('lol-champ-select')) {
                  return
                }

                this.chat.setConversationChampSelect(c)
                const ids1 = (await this._context.lc.api.chat.getChatParticipants(c.id)).data.map(
                  (cc) => cc.summonerId
                )
                runInAction(() => this.chat.setParticipantsChampSelect(ids1))
                break
              case 'postGame':
                this.chat.setConversationPostGame(c)
                const ids2 = (await this._context.lc.api.chat.getChatParticipants(c.id)).data.map(
                  (cc) => cc.summonerId
                )
                runInAction(() => this.chat.setParticipantsPostGame(ids2))
                break
              case 'customGame':
                this.chat.setConversationCustomGame(c)
                const ids3 = (await this._context.lc.api.chat.getChatParticipants(c.id)).data.map(
                  (cc) => cc.summonerId
                )
                runInAction(() => this.chat.setParticipantsCustomGame(ids3))
            }
          }
          t.push(_load())
        }

        Promise.allSettled(t)
      } catch (error: any) {
        if (error?.response?.data?.message !== 'not connected to RC chat yet') {
          this._context.ipc.sendEvent(
            this._context.namespace,
            'error-sync-data',
            'get-conversations'
          )
          this._context.log.warn(`无法获取当前的对话`, error)
        }
      }
    }

    this._stateInitializer.register('chat-me', loadMe)
    this._stateInitializer.register('chat-conversations', loadConversation)

    this._onLcuNotConnected(() => {
      this.chat.setConversationChampSelect(null)
      this.chat.setConversationCustomGame(null)
      this.chat.setConversationPostGame(null)
      this.chat.setMe(null)
      this.chat.setParticipantsChampSelect(null)
      this.chat.setParticipantsCustomGame(null)
      this.chat.setParticipantsPostGame(null)
    })

    this._context.lc.events.on<LcuEvent<Conversation>>(
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
    this._context.lc.events.on(
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

    this._context.lc.events.on('/lol-chat/v1/me', (event) => {
      if (event.eventType === 'Update' || event.eventType === 'Create') {
        this.chat.setMe(event.data)
        return
      }

      this.chat.setMe(null)
    })
  }

  private _syncLcuChampSelect() {
    this._context.mobx.propSync(this._context.namespace, 'champSelect', this.champSelect, [
      'session',
      'currentPickableChampionIds',
      'currentBannableChampionIds',
      'disabledChampionIds',
      'currentChampion',
      'ongoingTrade'
    ])

    const loadSession = async () => {
      try {
        const session = (await this._context.lc.api.champSelect.getSession()).data
        this.champSelect.setSession(session)
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          this.champSelect.setSession(null)
          return
        }

        this._context.ipc.sendEvent(
          this._context.namespace,
          'error-sync-data',
          'get-champ-select-session'
        )
        this._context.log.warn(`获取 champ-select 会话失败`, error)
      }
    }

    const loadPickables = async () => {
      try {
        const pickables = (await this._context.lc.api.champSelect.getPickableChampIds()).data
        this.champSelect.setCurrentPickableChampionArray(pickables)
        this._context.log.debug(`加载可选用英雄列表, 共 ${pickables.length} 个`)
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          this.champSelect.setCurrentPickableChampionArray([])
          return
        }

        this._context.ipc.sendEvent(
          this._context.namespace,
          'error-sync-data',
          'get-pickable-champ-ids'
        )
        this._context.log.warn(`获取可选英雄失败`, error)
      }
    }

    const loadBannables = async () => {
      try {
        const bannables = (await this._context.lc.api.champSelect.getBannableChampIds()).data
        this.champSelect.setCurrentBannableChampionArray(bannables)
        this._context.log.debug(`加载可禁用英雄列表, 共 ${bannables.length} 个`)
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          this.champSelect.setCurrentBannableChampionArray([])
          return
        }

        this._context.ipc.sendEvent(
          this._context.namespace,
          'error-sync-data',
          'get-bannable-champ-ids'
        )
        this._context.log.warn(`获取可禁用英雄失败`, error)
      }
    }

    // 尝试在之后加载, 包含比较绕的初始化逻辑
    let isCellSummonerUpdated = false
    this._context.mobx.reaction(
      () => this.champSelect.session,
      async (session) => {
        if (!isCellSummonerUpdated && session) {
          const self = session.myTeam.find((t) => t.cellId === session.localPlayerCellId)
          if (self) {
            try {
              const s = await this._context.lc.api.champSelect.getSummoner(self.cellId)

              // 如果没有被更新，用于区分首次加载的情况
              if (!isCellSummonerUpdated) {
                this.champSelect.setSelfSummoner(s.data)
                isCellSummonerUpdated = true
              }
            } catch (error) {
              this._context.ipc.sendEvent(
                this._context.namespace,
                'error-sync-data',
                'get-self-summoner'
              )
              this._context.log.warn(`获取当前英雄选择召唤师状态失败`, error)
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

    this._context.mobx.reaction(
      () => selfSummonerExtracted.get(),
      (s) => {
        this._context.log.debug(`Self Summoner Cell: ${JSON.stringify(s)}`)
      },
      { equals: comparer.structural }
    )

    this._onLcuNotConnected(() => {
      this.champSelect.setSelfSummoner(null)
      isCellSummonerUpdated = false
    })

    const loadCurrentChampion = async () => {
      try {
        const c = (await this._context.lc.api.champSelect.getCurrentChamp()).data
        this.champSelect.setCurrentChampion(c)
        this._context.log.debug(`当前选择的英雄: ${this.gameData.champions[c]?.name || c}`)
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          this.champSelect.setCurrentChampion(null)
          this._context.log.debug(`当前选择的英雄: 无`)
          return
        }

        this._context.ipc.sendEvent(
          this._context.namespace,
          'error-sync-data',
          'get-current-champion'
        )
        this._context.log.warn(`获取当前选择的英雄失败`, error)
      }
    }

    // 在无尽狂潮 (SWARM) 模式后, 这个端点出现了
    const loadDisabledChampions = async () => {
      try {
        const c = (await this._context.lc.api.champSelect.getDisabledChampions()).data
        this.champSelect.setDisabledChampionIds(c)
        this._context.log.debug(`已被禁用的英雄: ${c}`)
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          this.champSelect.setDisabledChampionIds([])
          this._context.log.debug(`已被禁用的英雄: 无`)
          return
        }

        this._context.ipc.sendEvent(
          this._context.namespace,
          'error-sync-data',
          'get-disabled-champions'
        )
        this._context.log.warn(`获取已被禁用的英雄失败`, error)
      }
    }

    const loadOngoingTrade = async () => {
      try {
        const trade = (await this._context.lc.api.champSelect.getOngoingTrade()).data
        this.champSelect.setOngoingTrade(trade)
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          this.champSelect.setOngoingTrade(null)
          return
        }

        this._context.ipc.sendEvent(this._context.namespace, 'error-sync-data', 'get-ongoing-trade')
        this._context.log.warn(`获取进行中的交易失败`, error)
      }
    }

    this._stateInitializer.register('champ-select-session', loadSession)
    this._stateInitializer.register('champ-select-current-champion', loadCurrentChampion)
    this._stateInitializer.register('champ-select-disabled-champions', loadDisabledChampions)
    this._stateInitializer.register('champ-select-ongoing-trade', loadOngoingTrade)
    this._stateInitializer.register('champ-select-pickable-champ-ids', loadPickables)
    this._stateInitializer.register('champ-select-bannable-champ-ids', loadBannables)

    this._onLcuNotConnected(() => {
      this.champSelect.setCurrentBannableChampionArray([])
      this.champSelect.setCurrentChampion(null)
      this.champSelect.setCurrentPickableChampionArray([])
      this.champSelect.setDisabledChampionIds([])
      this.champSelect.setOngoingTrade(null)
      this.champSelect.setSelfSummoner(null)
      this.champSelect.setSession(null)
    })

    // 额外的检查步骤, 下同
    this._context.mobx.reaction(
      () => this.gameflow.session?.phase,
      async (phase) => {
        if (
          phase === 'ChampSelect' &&
          this.champSelect.currentPickableChampionIdArray.length === 0
        ) {
          const { data } = await this._context.lc.api.champSelect.getPickableChampIds()
          if (data.length) {
            this.champSelect.setCurrentPickableChampionArray(data)
          }
        }
      }
    )

    // 额外的检查步骤
    this._context.mobx.reaction(
      () => this.gameflow.session?.phase,
      async (phase) => {
        if (
          phase === 'ChampSelect' &&
          this.champSelect.currentPickableChampionIdArray.length === 0
        ) {
          const { data } = await this._context.lc.api.champSelect.getBannableChampIds()
          if (data.length) {
            this.champSelect.setCurrentBannableChampionArray(data)
          }
        }
      }
    )

    this._context.lc.events.on<LcuEvent<number[]>>(
      '/lol-champ-select/v1/bannable-champion-ids',
      (event) => {
        if (event.eventType === 'Delete') {
          this.champSelect.setCurrentBannableChampionArray([])
        } else {
          this._context.log.debug(`更新可禁用英雄列表, 共 ${event.data?.length} 个`)
          this.champSelect.setCurrentBannableChampionArray(event.data)
        }
      }
    )

    this._context.lc.events.on<LcuEvent<ChampSelectSummoner>>(
      '/lol-champ-select/v1/summoners/*',
      (event) => {
        if (event.data && event.data.isSelf) {
          isCellSummonerUpdated = true
          this.champSelect.setSelfSummoner(event.data)
        }
      }
    )

    this._context.lc.events.on('/lol-champ-select/v1/session', (event) => {
      if (event.eventType === 'Delete') {
        this.champSelect.setSession(null)
        this.champSelect.setSelfSummoner(null)
      } else {
        this.champSelect.setSession(event.data)
      }
    })

    this._context.lc.events.on<LcuEvent<number[]>>(
      '/lol-champ-select/v1/pickable-champion-ids',
      (event) => {
        if (event.eventType === 'Delete') {
          this.champSelect.setCurrentPickableChampionArray([])
        } else {
          this._context.log.debug(`更新可选用英雄列表, 共 ${event.data?.length} 个`)
          this.champSelect.setCurrentPickableChampionArray(event.data)
        }
      }
    )

    this._context.lc.events.on<LcuEvent<number>>(
      '/lol-champ-select/v1/current-champion',
      (event) => {
        this._context.log.debug(
          `当前选择的英雄: ${this.gameData.champions[event.data]?.name || event.data}`
        )

        if (event.eventType === 'Delete') {
          this.champSelect.setCurrentChampion(null)
        }

        this.champSelect.setCurrentChampion(event.data)
      }
    )

    this._context.lc.events.on('/lol-champ-select/v1/disabled-champion-ids', (event) => {
      if (event.data?.length !== 0) {
        this._context.log.debug(`被禁用的英雄: ${event.data?.length}`)
      }

      if (event.eventType === 'Delete') {
        this.champSelect.setDisabledChampionIds([])
      } else {
        this.champSelect.setDisabledChampionIds(event.data)
      }
    })

    this._context.lc.events.on<LcuEvent<OngoingTrade>>(
      '/lol-champ-select/v1/ongoing-trade',
      (event) => {
        if (event.eventType === 'Delete') {
          this.champSelect.setOngoingTrade(null)
          return
        }

        this.champSelect.setOngoingTrade(event.data)
      }
    )
  }

  private _syncLcuHonor() {
    this._context.mobx.propSync(this._context.namespace, 'honor', this.honor, 'ballot')

    const loadBallot = async () => {
      try {
        this.honor.setBallot((await this._context.lc.api.honor.getV2Ballot()).data)
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          this.honor.setBallot(null)
          return
        }

        this._context.ipc.sendEvent(this._context.namespace, 'error-sync-data', 'get-honor-ballot')
        this._context.log.warn(`获取 honor ballot 失败`, error)
      }
    }

    this._stateInitializer.register('honor-ballot', loadBallot)

    this._onLcuNotConnected(() => {
      this.honor.setBallot(null)
    })

    this._context.lc.events.on<LcuEvent<Ballot>>('/lol-honor-v2/v1/ballot', async (event) => {
      if (event.eventType === 'Delete') {
        this.honor.setBallot(null)
        return
      }

      this.honor.setBallot(event.data)
    })
  }

  private _syncLcuGameData() {
    this._context.mobx.propSync(this._context.namespace, 'gameData', this.gameData, [
      'champions',
      'items',
      'perks',
      'perkstyles',
      'queues',
      'summonerSpells',
      'augments'
    ])

    const loadSummonerSpells = async () => {
      try {
        const spells = (await this._context.lc.api.gameData.getSummonerSpells()).data
        this.gameData.setSummonerSpells(
          spells.reduce((prev, cur) => {
            prev[cur.id] = cur
            return prev
          }, {})
        )
      } catch (error) {
        this._context.ipc.sendEvent(
          this._context.namespace,
          'error-sync-data',
          'get-summoner-spells'
        )
        this._context.log.warn(`获取召唤师技能失败`, error)
      }
    }

    const loadItems = async () => {
      try {
        const items = (await this._context.lc.api.gameData.getItems()).data
        this.gameData.setItems(
          items.reduce((prev, cur) => {
            prev[cur.id] = cur
            return prev
          }, {})
        )
      } catch (error) {
        this._context.ipc.sendEvent(this._context.namespace, 'error-sync-data', 'get-items')
        this._context.log.warn(`获取物品列表失败`)
      }
    }

    const loadQueues = async () => {
      try {
        const queues = (await this._context.lc.api.gameData.getQueues()).data
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
        this._context.ipc.sendEvent(this._context.namespace, 'error-sync-data', 'get-queues')
        this._context.log.warn(`获取可用队列失败`)
      }
    }

    const loadPerks = async () => {
      try {
        const perks = (await this._context.lc.api.gameData.getPerks()).data
        this.gameData.setPerks(
          perks.reduce((prev, cur) => {
            prev[cur.id] = cur
            return prev
          }, {})
        )
      } catch (error) {
        this._context.ipc.sendEvent(this._context.namespace, 'error-sync-data', 'get-perks')
        this._context.log.warn(`获取 perks 失败`, error)
      }
    }

    const loadPerkstyles = async () => {
      try {
        const perkstyles = (await this._context.lc.api.gameData.getPerkstyles()).data
        this.gameData.setPerkStyles({
          schemaVersion: perkstyles.schemaVersion,
          styles: perkstyles.styles.reduce((prev, cur) => {
            prev[cur.id] = cur
            return prev
          }, {})
        })
      } catch (error) {
        this._context.ipc.sendEvent(this._context.namespace, 'error-sync-data', 'get-perkstyles')
        this._context.log.warn(`获取 perkstyles 失败`, error)
      }
    }

    const loadAugments = async () => {
      try {
        const augments = (await this._context.lc.api.gameData.getAugments()).data
        this.gameData.setAugments(
          augments.reduce((prev, cur) => {
            prev[cur.id] = cur
            return prev
          }, {})
        )
      } catch (error) {
        this._context.ipc.sendEvent(this._context.namespace, 'error-sync-data', 'get-augments')
        this._context.log.warn(`获取 augments 失败`, error)
      }
    }

    const loadChampions = async () => {
      try {
        const champions = (await this._context.lc.api.gameData.getChampionSummary()).data
        this.gameData.setChampions(
          champions.reduce((prev, cur) => {
            prev[cur.id] = cur
            return prev
          }, {})
        )
      } catch (error) {
        this._context.ipc.sendEvent(this._context.namespace, 'error-sync-data', 'get-champions')
        this._context.log.warn(`获取英雄列表失败`, error)
      }
    }

    this._stateInitializer.register('game-data-summoner-spells', loadSummonerSpells, {
      group: 'game-data'
    })
    this._stateInitializer.register('game-data-items', loadItems, { group: 'game-data' })
    this._stateInitializer.register('game-data-queues', loadQueues, { group: 'game-data' })
    this._stateInitializer.register('game-data-perks', loadPerks, { group: 'game-data' })
    this._stateInitializer.register('game-data-perkstyles', loadPerkstyles, { group: 'game-data' })
    this._stateInitializer.register('game-data-augments', loadAugments, { group: 'game-data' })
    this._stateInitializer.register('game-data-champions', loadChampions, { group: 'game-data' })

    this._onLcuNotConnected(() => {
      // NO NEED TO CLEAR
    })
  }

  init() {
    this._context.mobx.propSync(this._context.namespace, 'initialization', this.initialization, [
      'progress'
    ])

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
    this._syncLcuLeagueSession()

    this._handleLcuConnectionStateChange()
  }

  private _handleLcuConnectionStateChange() {
    this._context.mobx.reaction(
      () => this._context.lc.state.isConnected,
      (connected) => {
        if (connected) {
          this._stateInitializer.start()
        } else {
          if (this._stateInitializer.isRunning) {
            this._stateInitializer.stop()
          }

          this._onLcuNotConnectedFnSubs.forEach((fn) => fn())
        }
      }
    )
  }
}
