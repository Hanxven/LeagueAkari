import { lcuConnectionModule as lcm } from '@main/modules/lcu-connection'
import {
  AvailableBot,
  EogStatus,
  Lobby,
  LobbyMember,
  ReceivedInvitation
} from '@shared/types/lcu/lobby'

export function createCustomLobby(
  mode: string,
  mapId: number,
  spectatorPolicy: string,
  lobbyName: string,
  lobbyPassword: string | null,
  isCustom: boolean
) {
  return lcm.lcuRequest<Lobby>({
    method: 'POST',
    url: '/lol-lobby/v2/lobby',
    data: {
      customGameLobby: {
        configuration: {
          gameMode: mode,
          gameMutator: '',
          gameServerRegion: '',
          mapId,
          mutators: { id: 1 }, // 1 自选 2 征召 3 禁用 4 全随机
          spectatorPolicy,
          teamSize: 5
        },
        lobbyName,
        lobbyPassword
      },
      isCustom
    }
  })
}

export function createQueueLobby(queueId: number) {
  return lcm.lcuRequest({
    url: '/lol-lobby/v2/lobby',
    method: 'POST',
    data: { queueId }
  })
}

export function createPractice5x5(name = 'League Stalker Room', password = '') {
  return createCustomLobby('PRACTICETOOL', 11, 'AllAllowed', name, password, true)
}

/**
 * 提升为房主
 * @param summonerId 目标召唤师 ID
 */
export function promote(summonerId: string | number) {
  return lcm.lcuRequest<number>({
    url: `/lol-lobby/v2/lobby/members/${summonerId}/promote`,
    method: 'POST'
  })
}

/**
 * 踢了
 * @param summonerId 目标召唤师 ID
 */
export function kick(summonerId: string | number) {
  return lcm.lcuRequest<number>({
    url: `/lol-lobby/v2/lobby/members/${summonerId}/kick`,
    method: 'POST'
  })
}

export function getMembers() {
  return lcm.lcuRequest<LobbyMember[]>({
    url: '/lol-lobby/v2/lobby/members',
    method: 'GET'
  })
}

export function getLobby() {
  return lcm.lcuRequest<Lobby>({
    url: '/lol-lobby/v2/lobby',
    method: 'GET'
  })
}

/**
 * 可以选择的人机种类
 */
export function getAvailableBots() {
  return lcm.lcuRequest<AvailableBot[]>({
    url: '/lol-lobby/v2/lobby/custom/available-bots',
    method: 'GET'
  })
}

/**
 * 是否可以添加人机
 */
export function isBotEnabled() {
  return lcm.lcuRequest<boolean>({
    url: '/lol-lobby/v2/lobby/custom/bots-enabled',
    method: 'GET'
  })
}

export function addBot(botDifficulty: string, champId: number, teamId: '100' | '200') {
  return lcm.lcuRequest({
    url: '/lol-lobby/v1/lobby/custom/bots',
    method: 'POST',
    data: {
      botDifficulty,
      championId: champId,
      teamId
    }
  })
}

export function searchMatch() {
  return lcm.lcuRequest({
    url: '/lol-lobby/v2/lobby/matchmaking/search',
    method: 'POST'
  })
}

export function deleteSearchMatch() {
  return lcm.lcuRequest({
    url: '/lol-lobby/v2/lobby/matchmaking/search',
    method: 'DELETE'
  })
}

export function playAgain() {
  return lcm.lcuRequest({
    url: '/lol-lobby/v2/play-again',
    method: 'POST'
  })
}

export function getEogStatus() {
  return lcm.lcuRequest<EogStatus>({
    url: '/lol-lobby/v2/party/eog-status',
    method: 'GET'
  })
}

export function acceptReceivedInvitation(invitationId: string) {
  return lcm.lcuRequest({
    url: `/lol-lobby/v2/received-invitations/${invitationId}/accept`,
    method: 'POST'
  })
}

export function declineReceivedInvitation(invitationId: string) {
  return lcm.lcuRequest({
    url: `/lol-lobby/v2/received-invitations/${invitationId}/decline`,
    method: 'POST'
  })
}

export function getReceivedInvitations() {
  return lcm.lcuRequest<ReceivedInvitation[]>({
    url: '/lol-lobby/v2/received-invitations',
    method: 'GET'
  })
}
