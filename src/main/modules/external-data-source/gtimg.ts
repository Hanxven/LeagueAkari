import { Gtimg, GtimgHeroListJs } from '@shared/external-data-source/gtimg'
import { formatError } from '@shared/utils/errors'
import { makeAutoObservable, observable } from 'mobx'

import { ExternalDataSourceModule } from '.'

export class GtimgEdsState {
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

export class GtimgEds {
  public state = new GtimgEdsState()

  private _gtimg = new Gtimg()

  static HERO_LIST_UPDATE_INTERVAL = 7.2e6 // 2 hours

  private _updateHeroListTimerId: NodeJS.Timeout | null = null

  constructor(private _edsm: ExternalDataSourceModule) {}

  async setup() {
    this._setupStateSync()
    this._handleUpdate()
  }

  private _setupStateSync() {
    this._edsm.simpleSync('gtimg/hero-list', () => this.state.heroList)
  }

  private _handleUpdate() {
    this._updateHeroList()
    this._updateHeroListTimerId = setInterval(() => {
      this._updateHeroList()
    }, GtimgEds.HERO_LIST_UPDATE_INTERVAL)
  }

  private async _updateHeroList() {
    try {
      const heroList = await this._gtimg.getHeroList()
      this.state.setHeroList(heroList)
    } catch (error) {
      this._edsm.logger.error(`Gtimg: 更新英雄列表失败: ${formatError(error)}`)
    }
  }
}
