import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

import { lcuConnectionRendererModule as lcm } from '../modules/lcu-connection'

export const request = axios.create({
  baseURL: 'akari://lcu',
  adapter: 'fetch'
})

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

export class GameClientHttpError extends Error {
  constructor(
    message: string,
    public response: SimpleAxiosResponse | null
  ) {
    super(message)
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
