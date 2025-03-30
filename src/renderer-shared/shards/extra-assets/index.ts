import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { useExtraAssetsStore } from './store'

const MAIN_SHARD_NAMESPACE = 'extra-assets-main'

@Shard(ExtraAssetsRenderer.id)
export class ExtraAssetsRenderer implements IAkariShardInitDispose {
  static id = 'extra-assets-renderer'

  constructor(@Dep(PiniaMobxUtilsRenderer) private readonly _pm: PiniaMobxUtilsRenderer) {}

  async onInit() {
    const store = useExtraAssetsStore()

    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'gtimg', store.gtimg)
    await this._pm.sync(MAIN_SHARD_NAMESPACE, 'fandom', store.fandom)
  }
}
