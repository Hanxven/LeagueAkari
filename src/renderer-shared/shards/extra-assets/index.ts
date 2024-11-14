import { IAkariShardInitDispose } from '@shared/akari-shard/interface'

import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { useExtraAssetsStore } from './store'

const MAIN_SHARD_NAMESPACE = 'extra-assets-main'

export class ExtraAssetsRenderer implements IAkariShardInitDispose {
  static id = 'extra-assets-renderer'
  static dependencies = ['pinia-mobx-utils-renderer']

  private readonly _pm: PiniaMobxUtilsRenderer

  constructor(deps: any) {
    this._pm = deps['pinia-mobx-utils-renderer']
  }

  async onInit() {
    const store = useExtraAssetsStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'gtimg', store.gtimg)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'fandom', store.fandom)
  }
}
