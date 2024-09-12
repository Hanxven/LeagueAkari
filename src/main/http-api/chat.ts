import { lcuConnectionModule as lcm } from '@main/modules/lcu-connection'
import { ChatMessage, ChatPerson, Conversation, Friend } from '@shared/types/lcu/chat'

export function getFriends() {
  return lcm.lcuRequest<Friend[]>({
    method: 'GET',
    url: '/lol-chat/v1/friends'
  })
}

export type AvailabilityType = 'chat' | 'mobile' | 'dnd' | 'away' | 'offline'

export function getMe() {
  return lcm.lcuRequest<ChatPerson>({
    method: 'GET',
    url: '/lol-chat/v1/me'
  })
}

export function getConversations() {
  return lcm.lcuRequest<Conversation[]>({
    method: 'GET',
    url: '/lol-chat/v1/conversations'
  })
}

export function getParticipants(id: string) {
  return lcm.lcuRequest<ChatPerson[]>({
    method: 'GET',
    url: `/lol-chat/v1/conversations/${id}/participants`
  })
}

export function changeAvailability(availability: AvailabilityType) {
  return lcm.lcuRequest({
    method: 'PUT',
    url: '/lol-chat/v1/me',
    data: {
      availability,
      ...((availability === 'offline' || availability === 'away') && {
        lol: { gameStatus: 'outOfGame' }
      }),
      ...(availability === 'dnd' && { lol: { gameStatus: 'inGame' } })
    }
  })
}

// 暂时不了解summonerId有什么用处，经过测试是加不加都行，尽量保持原样
export function chatSend(
  targetId: number | string,
  message: string,
  type: string = 'chat',
  isHistorical: boolean = false,
  summonerId?: number
) {
  return lcm.lcuRequest<ChatMessage>({
    method: 'POST',
    url: `/lol-chat/v1/conversations/${targetId}/messages`,
    data: {
      body: message,
      fromId: summonerId,
      fromPid: '',
      fromSummonerId: summonerId ?? 0,
      id: targetId,
      isHistorical,
      timestamp: '',
      type
    }
  })
}

export function chatParticipants(chatRoomId: string) {
  return lcm.lcuRequest({
    method: 'GET',
    url: `/lol-chat/v1/conversations/${chatRoomId}/participants`
  })
}

export function changeRanked(
  rankedLeagueQueue: string,
  rankedLeagueTier: string,
  rankedLeagueDivision?: string
) {
  return lcm.lcuRequest<ChatPerson>({
    method: 'PUT',
    url: '/lol-chat/v1/me',
    data: {
      lol: {
        rankedLeagueQueue,
        rankedLeagueTier,
        rankedLeagueDivision
      }
    }
  })
}

// 新 ID 系统的寻找方式
export function friendRequests(gameName: string, tagLine: string) {
  return lcm.lcuRequest({
    method: 'POST',
    url: '/lol-chat/v2/friend-requests',
    data: {
      gameName,
      tagLine,
      gameTag: tagLine
    }
  })
}
