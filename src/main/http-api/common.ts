import { AxiosRequestConfig, isAxiosError } from 'axios'

import { getHttpInstance } from '../core/lcu-connection'

/*
 * request with retries
 */
export async function request<T = any, D = any>(config: AxiosRequestConfig<D>, maxRetries = 3) {
  const axiosInstance = getHttpInstance()
  if (!axiosInstance) {
    throw new Error('LCU disconnected')
  }

  let retries = 0
  let lastError: any = null

  while (true) {
    try {
      const res = await axiosInstance<T>(config)
      return res
    } catch (error) {
      lastError = error

      if (isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || (error.status && error.status >= 500)) {
          retries++
        } else {
          throw error
        }
      } else {
        throw error
      }
    }

    if (retries >= maxRetries) {
      console.warn('LCU max retires exceeded', retries)
      throw lastError || new Error('max retries exceeded')
    }
  }
}
