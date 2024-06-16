import { StatsSendExportedClass } from '@shared/external-data-source/normalized/stats-send'
import { formatError } from '@shared/utils/errors'
import { app } from 'electron'
import { join } from 'node:path'
import { NodeVM } from 'vm2'

import { lcuConnectionModule as lcm } from './lcu-connection-new'

const modulePath = join(app.getPath('exe'), '..', 'scripts')

const leagueAkariApi = {
  getLcuAxiosInstance: () => lcm.lcuHttp
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
  } catch (error) {}
}

export function runCustomSendStatsScript(code: string, settings: Record<string, any>) {
  const clazz: { new (): StatsSendExportedClass } = runCodeInAkariContext(code)

  if (typeof clazz !== 'function') {
    throw new Error('not a function')
  }

  const i = new clazz()

  if (
    typeof i.id !== 'string' ||
    typeof i.name !== 'string' ||
    typeof i.version !== 'string' ||
    typeof i.getStatLines !== 'function' ||
    !i.id ||
    !i.name ||
    !i.version
  ) {
    throw new Error('invalid type structure, it must implement `StatSendExportedClass`')
  }

  // const stats = i.getStatLines(info?, settings)
}
