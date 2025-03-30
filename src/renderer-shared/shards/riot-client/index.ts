import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { RiotClientHttpApiAxiosHelper } from '@shared/http-api-axios-helper/riot-client'
import axios from 'axios'

import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'

@Shard(RiotClientRenderer.id)
export class RiotClientRenderer implements IAkariShardInitDispose {
  static id = 'riot-client-renderer'

  public readonly api = new RiotClientHttpApiAxiosHelper(
    axios.create({
      baseURL: 'akari://riot-client',
      adapter: 'fetch'
    })
  )

  async onInit() {
    // await this._pm.sync('league-client-main')
  }

  constructor(@Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer) {}
}
