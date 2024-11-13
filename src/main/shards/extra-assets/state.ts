import { BalanceType } from '@shared/data-sources/fandom'
import { GtimgHeroListJs } from '@shared/data-sources/gtimg'
import { makeAutoObservable, observable } from 'mobx'

export class ExtraAssetsStateGtimg {
  heroList: GtimgHeroListJs | null

  setHeroList(heroList: GtimgHeroListJs | null) {
    this.heroList = heroList
  }

  constructor() {
    makeAutoObservable(this, {
      heroList: observable.ref
    })
  }
}

export class ExtraAssetsStateFandom {
  balance: Record<string, BalanceType> | null

  setBalance(balance: Record<string, BalanceType> | null) {
    this.balance = balance
  }

  constructor() {
    makeAutoObservable(this, {
      balance: observable.ref
    })
  }
}
