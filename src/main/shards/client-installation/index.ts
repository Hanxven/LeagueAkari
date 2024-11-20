import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import cp from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import regedit from 'regedit'

import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { ClientInstallationState } from './state'

/**
 * 以各种方式搜索不同目标的安装位置, 这是必要的情报收集操作
 */
export class ClientInstallationMain implements IAkariShardInitDispose {
  static id = 'client-installation-main'
  static dependencies = ['akari-ipc-main', 'logger-factory-main', 'mobx-utils-main']

  static TENCENT_INSTALL_PATH = 'HKCU\\Software\\Tencent\\LOL'
  static TENCENT_INSTALL_VALUE = 'InstallPath'

  // 感觉更加靠谱的 key
  static WEGAME_OPENCMD_PATH = 'HKCU\\wegame\\shell\\open\\command'

  public readonly state = new ClientInstallationState()

  private readonly _ipc: AkariIpcMain
  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _log: AkariLogger
  private readonly _mobx: MobxUtilsMain

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-main']
    this._loggerFactory = deps['logger-factory-main']
    this._log = this._loggerFactory.create(ClientInstallationMain.id)
    this._mobx = deps['mobx-utils-main']
  }

  async onInit() {
    this._handleState()
    this._handleIpcCall()
    this._updateTencentPaths()
    this._updateLeagueClientInstallationByFile()
  }

  private async _handleState() {
    this._mobx.propSync(ClientInstallationMain.id, 'state', this.state, [
      'leagueClientExecutablePaths',
      'tencentInstallationPath',
      'weGameExecutablePath',
      'officialRiotClientExecutablePath'
    ])
  }

  private async _updateTencentPaths() {
    const result = await regedit.promisified.list([
      ClientInstallationMain.TENCENT_INSTALL_PATH,
      ClientInstallationMain.WEGAME_OPENCMD_PATH
    ])

    const item1 = result[ClientInstallationMain.TENCENT_INSTALL_PATH]
    const item2 = result[ClientInstallationMain.WEGAME_OPENCMD_PATH]

    if (item1 && item1.exists) {
      const p = item1.values[ClientInstallationMain.TENCENT_INSTALL_VALUE]

      if (!p) {
        return
      }

      try {
        await fs.promises.access(p.value as string)
      } catch {
        this._log.info('检测到 TCLS 客户端但无法访问, 可能并不存在', p.value)
        return
      }

      this._log.info('检测到 TCLS 客户端安装位置', p.value)
      this.state.setTencentInstallationPath(p.value as string)
    }

    if (item2 && item2.exists) {
      const p = item2.values[''].value as string
      const match = p.match(/"([^"]+)"/)

      if (match) {
        try {
          await fs.promises.access(match[1])
        } catch {
          this._log.info('检测到 WeGame 但无法访问, 可能并不存在', match[1])
          return
        }

        this._log.info('检测到 WeGame 安装位置', match[1])
        this.state.setWeGameExecutablePath(match[1])
      }
    }
  }

  private async _maybeOfficialRiotClient(p: string) {
    return p.includes('Riot Games') && !p.includes('英雄联盟')
  }

  private async _updateLeagueClientInstallationByFile() {
    if (!process.env['ProgramData']) {
      this._log.warn('无法获取 ProgramData 环境变量, 无法检测 LeagueClient 安装情况')
      return
    }

    const installationJson = path.join(
      process.env['ProgramData'],
      'Riot Games',
      'RiotClientInstalls.json'
    )

    try {
      const stats = await fs.promises.stat(installationJson)

      if (!stats.isFile()) {
        return
      }

      const content = await fs.promises.readFile(installationJson, { encoding: 'utf-8' })
      const json = JSON.parse(content)

      if (typeof json !== 'object') {
        return
      }

      if (typeof json.associated_client === 'object') {
        const installations = Object.keys(json.associated_client as Record<string, string>)

        const result: string[] = []
        for (const installation of installations) {
          try {
            const ins = path.resolve(installation, 'LeagueClient.exe')
            await fs.promises.access(ins)
            result.push(ins)
          } catch (error) {
            this._log.info('检测到 LeagueClient 安装位置但无法访问, 可能并不存在', installation)
          }
        }

        this.state.setLeagueClientExecutablePaths(result)

        const riotInstallations = Object.values(json.associated_client as Record<string, string>)

        for (const p of riotInstallations) {
          if (await this._maybeOfficialRiotClient(p)) {
            this.state.setOfficialRiotClientExecutablePath(p)
            this._log.info('检测到直营服 RiotClient 安装位置', p)
            break
          }
        }
      }
    } catch (error) {
      this._log.warn('尝试读取时出现错误', error)
    }
  }

  private _handleIpcCall() {
    this._ipc.onCall(ClientInstallationMain.id, 'launchTencentTcls', async () => {
      this._launchTencentTcls()
    })

    this._ipc.onCall(ClientInstallationMain.id, 'launchWeGame', async () => {
      this._launchWeGame()
    })

    this._ipc.onCall(ClientInstallationMain.id, 'launchDefaultRiotClient', async () => {
      this._launchDefaultRiotClient()
    })
  }

  private _spawnDetached(location: string) {
    const p = cp.spawn(location, { detached: true })
    p.unref()
  }

  private _launchTencentTcls() {
    if (!this.state.tencentInstallationPath) {
      return
    }
    const location = path.resolve(this.state.tencentInstallationPath, 'TCLS', 'client.exe')
    this._spawnDetached(location)
  }

  private _launchWeGame() {
    if (!this.state.weGameExecutablePath) {
      return
    }

    this._spawnDetached(this.state.weGameExecutablePath)
  }

  private _launchDefaultRiotClient() {
    if (!this.state.officialRiotClientExecutablePath) {
      return
    }

    this._spawnDetached(this.state.officialRiotClientExecutablePath)
  }
}
