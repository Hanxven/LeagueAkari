import { getCurrentInstance } from 'vue'

export function greeting(version: string) {
  const instance = getCurrentInstance()
  const logger =
    instance?.appContext.config.globalProperties.$akariManager.getInstance('logger-renderer')

  if (logger) {
    logger.infoRenderer('greeting', `League Akari v${version}`)
  } else {
    console.log(
      `%cLeague Akari v${version}`,
      'border-radius: 4px; background: #f9ceeb; color: #ff59cb; font-size: 16px; font-weight: bold; padding: 4px;'
    )
  }
}
