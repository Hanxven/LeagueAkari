import {
  AvailableBot,
  EogStatus,
  Lobby,
  LobbyMember,
  QueueEligibility,
  ReceivedInvitation
} from '@shared/types/league-client/lobby'
import { AxiosInstance } from 'axios'

export class LobbyHttpApi {
  constructor(private _http: AxiosInstance) {}

  createCustomLobby(
    mode: string,
    mapId: number,
    spectatorPolicy: string,
    lobbyName: string,
    lobbyPassword: string | null,
    isCustom: boolean
  ) {
    return this._http.post<Lobby>('/lol-lobby/v2/lobby', {
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
    })
  }

  createQueueLobby(queueId: number) {
    return this._http.post('/lol-lobby/v2/lobby', { queueId })
  }

  createPractice5x5(name = 'League Stalker Room', password = '') {
    return this.createCustomLobby('PRACTICETOOL', 11, 'AllAllowed', name, password, true)
  }

  /**
   * 提升为房主
   * @param summonerId 目标召唤师 ID
   */

  promote(summonerId: string | number) {
    return this._http.post<number>(`/lol-lobby/v2/lobby/members/${summonerId}/promote`)
  }

  kick(summonerId: string | number) {
    return this._http.post<number>(`/lol-lobby/v2/lobby/members/${summonerId}/kick`)
  }

  getMembers() {
    return this._http.get<LobbyMember[]>('/lol-lobby/v2/lobby/members')
  }

  getLobby() {
    return this._http.get<Lobby>('/lol-lobby/v2/lobby')
  }

  deleteLobby() {
    return this._http.delete('/lol-lobby/v2/lobby')
  }

  /**
   * 可以选择的人机种类
   */
  getAvailableBots() {
    return this._http.get<AvailableBot[]>('/lol-lobby/v2/lobby/custom/available-bots')
  }

  /**
   * 是否可以添加人机
   */
  isBotEnabled() {
    return this._http.get<boolean>('/lol-lobby/v2/lobby/custom/bots-enabled')
  }

  addBot(botDifficulty: string, champId: number, teamId: '100' | '200') {
    return this._http.post('/lol-lobby/v1/lobby/custom/bots', {
      botDifficulty,
      championId: champId,
      teamId
    })
  }

  searchMatch() {
    return this._http.post('/lol-lobby/v2/lobby/matchmaking/search')
  }

  deleteSearchMatch() {
    return this._http.delete('/lol-lobby/v2/lobby/matchmaking/search')
  }

  playAgain() {
    return this._http.post('/lol-lobby/v2/play-again')
  }

  getEogStatus() {
    return this._http.get<EogStatus>('/lol-lobby/v2/party/eog-status')
  }

  acceptReceivedInvitation(invitationId: string) {
    return this._http.post(`/lol-lobby/v2/received-invitations/${invitationId}/accept`)
  }

  declineReceivedInvitation(invitationId: string) {
    return this._http.post(`/lol-lobby/v2/received-invitations/${invitationId}/decline`)
  }

  getReceivedInvitations() {
    return this._http.get<ReceivedInvitation[]>('/lol-lobby/v2/received-invitations')
  }

  getEligiblePartyQueues() {
    return this._http.post<QueueEligibility[]>('/lol-lobby/v2/eligibility/party')
  }

  getEligibleSelfQueues() {
    return this._http.post<QueueEligibility[]>('/lol-lobby/v2/eligibility/self')
  }

  setPlayerSlotsStrawberry1(championId: number, mapId = 1, difficultyId = 1) {
    return this._http.put<void>('/lol-lobby/v1/lobby/members/localMember/player-slots', [
      { championId, positionPreference: 'UNSELECTED', spell1: mapId, spell2: difficultyId }
    ])
  }

  setStrawberryMapId(data: { contentId: string; itemId: number }) {
    return this._http.put<void>('/lol-lobby/v2/lobby/strawberryMapId', data)
  }
}
