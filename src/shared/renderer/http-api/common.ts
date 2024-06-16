import type { AxiosRequestConfig, AxiosResponse } from 'axios'

import { lcuConnectionRendererModule as lcm } from '../modules/lcu-connection-new'

// 由于序列化和反序列化的要求，只能传递部分属性
export type SimpleAxiosResponse<T = any, D = any> = Omit<
  AxiosResponse<T, D>,
  'config' | 'request'
> & {
  config: Pick<AxiosResponse<T, D>['config'], 'url' | 'data'>
}

export type SimpleAxiosRequestConfig<D = any> = Pick<
  AxiosRequestConfig<D>,
  'url' | 'baseURL' | 'method' | 'data' | 'params' | 'timeout' | 'headers' | 'auth' | 'responseType'
>

export class LcuHttpError extends Error {
  constructor(
    message: string,
    public response: SimpleAxiosResponse | null
  ) {
    super(message)
  }
}

export class GameClientHttpError extends Error {
  constructor(
    message: string,
    public response: SimpleAxiosResponse | null
  ) {
    super(message)
  }
}

export async function request<T = any, D = any>(
  config: SimpleAxiosRequestConfig,
  maxRetries = 3
): Promise<SimpleAxiosResponse<T, D>> {
  let retries = 0
  let lastError: any = null

  while (true) {
    try {
      const res = await lcm.lcuRequest(config)

      if (res.status >= 500) {
        lastError = new LcuHttpError(res.statusText, res)
        retries++
      } else {
        // 4xx错误，直接抛出
        if (res.status >= 400) {
          throw new LcuHttpError(res.statusText, res)
        }

        return res
      }
    } catch (error) {
      lastError = error

      // ECONNABORTED，一般是超时，直接无限重试
      if ((error as any).code === 'ECONNABORTED') {
        retries++
      } else {
        // 其他所有连接异常，直接抛出
        throw error
      }
    }

    if (retries >= maxRetries) {
      console.warn('[LcuHttpRequest] max retires exceeded', retries)
      throw lastError || new LcuHttpError('max retries exceeded, an unknown error occurred', null)
    }
  }
}

export async function gameClientRequest<T = any, D = any>(
  config: SimpleAxiosRequestConfig
): Promise<SimpleAxiosResponse<T, D>> {
  const res = await lcm.gameClientRequest(config)

  if (res.status >= 400) {
    throw new GameClientHttpError(res.statusText, res)
  }

  return res
}
