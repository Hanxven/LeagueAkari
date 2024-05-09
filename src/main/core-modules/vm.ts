import { logger } from '@main/modules/lcu-state-sync/common'
import { formatError } from '@shared/utils/errors'
import { app } from 'electron'
import { join } from 'node:path'
import { NodeVM } from 'vm2'

import { getHttpInstance } from './lcu-connection'

const modulePath = join(app.getPath('exe'), '..', 'scripts')

const leagueAkariApi = {
  getLcuAxiosInstance: getHttpInstance
}

const akariVm = new NodeVM({
  allowAsync: true,
  console: 'inherit',
  require: {
    external: true,
    builtin: ['*'],
    root: modulePath,
    mock: {}
  },
  sandbox: {
    akari: leagueAkariApi
  }
})

export function runCodeInAkariContext(code: string) {
  try {
    return akariVm.run(code)
  } catch (error) {
    logger.warn(`VM 环境出现错误 ${formatError(error)}`)
  }
}
