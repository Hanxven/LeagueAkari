import '@renderer-shared/assets/css/hide-not-app.less'
import { MaybeRefOrGetter, toValue, watchEffect } from 'vue'

export function useHideNotAppTag(hide: MaybeRefOrGetter<boolean>) {
  const body = document.querySelector('body')!
  watchEffect(() => {
    if (toValue(hide)) {
      body.classList.remove('kamikakushi')
    } else {
      body.classList.add('kamikakushi')
    }
  })
}
