import { logger } from '@main/modules/lcu-state-sync/common'
import { formatError } from '@shared/utils/errors'
import { AxiosRequestConfig, isAxiosError } from 'axios'

import { getHttpInstance } from '../core-modules/lcu-connection'

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
      logger.warn(`LCU max retires exceeded ${formatError(lastError)}`)
      throw lastError || new Error('max retries exceeded')
    }
  }
}
