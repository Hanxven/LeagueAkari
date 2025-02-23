import { ChampSelectSummoner, OngoingTrade } from '@shared/types/league-client/champ-select'
import { Conversation } from '@shared/types/league-client/chat'
import { LcuEvent } from '@shared/types/league-client/event'
import { Ballot } from '@shared/types/league-client/honorV2'
import { isAxiosError } from 'axios'
import { comparer, computed, runInAction } from 'mobx'
import PQueue from 'p-queue'

import type { LeagueClientMain } from '..'
import { AkariIpcMain } from '../../ipc'
import { AkariLogger } from '../../logger-factory'
import { MobxUtilsMain } from '../../mobx-utils'
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

export class LeagueClientSyncedData {
  static SUMMONER_FETCH_MAX_RETRIES = 50000

  private _ipc: AkariIpcMain
  private _log: AkariLogger
  private _mobx: MobxUtilsMain

  private _gameDataLimiter = new PQueue({
    concurrency: 3
  })

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

  constructor(
    private readonly _i: LeagueClientMain,
    private readonly _C: typeof LeagueClientMain,
    _deps: {
      ipc: AkariIpcMain
      log: AkariLogger
      mobx: MobxUtilsMain
    }
  ) {
    this._ipc = _deps.ipc
    this._log = _deps.log
    this._mobx = _deps.mobx
  }

  init() {
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
  }

  private _syncLcuGameData() {
    this._mobx.propSync(this._C.id, 'gameData', this.gameData, [
      'champions',
      'items',
      'perks',
      'perkstyles',
      'queues',
      'summonerSpells',
      'augments'
    ])

    this._mobx.reaction(
      () => this._i.state.connectionState,
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
      const champions = (await this._i.api.gameData.getChampionSummary()).data
      this.gameData.setChampions(
        champions.reduce((prev, cur) => {
          prev[cur.id] = cur
          return prev
        }, {})
      )
    } catch (error) {
      this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-champions')
      this._log.warn(`获取英雄列表失败`, error)
    }
  }

  private async _loadAugments() {
    try {
      const augments = (await this._i.api.gameData.getAugments()).data
      this.gameData.setAugments(
        augments.reduce((prev, cur) => {
          prev[cur.id] = cur
          return prev
        }, {})
      )
    } catch (error) {
      this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-augments')
      this._log.warn(`获取 augments 失败`, error)
    }
  }

  private async _loadPerkstyles() {
    try {
      const perkstyles = (await this._i.api.gameData.getPerkstyles()).data
      this.gameData.setPerkStyles({
        schemaVersion: perkstyles.schemaVersion,
        styles: perkstyles.styles.reduce((prev, cur) => {
          prev[cur.id] = cur
          return prev
        }, {})
      })
    } catch (error) {
      this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-perkstyles')
      this._log.warn(`获取 perkstyles 失败`, error)
    }
  }

  private async _loadPerks() {
    try {
      const perks = (await this._i.api.gameData.getPerks()).data
      this.gameData.setPerks(
        perks.reduce((prev, cur) => {
          prev[cur.id] = cur
          return prev
        }, {})
      )
    } catch (error) {
      this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-perks')
      this._log.warn(`获取 perks 失败`, error)
    }
  }

  private async _loadQueues() {
    try {
      const queues = (await this._i.api.gameData.getQueues()).data
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
      this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-queues')
      this._log.warn(`获取可用队列失败`)
    }
  }

  private async _loadItems() {
    try {
      const items = (await this._i.api.gameData.getItems()).data
      this.gameData.setItems(
        items.reduce((prev, cur) => {
          prev[cur.id] = cur
          return prev
        }, {})
      )
    } catch (error) {
      this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-items')
      this._log.warn(`获取物品列表失败`)
    }
  }

