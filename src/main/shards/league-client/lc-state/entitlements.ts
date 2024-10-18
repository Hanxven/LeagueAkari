import { EntitlementsToken } from '@shared/types/league-client/entitlements'
import { makeAutoObservable, observable } from 'mobx'

export class EntitlementsState {
  token: EntitlementsToken | null = null

  setToken(t: EntitlementsToken | null) {
    this.token = t
  }

  constructor() {
    makeAutoObservable(this, {
      token: observable.ref
    })
  }
}
