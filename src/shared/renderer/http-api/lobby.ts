import {
  AvailableBot,
  EogStatus,
  Lobby,
  LobbyMember,
  QueueEligibility
} from '@shared/types/lcu/lobby'

import { request } from './common'

export function createCustomLobby(
  mode: string,
  mapId: number,
  spectatorPolicy: string,
  lobbyName: string,
  lobbyPassword: string | null,
  isCustom: boolean
) {
  return request<Lobby>({
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
  return request({
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
  return request<number>({
    url: `/lol-lobby/v2/lobby/members/${summonerId}/promote`,
    method: 'POST'
  })
}

/**
 * 踢了
 * @param summonerId 目标召唤师 ID
 */
export function kick(summonerId: string | number) {
  return request<number>({
    url: `/lol-lobby/v2/lobby/members/${summonerId}/kick`,
    method: 'POST'
  })
}

export function getMembers() {
  return request<LobbyMember[]>({
    url: '/lol-lobby/v2/lobby/members',
    method: 'GET'
  })
}

export function getLobby() {
  return request<Lobby>({
    url: '/lol-lobby/v2/lobby',
    method: 'GET'
  })
}

/**
 * 可以选择的人机种类
 */
export function getAvailableBots() {
  return request<AvailableBot[]>({
    url: '/lol-lobby/v2/lobby/custom/available-bots',
    method: 'GET'
  })
}

/**
 * 是否可以添加人机
 */
export function isBotEnabled() {
  return request<boolean>({
    url: '/lol-lobby/v2/lobby/custom/bots-enabled',
    method: 'GET'
  })
}

export function addBot(botDifficulty: string, champId: number, teamId: '100' | '200') {
  return request({
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
  return request({
    url: '/lol-lobby/v2/lobby/matchmaking/search',
    method: 'POST'
  })
}

export function deleteSearchMatch() {
  return request({
    url: '/lol-lobby/v2/lobby/matchmaking/search',
    method: 'DELETE'
  })
}

export function playAgain() {
  return request({
    url: '/lol-lobby/v2/play-again',
    method: 'POST'
  })
}

export function getEogStatus() {
  return request<EogStatus>({
    url: '/lol-lobby/v2/party/eog-status',
    method: 'GET'
  })
}

export function deleteLobby() {
  return request<void>({
    url: '/lol-lobby/v2/lobby',
    method: 'DELETE'
  })
}

export function setPlayerSlotsStrawberry1(championId: number, mapId = 1, difficultyId = 1) {
  return request({
    method: 'PUT',
    url: '/lol-lobby/v1/lobby/members/localMember/player-slots',
    data: [{ championId, positionPreference: 'UNSELECTED', spell1: mapId, spell2: difficultyId }]
  })
}

export function setStrawberryMapId(data: { contentId: string; itemId: number }) {
  return request<void>({
    method: 'PUT',
    url: '/lol-lobby/v2/lobby/strawberryMapId',
    data
  })
}

export function getEligiblePartyQueues() {
  return request<QueueEligibility[]>({
    url: '/lol-lobby/v2/eligibility/party',
    method: 'POST'
  })
}

export function getEligibleSelfQueues() {
  return request<QueueEligibility[]>({
    url: '/lol-lobby/v2/eligibility/self',
    method: 'POST'
  })
}
