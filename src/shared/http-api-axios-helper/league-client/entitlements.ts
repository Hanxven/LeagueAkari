import { EntitlementsToken } from '@shared/types/league-client/entitlements'
import { AxiosInstance } from 'axios'

export class EntitlementsHttpApi {
  constructor(private _http: AxiosInstance) {}

  getEntitlementsToken() {
    return this._http.get<EntitlementsToken>('/entitlements/v1/token')
  }
}
