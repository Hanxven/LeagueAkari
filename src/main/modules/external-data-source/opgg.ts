import { formatError } from '@shared/utils/errors'
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { ExternalDataSourceModule } from '.'

export class OpggEds {
  constructor(private _edsm: ExternalDataSourceModule) {}

  static FIXED_ITEM_SET_PREFIX = 'akari1'

  async setup() {
    this._edsm.onCall('opgg/write-item-sets-to-disk', (itemSets: any[], clearPrevious) => {
      return this.writeItemSetsToDisk(itemSets, clearPrevious)
    })
  }

  async writeItemSetsToDisk(itemSets: any[], clearPrevious = true) {
    try {
      const { data: installDir } = await this._edsm.lcm.lcuRequest({
        url: '/data-store/v1/install-dir',
        method: 'GET'
      })

      const path = join(installDir, '..', 'Game', 'Config', 'Global', 'Recommended')

      if (existsSync(path)) {
        if (!statSync(path).isDirectory()) {
          throw new Error(`The path ${path} is not a directory`)
        }
      } else {
        mkdirSync(path, { recursive: true })
      }

      // 清空之前的文件, 这些文件以 `akari1` 开头
      if (clearPrevious) {
        const files = readdirSync(path)
        const akariFiles = files.filter((file) => file.startsWith(OpggEds.FIXED_ITEM_SET_PREFIX))

        for (const file of akariFiles) {
          unlinkSync(join(path, file))
        }
      }

      for (const itemSet of itemSets) {
        const fileName = `${itemSet.uid}.json`
        const filePath = join(path, fileName)

        this._edsm.logger.info(`写入物品集到文件 ${filePath}`)

        writeFileSync(filePath, JSON.stringify(itemSet), { encoding: 'utf-8' })
      }
    } catch (error) {
      this._edsm.logger.error(`写入物品集到本地文件失败 ${formatError(error)}`)
      throw error
    }
  }
}
