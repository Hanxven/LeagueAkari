import { makeAutoObservable } from 'mobx'

class TgpApiSettings {
  enabled: boolean = false
  qq: string = ''
  expired: boolean = true
  tgpId: string = ''
  tgpTicket: string = ''

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  setQQ(qq: string) {
    this.qq = qq
  }

  setExpired(expired: boolean) {
    this.expired = expired
  }

  setTgpId(tgpId: string) {
    this.tgpId = tgpId
  }

  setTgpTicket(tgpTicket: string) {
    this.tgpTicket = tgpTicket
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class TgpApiState {
  settings = new TgpApiSettings()

  constructor() {
    makeAutoObservable(this)
  }
}
