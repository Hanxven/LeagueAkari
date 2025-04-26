import { randomInt } from '@shared/utils/random'
import net from 'node:net'

export function checkIfPortInUse(host: string, port: number, timeout = 500): Promise<boolean> {
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

    socket.on('rejected', (err: any) => {
      if (err.code === 'ECONNREFUSED') {
        resolve(false)
      } else {
        resolve(true)
      }
    })

    socket.connect(port, host)
  })
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

    const a = randomInt(0, 255, true)
    const b = randomInt(0, 255, true)
    const c = randomInt(2, 255, true)
    const host = `127.${a}.${b}.${c}`

    if (await checkIfPortInUse(host, port)) {
      tryCount++
    } else {
      return host
    }
  }
}
