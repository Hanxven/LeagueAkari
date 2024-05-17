import { AkariApi } from './akari-vm'

/**
 * 必须实现的功能
 */
export interface StatsSend {
  name: string

  version: string

  id: string

  getStatLines(vm: AkariApi, playerStats: any[]): string[]
}
