import { AxiosError } from 'axios'

export function formatError(e: any) {
  if (e instanceof AxiosError) {
    return `${e.message} ${e.config?.url} ${e.config?.method} ${JSON.stringify(e.config?.data)} ${JSON.stringify(e.response?.data)} ${e.code} ${e.stack}`
  }

  if (e instanceof Error) {
    return `${e.message} ${e.stack}`
  }

  if (typeof e === 'object' && e !== null) {
    return `${e.message} ${e.stack}`
  }

  return e
}

export function formatErrorMessage(e: any) {
  if (e instanceof Error) {
    return e.message
  }

  return 'Error'
}
