import { lcuConnectionState, lcuEventBus } from '@main/core-modules/lcu-connection'
import { mwNotification } from '@main/core-modules/main-window'
import { getConversations, getMe, getParticipants } from '@main/http-api/chat'
import { ipcStateSync } from '@main/utils/ipc'
import { ChatPerson, Conversation } from '@shared/types/lcu/chat'
import { LcuEvent } from '@shared/types/lcu/event'
import { formatError } from '@shared/utils/errors'
import { reaction, runInAction } from 'mobx'
import { makeAutoObservable, observable } from 'mobx'

import { logger } from './common'

export interface Conversations {
  championSelect: Conversation | null
  postGame: Conversation | null
  customGame: Conversation | null
}

export interface Participants {
  championSelect: number[] | null
  postGame: number[] | null
  customGame: number[] | null
}

class ChatState {
  conversations = observable<Conversations>(
    {
      championSelect: null,
      postGame: null,
      customGame: null
    },
    {
      championSelect: observable.struct,
      postGame: observable.struct,
      customGame: observable.struct
    },
    { deep: false }
  )

  participants = observable<Participants>(
    {
      championSelect: null,
      postGame: null,
      customGame: null
    },
    {
      championSelect: observable.struct,
      postGame: observable.struct,
      customGame: observable.struct
    },
    { deep: false }
  )

  me: ChatPerson | null = null

  constructor() {
    makeAutoObservable(this, {
      me: observable.struct,
      conversations: observable.shallow,
      participants: observable.shallow
    })
  }

  setMe(me: ChatPerson | null) {
    this.me = me
  }

  setConversationChampSelect(c: Conversation | null) {
    this.conversations.championSelect = c
  }

  setConversationPostGame(c: Conversation | null) {
    this.conversations.postGame = c
  }

  setConversationCustomGame(c: Conversation | null) {
    this.conversations.customGame = c
  }

  setParticipantsChampSelect(p: number[] | null) {
    this.participants.championSelect = p
  }

  setParticipantsPostGame(p: number[] | null) {
    this.participants.postGame = p
  }

  setParticipantsCustomGame(p: number[] | null) {
    this.participants.customGame = p
  }
}

export const chat = new ChatState()

export function chatSync() {
  ipcStateSync('lcu/chat/me', () => chat.me)
  ipcStateSync('lcu/chat/conversations/champ-select', () => chat.conversations.championSelect)
  ipcStateSync('lcu/chat/conversations/post-game', () => chat.conversations.postGame)
  ipcStateSync('lcu/chat/conversations/custom-game', () => chat.conversations.customGame)

  lcuEventBus.on<LcuEvent<Conversation>>('/lol-chat/v1/conversations/:id', (event, { id }) => {
    if (event.eventType === 'Delete') {
      const decodedId = decodeURIComponent(id) // 需要解码
      if (chat.conversations.championSelect?.id === decodedId) {
        runInAction(() => {
          chat.setConversationChampSelect(null)
          chat.setParticipantsChampSelect(null)
        })
      } else if (chat.conversations.postGame?.id === decodedId) {
        runInAction(() => {
          chat.setConversationPostGame(null)
          chat.setParticipantsPostGame(null)
        })
      } else if (chat.conversations.customGame?.id === decodedId) {
        runInAction(() => {
          chat.setConversationCustomGame(null)
          chat.setParticipantsPostGame(null)
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
            chat.setConversationChampSelect(event.data)
            chat.setParticipantsChampSelect([])
          })
        } else if (event.eventType === 'Update') {
          chat.setConversationChampSelect(event.data)
        }
        break
      case 'postGame':
        if (event.eventType === 'Create') {
          runInAction(() => {
            chat.setConversationPostGame(event.data)
            chat.setParticipantsPostGame([])
          })
        } else if (event.eventType === 'Update') {
          chat.setConversationPostGame(event.data)
        }
        break

      case 'customGame':
        if (event.eventType === 'Create') {
          runInAction(() => {
            chat.setConversationCustomGame(event.data)
            chat.setParticipantsCustomGame([])
          })
        } else if (event.eventType === 'Update') {
          chat.setConversationCustomGame(event.data)
        }
        break
    }
  })

  // 监测用户进入房间
  lcuEventBus.on(
    '/lol-chat/v1/conversations/:conversationId/messages/:messageId',
    (event, param) => {
      if (event.data && event.data.type === 'system' && event.data.body === 'joined_room') {
        if (!event.data.fromSummonerId) {
          return
        }

        if (
          chat.conversations.championSelect &&
          chat.conversations.championSelect.id === param.conversationId
        ) {
          const p = Array.from(
            new Set([...(chat.participants.championSelect ?? []), event.data.fromSummonerId])
          )
          chat.setParticipantsChampSelect(p)
        } else if (
          chat.conversations.postGame &&
          chat.conversations.postGame.id === param.conversationId
        ) {
          const p = Array.from(
            new Set([...(chat.participants.postGame ?? []), event.data.fromSummonerId])
          )
          chat.setParticipantsPostGame(p)
        } else if (
          chat.conversations.customGame &&
          chat.conversations.customGame.id === param.conversationId
        ) {
          const p = Array.from(
            new Set([...(chat.participants.customGame ?? []), event.data.fromSummonerId])
          )
          chat.setParticipantsCustomGame(p)
        }
      }
    }
  )

  lcuEventBus.on('/lol-chat/v1/me', (event) => {
    if (event.eventType === 'Update' || event.eventType === 'Create') {
      chat.setMe(event.data)
      return
    }

    chat.setMe(null)
  })

  reaction(
    () => lcuConnectionState.state,
    async (state) => {
      if (state === 'connected') {
        try {
          chat.setMe((await getMe()).data)
        } catch (error) {
          mwNotification.warn('lcu-state-sync', '状态同步', '获取聊天状态失败')
          logger.warn(`获取聊天状态失败 ${formatError(error)}`)
        }
      }
    }
  )

  reaction(
    () => lcuConnectionState.state,
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

                  chat.setConversationChampSelect(c)
                  const ids1 = (await getParticipants(c.id)).data.map((cc) => cc.summonerId)
                  runInAction(() => chat.setParticipantsChampSelect(ids1))
                  break
                case 'postGame':
                  chat.setConversationPostGame(c)
                  const ids2 = (await getParticipants(c.id)).data.map((cc) => cc.summonerId)
                  runInAction(() => chat.setParticipantsPostGame(ids2))
                  break
                case 'customGame':
                  chat.setConversationCustomGame(c)
                  const ids3 = (await getParticipants(c.id)).data.map((cc) => cc.summonerId)
                  runInAction(() => chat.setParticipantsCustomGame(ids3))
              }
            }
            t.push(_load())
          }

          Promise.allSettled(t)
        } catch (error) {
          if ((error as any)?.response?.data?.message !== 'not connected to RC chat yet') {
            mwNotification.warn('lcu-state-sync', '状态同步', '获取现有对话失败')
            logger.warn(`无法获取当前的对话 ${formatError(error)}`)
          }
        }
      }
    }
  )
}
