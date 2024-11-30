import {
  CarouselSkins,
  ChampSelectSession,
  ChampSelectSummoner,
  GridChamp,
  MySelection,
  OngoingTrade
} from '@shared/types/league-client/champ-select'
import { AxiosInstance } from 'axios'

export class ChampSelectHttpApi {
  constructor(private _http: AxiosInstance) {}

  getSession() {
    return this._http.get<ChampSelectSession>('/lol-champ-select/v1/session')
  }

  getAllGridChamps() {
    return this._http.get<GridChamp[]>('/lol-champ-select/v1/all-grid-champions')
  }

  action(actionId: string | number, data: any) {
    return this._http.patch(`/lol-champ-select/v1/session/actions/${actionId}`, data)
  }

  pickOrBan(championId: number, completed: boolean, type: 'pick' | 'ban', actionId: number) {
    return this.action(actionId, { championId, completed, type })
  }

  intentChampion(actionId: number, championId: number) {
    return this.action(actionId, { championId })
  }

  benchSwap(champId: string | number) {
    return this._http.post<void>(`/lol-champ-select/v1/session/bench/swap/${champId}`)
  }

  declineTrade(tradeId: number) {
    return this._http.post(`/lol-champ-select/v1/session/trades/${tradeId}/decline`)
  }

  acceptTrade(tradeId: number) {
    return this._http.post(`/lol-champ-select/v1/session/trades/${tradeId}/accept`)
  }

  cancelTrade(tradeId: number) {
    return this._http.post(`/lol-champ-select/v1/session/trades/${tradeId}/cancel`)
  }

  requestTrade(tradeId: number) {
    return this._http.post(`/lol-champ-select/v1/session/trades/${tradeId}/request`)
  }

  acceptSwap(id: number) {
    return this._http.post(` /lol-champ-select/v1/session/swaps/${id}/accept`)
  }

  declineSwap(id: number) {
    return this._http.post(`/lol-champ-select/v1/session/swaps/${id}/decline`)
  }

  cancelSwap(id: number) {
    return this._http.post(`/lol-champ-select/v1/session/swaps/${id}/cancel`)
  }

  requestSwap(id: number) {
    return this._http.post(`/lol-champ-select/v1/session/swaps/${id}/request`)
  }

  getOngoingTrade() {
    return this._http.get<OngoingTrade>('/lol-champ-select/v1/ongoing-trade')
  }

  getPickableChampIds() {
    return this._http.get<number[]>('/lol-champ-select/v1/pickable-champion-ids')
  }

  getBannableChampIds() {
    return this._http.get<number[]>('/lol-champ-select/v1/bannable-champion-ids')
  }

  reroll() {
    return this._http.post('/lol-champ-select/v1/session/my-selection/reroll')
  }

  getCurrentChamp() {
    return this._http.get<number>('/lol-champ-select/v1/current-champion')
  }

  getDisabledChampions() {
    return this._http.get<number[]>('/lol-champ-select/v1/disabled-champion-ids')
  }

  getSummoner(cellId: number) {
    return this._http.get<ChampSelectSummoner>(`/lol-champ-select/v1/summoners/${cellId}`)
  }

  setSkin(id: number) {
    return this._http.patch('/lol-champ-select/v1/session/my-selection', {
      selectedSkinId: id
    })
  }

  getCarouselSkins() {
    return this._http.get<CarouselSkins[]>('/lol-champ-select/v1/skin-carousel-skins')
  }

  getMySelections() {
    return this._http.get<MySelection>('/lol-champ-select/v1/session/my-selection')
  }

  setSummonerSpells(data: { spell1Id?: number; spell2Id?: number }) {
    return this._http.patch<void>('/lol-champ-select/v1/session/my-selection', data)
  }
}
