import {
  ChampBalanceDataSourceV1,
  ChampBalanceMapV1
} from '@shared/external-data-source/normalized/champ-balance'
import { makeAutoObservable, observable, runInAction } from 'mobx'

class ExternalDataSourceSettings {}

class ChampBalanceDataSource {
  dataSource: ChampBalanceDataSourceV1
  
  data: {
    map: ChampBalanceMapV1
    updateAt: Date
  } | null = null

  async updateData() {
    const result = await this.dataSource.update()
    if (result) {
      runInAction(() => {
        this.data = {
          map: this.dataSource.get()!,
          updateAt: this.dataSource.updateAt
        }
      })
    }
  }

  constructor() {
    makeAutoObservable(this, {
      dataSource: observable.ref,
      data: observable.ref
    })
  }
}

class ExternalDataSourceState {
  settings = new ExternalDataSourceSettings()

  balance = new ChampBalanceDataSource()

  constructor() {
    makeAutoObservable(this, {})
  }
}

export const externalDataSourceState = new ExternalDataSourceState()
