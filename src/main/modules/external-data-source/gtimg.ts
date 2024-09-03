import { TimeoutTask } from '@main/utils/timer'
import { Gtimg, GtimgHeroListJs } from '@shared/data-sources/gtimg'
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

  static HERO_LIST_UPDATE_INTERVAL = 3.6e6 // 1 hour
  static HERO_LIST_UPDATE_INTERVAL_ON_ERROR = 60000 // 1 minute

  private _timerTask = new TimeoutTask(() => this._updateHeroList())

  constructor(private _edsm: ExternalDataSourceModule) {}

  async setup() {
    this._setupStateSync()
    this._handleUpdate()
  }

  private _setupStateSync() {
    this._edsm.getterSync('gtimg/hero-list', () => this.state.heroList)
  }

  private _handleUpdate() {
    this._updateHeroList()
  }

  private async _updateHeroList() {
    try {
      this._edsm.logger.info('Gtimg: 更新英雄列表')
      const heroList = await this._gtimg.getHeroList()
      this.state.setHeroList(heroList)
      this._timerTask.start(GtimgEds.HERO_LIST_UPDATE_INTERVAL)
      this._edsm.logger.info('Gtimg: 英雄列表更新成功')
    } catch (error) {
      this._timerTask.start(GtimgEds.HERO_LIST_UPDATE_INTERVAL_ON_ERROR)
      this._edsm.logger.warn(`Gtimg: 更新英雄列表失败: ${formatError(error)}`)
    }
  }
}
