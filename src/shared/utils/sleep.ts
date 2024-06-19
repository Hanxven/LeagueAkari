export function sleep(time: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, time))
}

export function cancellableSleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      const error = new Error('Canceled')
      error.name = 'AbortError'
      reject(error)
    }

    const timeoutId = setTimeout(() => {
      resolve()
    }, ms)

    signal.addEventListener('abort', () => {
      clearTimeout(timeoutId)
      const error = new Error('Canceled')
      error.name = 'AbortError'
      reject(error)
    })
  })
}
