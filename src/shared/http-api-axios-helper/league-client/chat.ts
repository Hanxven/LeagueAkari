import {
  ChatMessage,
  ChatPerson,
  Conversation,
  Friend,
  FriendGroup
} from '@shared/types/league-client/chat'
import { AxiosInstance } from 'axios'

export type AvailabilityType =
  | 'chat'
  | 'mobile'
  | 'dnd'
  | 'away'
  | 'offline'
  | 'online'
  | 'spectating'

export class ChatHttpApi {
  constructor(private _http: AxiosInstance) {}

  getFriends() {
    return this._http.get<Friend[]>('/lol-chat/v1/friends')
  }

  deleteFriend(id: string) {
    return this._http.delete(`/lol-chat/v1/friends/${id}`)
  }

  getFriendGroups() {
    return this._http.get<FriendGroup[]>('/lol-chat/v1/friend-groups')
  }

  getMe() {
    return this._http.get<ChatPerson>('/lol-chat/v1/me')
  }

  getConversations() {
    return this._http.get<Conversation[]>('/lol-chat/v1/conversations')
  }

  getParticipants(id: string) {
    return this._http.get<ChatPerson[]>(`/lol-chat/v1/conversations/${id}/participants`)
  }

  changeAvailability(availability: AvailabilityType) {
    return this._http.put('/lol-chat/v1/me', {
      availability
    })
  }

  // 暂时不了解summonerId有什么用处，经过测试是加不加都行，尽量保持原样
  chatSend(
    targetId: number | string,
    message: string,
    type: string = 'chat',
    isHistorical: boolean = false,
    summonerId?: number
  ) {
    return this._http.post<ChatMessage>(`/lol-chat/v1/conversations/${targetId}/messages`, {
      body: message,
      fromId: summonerId,
      fromPid: '',
      fromSummonerId: summonerId ?? 0,
      id: targetId,
      isHistorical,
      timestamp: '',
      type
    })
  }

  getChatParticipants(chatRoomId: string) {
    return this._http.get<ChatPerson[]>(`/lol-chat/v1/conversations/${chatRoomId}/participants`)
  }

  changeRanked(rankedLeagueQueue: string, rankedLeagueTier: string, rankedLeagueDivision?: string) {
    return this._http.put<ChatPerson>('/lol-chat/v1/me', {
      lol: {
        rankedLeagueQueue,
        rankedLeagueTier,
        rankedLeagueDivision
      }
    })
  }

  friendRequests(gameName: string, tagLine: string) {
    return this._http.post('/lol-chat/v2/friend-requests', {
      gameName,
      tagLine,
      gameTag: tagLine
    })
  }

  setChatStatusMessage(message: string) {
    return this._http.put<ChatPerson>('/lol-chat/v1/me', {
      statusMessage: message
    })
  }
}
