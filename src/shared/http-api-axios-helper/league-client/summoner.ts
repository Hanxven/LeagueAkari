import { SummonerInfo, SummonerProfile } from '@shared/types/league-client/summoner'
import { AxiosInstance } from 'axios'

export class SummonerHttpApi {
  constructor(private _http: AxiosInstance) {}

  getCurrentSummoner() {
    return this._http.get<SummonerInfo>('/lol-summoner/v1/current-summoner')
  }

  getSummoner(id: number) {
    return this._http.get<SummonerInfo>(`/lol-summoner/v1/summoners/${id}`)
  }

  getSummonerByPuuid(puuid: string) {
    return this._http.get<SummonerInfo>(`/lol-summoner/v2/summoners/puuid/${puuid}`)
  }

  getSummonerByName(name: string) {
    return this._http.get<SummonerInfo>(`/lol-summoner/v1/summoners?name=${name}`)
  }

  checkAvailability(name: string) {
    return this._http.get<boolean>(`/lol-summoner/v1/check-name-availability-new-summoners/${name}`)
  }

  updateSummonerProfile(data: { inventory?: string; key: string; value: any }) {
    return this._http.post('/lol-summoner/v1/current-summoner/summoner-profile', data)
  }

  updateSummonerName(name: string) {
    return this._http.post('/lol-summoner/v1/current-summoner/name', name)
  }

  newSummonerName(name: string) {
    return this._http.post('/lol-summoner/v1/summoners', { name })
  }

  setSummonerBackgroundSkin(skinId: number) {
    return this.updateSummonerProfile({
      key: 'backgroundSkinId',
      value: skinId
    })
  }

  setSummonerBackgroundAugments(augmentId: string) {
    return this.updateSummonerProfile({
      key: 'backgroundSkinAugments',
      value: augmentId
    })
  }

  getSummonerAliases(nameTagList: { gameName: string; tagLine: string }[]) {
    return this._http.post<SummonerInfo[]>('/lol-summoner/v1/summoners/aliases', nameTagList)
  }

  async getSummonerAlias(name: string, tag: string) {
    const response = await this.getSummonerAliases([{ gameName: name, tagLine: tag }])
    const result = response.data[0]
    return result || null
  }

  getCurrentSummonerProfile() {
    return this._http.get<SummonerProfile>('/lol-summoner/v1/current-summoner/summoner-profile')
  }

  getSummonerProfile(puuid: string) {
    return this._http.get<SummonerProfile>(`/lol-summoner/v1/summoner-profile`, {
      params: { puuid }
    })
  }
}
