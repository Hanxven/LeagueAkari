import { lcuConnectionModule } from '@main/modules/akari-core/lcu-connection'
import { AxiosRequestConfig, isAxiosError } from 'axios'

/*
 * request with retries
 */
export async function request<T = any, D = any>(config: AxiosRequestConfig<D>, maxRetries = 3) {
  const lcm = lcuConnectionModule

  if (!lcm.lcuHttp) {
    throw new Error('LCU disconnected')
  }

  let retries = 0
  let lastError: any = null

  while (true) {
    try {
      const res = await lcm.lcuHttp<T>(config)
      return res
    } catch (error) {
      lastError = error

      if (isAxiosError(error)) {
        if (
          error.code === 'ECONNABORTED' ||
          (error.response?.status && error.response.status >= 500)
        ) {
          retries++
        } else {
          throw error
        }
      } else {
        throw error
      }
    }

    if (retries >= maxRetries) {
      throw lastError || new Error('max retries exceeded')
    }
  }
}
