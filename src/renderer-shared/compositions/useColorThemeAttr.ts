import { MaybeRefOrGetter, toRef, watchEffect } from 'vue'

export function useColorThemeAttr(colorTheme: MaybeRefOrGetter<'dark' | 'light'>) {
  const colorThemeV = toRef(colorTheme)

  watchEffect(() => {
    document.documentElement.setAttribute('data-theme', colorThemeV.value)
    document.documentElement.style.setProperty('color-scheme', colorThemeV.value)
  })
}
