import { AxiosError } from 'axios'

export function formatError(e: any) {
  if (e instanceof AxiosError) {
    return `${e.message} ${e.config?.url} ${e.config?.method} ${JSON.stringify(e.response?.data)} ${e.code}  ${e.stack}`
  }

  if (e instanceof Error) {
    return `${e.message} ${e.stack}`
  }

  return e
}
