import { FandomWikiChampBalanceDataSource } from '@shared/external-data-source/fandom/champ-balance'
import { ChampBalanceMapV1 } from '@shared/external-data-source/normalized/champ-balance'
import { NormalizedExternalChampBuildDataSourceMeta } from '@shared/external-data-source/normalized/champ-build'
import { OpggDataSource } from '@shared/external-data-source/opgg/champ-summary'
import { makeAutoObservable, observable, runInAction } from 'mobx'

class ExternalDataSourceSettings {}

class ChampBalanceDataSource {
  fandom = new FandomWikiChampBalanceDataSource()

  static UPDATE_INTERVAL = 60 * 60 * 1e3

  data: {
    map: ChampBalanceMapV1
    updateAt: Date
  } | null = null

  currentDataSource: {
    name: string
    id: string
  } | null = null

  async updateData() {
    if (
      this.data &&
      Date.now() - this.fandom.updateAt.getTime() < ChampBalanceDataSource.UPDATE_INTERVAL
    ) {
      return
    }

    const result = await this.fandom.update()
    if (result) {
      if (!this.fandom.validate(result)) {
        throw new Error('数据格式未通过验证，数据源格式可能发生变化')
      }

      runInAction(() => {
        this.data = { map: result, updateAt: this.fandom.updateAt }
        this.currentDataSource = { name: this.fandom.name, id: this.fandom.id }
      })
    }
  }

  constructor() {
    makeAutoObservable(this, {
      data: observable.ref
    })
  }
}

class ChampBuildDataSource {
  opgg = new OpggDataSource()

  currentDataSource: NormalizedExternalChampBuildDataSourceMeta | null = null

  constructor() {
    makeAutoObservable(this, {})
  }
}

class ExternalDataSourceState {
  settings = new ExternalDataSourceSettings()

  balance = new ChampBalanceDataSource()

  champBuild = new ChampBuildDataSource()

  constructor() {
    makeAutoObservable(this, {
      balance: observable.ref,
      champBuild: observable.ref
    })
  }
}

export const externalDataSourceState = new ExternalDataSourceState()
