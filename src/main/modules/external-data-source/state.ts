import {
  ChampBalanceDataSourceV1,
  ChampBalanceMapV1
} from '@shared/external-data-source/normalized/champ-balance'
import { makeAutoObservable, observable, runInAction } from 'mobx'

class ExternalDataSourceSettings {}

class ChampBalanceDataSource {
  dataSource: ChampBalanceDataSourceV1

  static UPDATE_INTERVAL = 60 * 60 * 1e3

  data: {
    name: string
    id: string
    map: ChampBalanceMapV1
    updateAt: Date
  } | null = null

  async updateData() {
    if (
      this.data &&
      Date.now() - this.dataSource.updateAt.getTime() < ChampBalanceDataSource.UPDATE_INTERVAL
    ) {
      return
    }

    const result = await this.dataSource.update()
    if (result) {
      if (!this.dataSource.validate(result)) {
        throw new Error('数据格式未通过验证，数据源格式可能发生变化')
      }

      runInAction(() => {
        this.data = {
          name: this.dataSource.name,
          map: result,
          id: this.dataSource.id,
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