  private async _loadSummonerSpells() {
    try {
      const spells = (await this._i.api.gameData.getSummonerSpells()).data
      this.gameData.setSummonerSpells(
        spells.reduce((prev, cur) => {
          prev[cur.id] = cur
          return prev
        }, {})
      )
    } catch (error) {
      this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-summoner-spells')
      this._log.warn(`获取召唤师技能失败`, error)
    }
  }

  private _syncLcuHonor() {
    this._mobx.propSync(this._C.id, 'honor', this.honor, 'ballot')

    this._mobx.reaction(
      () => this._i.state.connectionState,
      async (state) => {
        if (state === 'connected') {
          try {
            this.honor.setBallot((await this._i.api.honor.getV2Ballot()).data)
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
              this.honor.setBallot(null)
              return
            }

            this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-honor-ballot')
            this._log.warn(`获取 honor ballot 失败`, error)
          }
        } else {
          this.honor.setBallot(null)
        }
      },
      { fireImmediately: true }
    )

    this._i.events.on<LcuEvent<Ballot>>('/lol-honor-v2/v1/ballot', async (event) => {
      if (event.eventType === 'Delete') {
        this.honor.setBallot(null)
        return
      }

      this.honor.setBallot(event.data)
    })
  }

  private _syncLcuChampSelect() {
    this._mobx.propSync(this._C.id, 'champSelect', this.champSelect, [
      'session',
      'currentPickableChampionIds',
      'currentBannableChampionIds',
      'disabledChampionIds',
      'currentChampion',
      'ongoingTrade'
    ])

    this._mobx.reaction(
      () => this._i.state.connectionState,
      async (state) => {
        if (state === 'connected') {
          try {
            this.champSelect.setSession((await this._i.api.champSelect.getSession()).data)
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
              this.champSelect.setSession(null)
              this.champSelect.setSelfSummoner(null)
              return
            }

            this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-champ-select-session')
            this._log.warn(`获取 champ-select 会话失败`, error)
          }
        } else {
          this.champSelect.setSession(null)
        }
      },
      { fireImmediately: true }
    )

    // 处理中场进入的情况，主动获取可用英雄列表
    this._mobx.reaction(
      () => this._i.state.connectionState,
      async (state) => {
        if (state === 'connected') {
          try {
            const loadPickables = async () => {
              try {
                const pickables = (await this._i.api.champSelect.getPickableChampIds()).data
                this.champSelect.setCurrentPickableChampionArray(pickables)
                this._log.debug(`加载可选用英雄列表, 共 ${pickables.length} 个`)
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
                const bannables = (await this._i.api.champSelect.getBannableChampIds()).data
                this.champSelect.setCurrentBannableChampionArray(bannables)
                this._log.debug(`加载可禁用英雄列表, 共 ${bannables.length} 个`)
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
            this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-pickable-champ-ids')
            this._log.warn(`获取可选英雄/可禁用英雄失败`, error)
          }
        } else {
          this.champSelect.setCurrentPickableChampionArray([])
          this.champSelect.setCurrentBannableChampionArray([])
        }
      },
      { fireImmediately: true }
    )

    let isCellSummonerUpdated = false
    this._mobx.reaction(
      () => this.champSelect.session,
      async (session) => {
        if (!isCellSummonerUpdated && session) {
          const self = session.myTeam.find((t) => t.cellId === session.localPlayerCellId)
          if (self) {
            try {
              const s = await this._i.api.champSelect.getSummoner(self.cellId)

              // 如果没有被更新，用于区分首次加载的情况
              if (!isCellSummonerUpdated) {
                this.champSelect.setSelfSummoner(s.data)
                isCellSummonerUpdated = true
              }
            } catch (error) {
              this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-self-summoner')
              this._log.warn(`获取当前英雄选择召唤师状态失败`, error)
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

    this._mobx.reaction(
      () => selfSummonerExtracted.get(),
      (s) => {
        this._log.debug(`Self Summoner Cell: ${JSON.stringify(s)}`)
      },
      { equals: comparer.structural }
    )

    this._mobx.reaction(
      () => this._i.state.connectionState,
      (state) => {
        if (state !== 'connected') {
          this.champSelect.setSelfSummoner(null)
          isCellSummonerUpdated = false
        }
      },
      { fireImmediately: true }
    )

    this._mobx.reaction(
      () => this._i.state.connectionState,
      async (state) => {
        if (state === 'connected') {
          try {
            const c = (await this._i.api.champSelect.getCurrentChamp()).data
            this.champSelect.setCurrentChampion(c)
            this._log.debug(`当前选择的英雄: ${this.gameData.champions[c]?.name || c}`)
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
              this.champSelect.setCurrentChampion(null)
              this._log.debug(`当前选择的英雄: 无`)
              return
            }

            this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-current-champion')
            this._log.warn(`获取当前选择的英雄失败`, error)
          }
        } else {
          this.champSelect.setCurrentChampion(null)
        }
      },
      { fireImmediately: true }
    )

    this._mobx.reaction(
      () => this._i.state.connectionState,
      async (state) => {
        if (state === 'connected') {
          try {
            const c = (await this._i.api.champSelect.getDisabledChampions()).data
            this.champSelect.setDisabledChampionIds(c)
            this._log.debug(`已被禁用的英雄: ${c}`)
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
              this.champSelect.setDisabledChampionIds([])
              this._log.debug(`已被禁用的英雄: 无`)
              return
            }

            this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-disabled-champions')
            this._log.warn(`获取已被禁用的英雄失败`, error)
          }
        } else {
          this.champSelect.setDisabledChampionIds([])
        }
      },
      { fireImmediately: true }
    )

    this._i.events.on('/lol-champ-select/v1/session', (event) => {
      if (event.eventType === 'Delete') {
        this.champSelect.setSession(null)
        this.champSelect.setSelfSummoner(null)
      } else {
        this.champSelect.setSession(event.data)
      }
    })

    this._i.events.on<LcuEvent<number[]>>('/lol-champ-select/v1/pickable-champion-ids', (event) => {
      if (event.eventType === 'Delete') {
        this.champSelect.setCurrentPickableChampionArray([])
      } else {
        this._log.debug(`更新可选用英雄列表, 共 ${event.data?.length} 个`)
        this.champSelect.setCurrentPickableChampionArray(event.data)
      }
    })

    // 额外的检查步骤, 下同
    // 在后面的时机再次检查一下是否存在数据
    this._mobx.reaction(
      () => this.gameflow.phase,
      async (phase) => {
        if (
          phase === 'ChampSelect' &&
          this.champSelect.currentPickableChampionIdArray.length === 0
        ) {
          const { data } = await this._i.api.champSelect.getPickableChampIds()
          if (data.length) {
            this.champSelect.setCurrentPickableChampionArray(data)
          }
        }
      }
    )

    this._i.events.on<LcuEvent<number[]>>('/lol-champ-select/v1/bannable-champion-ids', (event) => {
      if (event.eventType === 'Delete') {
        this.champSelect.setCurrentBannableChampionArray([])
      } else {
        this._log.debug(`更新可禁用英雄列表, 共 ${event.data?.length} 个`)
        this.champSelect.setCurrentBannableChampionArray(event.data)
      }
    })

    this._mobx.reaction(
      () => this.gameflow.session?.phase,
      async (phase) => {
        if (
          phase === 'ChampSelect' &&
          this.champSelect.currentPickableChampionIdArray.length === 0
        ) {
          const { data } = await this._i.api.champSelect.getBannableChampIds()
          if (data.length) {
            this.champSelect.setCurrentBannableChampionArray(data)
          }
        }
      }
    )

    this._mobx.reaction(
      () => this._i.state.connectionState,
      async (state) => {
        if (state === 'connected') {
          try {
            const trade = (await this._i.api.champSelect.getOngoingTrade()).data
            this.champSelect.setOngoingTrade(trade)
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
              this.champSelect.setOngoingTrade(null)
              return
            }

            this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-ongoing-trade')
            this._log.warn(`获取进行中的交易失败`, error)
          }
        } else {
          this._i.data.champSelect.setOngoingTrade(null)
        }
      }
    )

    this._i.events.on<LcuEvent<ChampSelectSummoner>>(
      '/lol-champ-select/v1/summoners/*',
      (event) => {
        if (event.data && event.data.isSelf) {
          isCellSummonerUpdated = true
          this.champSelect.setSelfSummoner(event.data)
        }
      }
    )

    this._i.events.on<LcuEvent<number>>('/lol-champ-select/v1/current-champion', (event) => {
      this._log.debug(`当前选择的英雄: ${this.gameData.champions[event.data]?.name || event.data}`)

      if (event.eventType === 'Delete') {
        this.champSelect.setCurrentChampion(null)
      }

      this.champSelect.setCurrentChampion(event.data)
    })

    this._i.events.on('/lol-champ-select/v1/disabled-champion-ids', (event) => {
      if (event.data?.length !== 0) {
        this._log.debug(`被禁用的英雄: ${event.data?.length}`)
      }

      if (event.eventType === 'Delete') {
        this.champSelect.setDisabledChampionIds([])
      } else {
        this.champSelect.setDisabledChampionIds(event.data)
      }
    })

    this._i.events.on<LcuEvent<OngoingTrade>>('/lol-champ-select/v1/ongoing-trade', (event) => {
      if (event.eventType === 'Delete') {
        this.champSelect.setOngoingTrade(null)
        return
      }

      this.champSelect.setOngoingTrade(event.data)
    })
  }

  private _syncLcuChat() {
    this._mobx.propSync(this._C.id, 'chat', this.chat, [
      'me',
      'participants.postGame',
      'participants.customGame',
      'participants.championSelect',
      'conversations.postGame',
      'conversations.customGame',
      'conversations.championSelect'
    ])

    this._i.events.on<LcuEvent<Conversation>>('/lol-chat/v1/conversations/:id', (event, { id }) => {
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
    })

    // 监测用户进入房间
    this._i.events.on(
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

    this._i.events.on('/lol-chat/v1/me', (event) => {
      if (event.eventType === 'Update' || event.eventType === 'Create') {
        this.chat.setMe(event.data)
        return
      }

      this.chat.setMe(null)
    })

    this._mobx.reaction(
      () => this._i.state.connectionState,
      async (state) => {
        if (state === 'connected') {
          try {
            this.chat.setMe((await this._i.api.chat.getMe()).data)
          } catch (error) {
            this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-me')
            this._log.warn(`获取聊天状态失败`, error)
          }
        } else {
          this.chat.setMe(null)
        }
      },
      { fireImmediately: true }
    )

    this._mobx.reaction(
      () => this._i.state.connectionState,
      async (state) => {
        if (state === 'connected') {
          try {
            const cvs = (await this._i.api.chat.getConversations()).data

            const t: Promise<any>[] = []
            for (const c of cvs) {
              const _load = async () => {
                switch (c.type) {
                  case 'championSelect':
                    if (!c.id.includes('lol-champ-select')) {
                      return
                    }

                    this.chat.setConversationChampSelect(c)
                    const ids1 = (await this._i.api.chat.getChatParticipants(c.id)).data.map(
                      (cc) => cc.summonerId
                    )
                    runInAction(() => this.chat.setParticipantsChampSelect(ids1))
                    break
                  case 'postGame':
                    this.chat.setConversationPostGame(c)
                    const ids2 = (await this._i.api.chat.getChatParticipants(c.id)).data.map(
                      (cc) => cc.summonerId
                    )
                    runInAction(() => this.chat.setParticipantsPostGame(ids2))
                    break
                  case 'customGame':
                    this.chat.setConversationCustomGame(c)
                    const ids3 = (await this._i.api.chat.getChatParticipants(c.id)).data.map(
                      (cc) => cc.summonerId
                    )
                    runInAction(() => this.chat.setParticipantsCustomGame(ids3))
                }
              }
              t.push(_load())
            }

            Promise.allSettled(t)
          } catch (error) {
            if ((error as any)?.response?.data?.message !== 'not connected to RC chat yet') {
              this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-conversations')
              this._log.warn(`无法获取当前的对话`, error)
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
  }

  private _syncLcuMatchmaking() {
    this._mobx.propSync(this._C.id, 'matchmaking', this.matchmaking, ['readyCheck', 'search'])

    this._i.events.on('/lol-matchmaking/v1/ready-check', (event) => {
      this.matchmaking.setReadyCheck(event.data)
    })

    this._i.events.on('/lol-matchmaking/v1/search', (event) => {
      this.matchmaking.setSearch(event.data)
    })
  }

  private _syncLcuGameflow() {
    this._mobx.propSync(this._C.id, 'gameflow', this.gameflow, ['phase', 'session'])

    this._mobx.reaction(
      () => this._i.state.connectionState,
      async (state) => {
        if (state === 'connected') {
          this.gameflow.setPhase((await this._i.api.gameflow.getGameflowPhase()).data)
        } else {
          this.gameflow.setPhase(null)
        }
      },
      { fireImmediately: true }
    )

    this._mobx.reaction(
      () => this._i.state.connectionState,
      async (state) => {
        if (state === 'connected') {
          try {
            this.gameflow.setSession((await this._i.api.gameflow.getGameflowSession()).data)
          } catch {
            this.gameflow.setSession(null)
          }
        } else {
          this.gameflow.setSession(null)
        }
      },
      { fireImmediately: true }
    )

    this._i.events.on('/lol-gameflow/v1/gameflow-phase', (event) => {
      this.gameflow.setPhase(event.data)
    })

    this._i.events.on('/lol-gameflow/v1/session', (event) => {
      this.gameflow.setSession(event.data)
    })
  }

  private _syncLcuLobby() {
    this._mobx.propSync(this._C.id, 'lobby', this.lobby, ['lobby', 'receivedInvitations'])

    this._i.events.on('/lol-lobby/v2/lobby', (event) => {
      this.lobby.setLobby(event.data)
    })

    this._i.events.on('/lol-lobby/v2/received-invitations', (event) => {
      this.lobby.setReceivedInvitations(event.data)
    })

    this._mobx.reaction(
      () => this._i.state.connectionState,
      async (state) => {
        if (state === 'connected') {
          try {
            const lb = (await this._i.api.lobby.getLobby()).data
            this.lobby.setLobby(lb)
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
              this.lobby.setLobby(null)
              return
            }

            this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-lobby')
            this._log.warn(`获取房间信息失败`, error)
          }
        } else {
          this.lobby.setLobby(null)
        }
      },
      { fireImmediately: true }
    )

    this._mobx.reaction(
      () => this._i.state.connectionState,
      async (state) => {
        if (state === 'connected') {
          try {
            const inv = (await this._i.api.lobby.getReceivedInvitations()).data
            this.lobby.setReceivedInvitations(inv)
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
              this.lobby.setReceivedInvitations([])
              return
            }

            this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-received-invitations')
            this._log.warn(`获取房间邀请失败`, error)
          }
        } else {
          this.lobby.setReceivedInvitations([])
        }
      },
      { fireImmediately: true }
    )
  }

  private _syncLcuLogin() {
    this._mobx.propSync(this._C.id, 'login', this.login, 'loginQueueState')

    this._i.events.on('/lol-login/v1/login-queue-state', (event) => {
      this.login.setLoginQueueState(event.data)
    })

    this._mobx.reaction(
      () => this._i.state.connectionState,
      async (state) => {
        if (state === 'connected') {
          try {
            const q = (await this._i.api.login.getLoginQueueState()).data
            this.login.setLoginQueueState(q)
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
              this.login.setLoginQueueState(null)
              return
            }

            this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-login-queue-state')
            this._log.warn(`获取登录队列信息失败`, error)
          }
        } else {
          this.login.setLoginQueueState(null)
        }
      },
      { fireImmediately: true }
    )

    this._mobx.reaction(
      () => !!this.login.loginQueueState,
      (isQueueing) => {
        if (isQueueing) {
          this._log.debug(`正在登录排队中`)
        }
      },
      { fireImmediately: true }
    )
  }

  private _syncLcuSummoner() {
    let error: Error
    let retryCount = 0
    let timerId: NodeJS.Timeout | null = null

    this._mobx.propSync(this._C.id, 'summoner', this.summoner, ['me', 'profile'])

    /**
     * 个人信息获取十分关键，因此必须优先获取，以实现后续功能
     */
    const retryFetching = async () => {
      if (retryCount < LeagueClientSyncedData.SUMMONER_FETCH_MAX_RETRIES) {
        try {
          const data = (await this._i.api.summoner.getCurrentSummoner()).data
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

        this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-summoner')
        this._log.warn(`获取召唤师信息失败，最大重试次数达到`)
      }
    }

    this._mobx.reaction(
      () => [this._i.state.connectionState, this.login.loginQueueState] as const,
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

    this._mobx.reaction(
      () => this._i.state.connectionState,
      async (state) => {
        if (state === 'connected') {
          try {
            const { data } = await this._i.api.summoner.getCurrentSummonerProfile()
            this.summoner.setProfile(data)
          } catch (error) {
            // ignore
          }
        } else {
          this.summoner.setProfile(null)
        }
      }
    )

    this._mobx.reaction(
      () => this.summoner.me,
      async (me) => {
        if (me && !this.summoner.profile) {
          try {
            const { data } = await this._i.api.summoner.getCurrentSummonerProfile()
            this.summoner.setProfile(data)
          } catch (error) {
            this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-summoner-profile')
            this._log.warn(`获取召唤师 profile 信息失败`, error)
          }
        }
      }
    )

    this._i.events.on('/lol-summoner/v1/current-summoner', (event) => {
      this.summoner.setMe(event.data)
    })

    this._i.events.on('/lol-summoner/v1/current-summoner/summoner-profile', (event) => {
      this.summoner.setProfile(event.data)
    })
  }

  private _syncLcuEntitlements() {
    this._mobx.propSync(this._C.id, 'entitlements', this.entitlements, 'token')

    this._mobx.reaction(
      () => this._i.state.connectionState,
      async (state) => {
        if (state === 'connected') {
          try {
            const t = (await this._i.api.entitlements.getEntitlementsToken()).data
            this.entitlements.setToken(t)
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
              this.entitlements.setToken(null)
              return
            }

            this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-entitlements-token')
            this._log.warn(`获取 entitlements token 失败`, error)
          }
        } else {
          this.entitlements.setToken(null)
        }
      },
      { fireImmediately: true }
    )

    this._i.events.on('/entitlements/v1/token', (event) => {
      this.entitlements.setToken(event.data)
    })
  }

  private _syncLcuLeagueSession() {
    this._mobx.propSync(this._C.id, 'leagueSession', this.leagueSession, 'token')

    this._mobx.reaction(
      () => this._i.state.connectionState,
      async (state) => {
        if (state === 'connected') {
          try {
            const data = (await this._i.api.leagueSession.getLeagueSessionToken()).data
            this.leagueSession.setToken(data)
          } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
              this.leagueSession.setToken(null)
              return
            }

            this._ipc.sendEvent(this._C.id, 'error-sync-data', 'get-league-session-token')
            this._log.warn(`获取 LOL League Session 失败`, error)
          }
        } else {
          this.leagueSession.setToken(null)
        }
      },
      { fireImmediately: true }
    )

    this._i.events.on('/lol-league-session/v1/league-session-token', (event) => {
      this.leagueSession.setToken(event.data)
    })
  }
}
