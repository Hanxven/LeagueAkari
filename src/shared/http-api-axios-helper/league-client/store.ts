import { GiftableFriend } from '@shared/types/league-client/store'
import { AxiosInstance } from 'axios'

export class StoreHttpApi {
  constructor(private _http: AxiosInstance) {}

  getGiftableFriends() {
    return this._http.get<GiftableFriend[]>('/lol-store/v1/giftablefriends')
  }
}
