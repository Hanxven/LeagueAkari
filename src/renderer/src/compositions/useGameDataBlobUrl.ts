import { MaybeRefOrGetter, toRef } from '@vueuse/core'
import PQueue from 'p-queue'
import { getCurrentScope, onScopeDispose, readonly, ref, watch } from 'vue'

import { request } from '@renderer/http-api/common'

// 过快的访问频率概率导致 50x 错误，需要限制
const globalAssetFetchingLimiter = new PQueue({
  concurrency: 10
})

const assetsCacheMap = new Map<string, string>()

const retryCount = 5

/**
 * 参照：https://www.communitydragon.org/documentation/assets
 * 静态资源请求
 * @param srcURL 资源路径
 * @param immediate 是否立即加载
 * @param cache 是否缓存
 */
export function useGameDataBlobUrl(
  srcURL: MaybeRefOrGetter<string | undefined>,
  immediate = true,
  cache = false
) {
  const url = ref<string>()
  const type = ref<string>()
  const unwrappedUrl = toRef(srcURL)
  let objectURL: string

  const load = () =>
    globalAssetFetchingLimiter.add(async () => {
      if (!unwrappedUrl.value) {
        return
      }
      if (assetsCacheMap.has(unwrappedUrl.value)) {
        url.value = assetsCacheMap.get(unwrappedUrl.value)
        return
      }
      try {
        const resp = await request(
          {
            url: unwrappedUrl.value,
            method: 'GET',
            responseType: 'arraybuffer'
          },
          retryCount
        )
        objectURL = URL.createObjectURL(
          new Blob([resp.data], { type: resp.headers['content-type'] })
        )
        type.value = resp.headers['content-type']
        if (cache) {
          assetsCacheMap.set(unwrappedUrl.value!, objectURL)
        }
        url.value = objectURL
      } catch (err) {
        console.error(err)
        url.value = undefined
      }
    })

  watch(
    unwrappedUrl,
    () => {
      if (unwrappedUrl.value) {
        load()
      } else {
        url.value = undefined
      }
    },
    { immediate }
  )

  const revoke = () => {
    if (!cache && objectURL) {
      URL.revokeObjectURL(objectURL)
    }
  }

  if (getCurrentScope()) {
    onScopeDispose(() => {
      revoke()
    })
  }

  return { url: readonly(url), type: readonly(type), load, revoke }
}
