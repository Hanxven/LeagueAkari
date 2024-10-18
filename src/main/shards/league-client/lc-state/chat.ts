import { ChatPerson, Conversation } from '@shared/types/league-client/chat'
import { makeAutoObservable, observable } from 'mobx'

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

export class ChatState {
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
