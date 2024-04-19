import { lcuConnectionState, lcuEventEmitter } from '@main/core/lcu-connection'
import { mwNotification } from '@main/core/main-window'
import { getMe } from '@main/http-api/chat'
import { ipcStateSync } from '@main/utils/ipc'
import { ChatPerson, Conversation } from '@shared/types/lcu/chat'
import { formatError } from '@shared/utils/errors'
import { reaction, runInAction } from 'mobx'
import { makeAutoObservable, observable } from 'mobx'

import { logger } from './common'

export interface Conversations {
  championSelect: Conversation | null
  postGame: Conversation | null
}

export interface Participants {
  championSelect: number[] | null
  postGame: number[] | null
}

class ChatState {
  conversations = observable<Conversations>(
    {
      championSelect: null,
      postGame: null
    },
    {
      championSelect: observable.struct,
      postGame: observable.struct
    }
  )

  /**
   * unused yet
   */
  participants = observable<Participants>(
    {
      championSelect: null,
      postGame: null
    },
    {
      championSelect: observable.struct,
      postGame: observable.struct
    }
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

  setParticipantsChampSelect(p: number[] | null) {
    this.participants.championSelect = p
  }

  setParticipantsPostGame(p: number[] | null) {
    this.participants.postGame = p
  }
}

export const chat = new ChatState()

export function chatSync() {
  lcuEventEmitter.on('/lol-chat/v1/conversations/:id', (event, { id }) => {
    if (event.eventType === 'Delete') {
      if (chat.conversations.championSelect?.id === id) {
        runInAction(() => {
          chat.setConversationChampSelect(null)
          chat.setParticipantsChampSelect(null)
        })
      } else if (chat.conversations.postGame?.id === id) {
        runInAction(() => {
          chat.setConversationPostGame(null)
          chat.setParticipantsPostGame(null)
        })
      }
      return
    }

    switch (event.data.type) {
      case 'championSelect':
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
    }
  })

  // 监测用户进入房间
  lcuEventEmitter.on(
    '/lol-chat/v1/conversations/:conversationId/messages/:messageId',
    (event, param) => {
      // 英雄选择期间聊天室
      // 处理英雄选择时，用户加入的记录（只处理加入一次，因为要用来查战绩。用户退出聊天不管，因为会在聊天室销毁后统一清除）
      if (
        event.data &&
        event.data.type === 'system' &&
        event.data.body === 'joined_room' &&
        chat.conversations.championSelect &&
        chat.conversations.championSelect.id === param.conversationId
      ) {
        // 如果召唤师是混淆的，那么 ID = 0，这种情况需要考虑
        if (!event.data.fromSummonerId) {
          return
        }

        // 去重的 id
        const p = Array.from(
          new Set([...(chat.participants.championSelect ?? []), event.data.fromSummonerId])
        )
        chat.setParticipantsChampSelect(p)
      }

      // TODO 游戏结束后聊天室 - 目前还没有逻辑用到
      // ...
    }
  )

  lcuEventEmitter.on('/lol-chat/v1/me', (event) => {
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

  ipcStateSync('lcu/chat/me', () => chat.me)
  ipcStateSync('lcu/chat/conversations/champ-select', () => chat.conversations.championSelect)
  ipcStateSync('lcu/chat/conversations/post-game', () => chat.conversations.postGame)
}
