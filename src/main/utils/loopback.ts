import net from 'node:net'

export function checkPortInUse(host: string, port: number, timeout = 500): Promise<boolean> {
  return new Promise((resolve, _reject) => {
    const socket = new net.Socket()

    socket.setTimeout(timeout)

    socket.on('connect', () => {
      socket.destroy()
      resolve(true)
    })

    socket.on('timeout', () => {
      socket.destroy()
      resolve(false)
    })

    socket.on('error', (err: any) => {
      if (err.code === 'ECONNREFUSED') {
        resolve(false)
      } else {
        resolve(true)
      }
    })

    socket.connect(port, host)
  })
}

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const MAX_TRIES = 10

/**
 * 返回一个可用的本地回环 IP 地址。
 * 注意，只能保证当时可用。
 */
export async function getRandomAvailableLoopbackAddrWithPort(port: number) {
  let tryCount = 0
  while (true) {
    if (tryCount > MAX_TRIES) {
      throw new Error('max tries exceeded')
    }

    const a = randomInt(0, 255)
    const b = randomInt(0, 255)
    const c = randomInt(2, 255)
    const host = `127.${a}.${b}.${c}`

    if (await checkPortInUse(host, port)) {
      tryCount++
    } else {
      return host
    }
  }
}
