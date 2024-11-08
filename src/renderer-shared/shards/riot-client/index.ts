import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { RiotClientHttpApiAxiosHelper } from '@shared/http-api-axios-helper/riot-client'
import axios from 'axios'

import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'

export class RiotClientRenderer implements IAkariShardInitDispose {
  static id = 'riot-client-renderer'
  static dependencies = ['pinia-mobx-utils-renderer']

  private readonly _pm: PiniaMobxUtilsRenderer

  public readonly api = new RiotClientHttpApiAxiosHelper(
    axios.create({
      baseURL: 'akari://riot-client',
      adapter: 'fetch'
    })
  )

  async onInit() {
    // this._pm.sync('league-client-main')
  }

  constructor(deps: any) {
    this._pm = deps['pinia-mobx-utils-renderer']
  }
}
