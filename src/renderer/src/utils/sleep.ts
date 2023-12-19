export function sleep(time: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, time))
}
