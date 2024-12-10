import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import cp from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import util from 'node:util'
import regedit from 'regedit'

import RES_POSITIONER from '../../../../resources/AKARI?asset&asarUnpack'
import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { ClientInstallationState } from './state'

const execAsync = util.promisify(cp.exec)

regedit.setExternalVBSLocation(path.resolve(RES_POSITIONER, '..', 'regedit-vbs'))

/**
 * 以各种方式搜索不同目标的安装位置, 这是必要的情报收集操作
 */
export class ClientInstallationMain implements IAkariShardInitDispose {
  static id = 'client-installation-main'
  static dependencies = ['akari-ipc-main', 'logger-factory-main', 'mobx-utils-main']

  static TENCENT_REG_INSTALL_PATH = 'HKCU\\Software\\Tencent\\LOL'
  static TENCENT_REG_INSTALL_VALUE = 'InstallPath'
  static TENCENT_INSTALL_DIRNAME = 'WeGameApps'
  static TENCENT_LOL_DIRNAME = '英雄联盟'
  static WEGAME_DEFAULTICON_PATH = 'HKCU\\wegame\\DefaultIcon' // 这个 key 代表了 WeGame 的图标, 间接代表了安装位置

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
    this._updateTencentPathsByReg()
    this._updateTencentPathsByFile()
    this._updateLeagueClientInstallationByFile()
  }

  private async _handleState() {
    this._mobx.propSync(ClientInstallationMain.id, 'state', this.state, [
      'leagueClientExecutablePaths',
      'tencentInstallationPath',
      'weGameExecutablePath',
      'officialRiotClientExecutablePath',
      'hasTcls',
      'hasWeGameLauncher'
    ])
  }

  /**
   * 通过注册表来找寻位置
   * @returns
   */
  private async _updateTencentPathsByReg() {
    try {
      const list: string[] = []

      if (!this.state.tencentInstallationPath) {
        list.push(ClientInstallationMain.TENCENT_REG_INSTALL_PATH)
      }

      if (!this.state.weGameExecutablePath) {
        list.push(ClientInstallationMain.WEGAME_DEFAULTICON_PATH)
      }

      const result = await regedit.promisified.list(list)

      const item1 = result[ClientInstallationMain.TENCENT_REG_INSTALL_PATH]
      const item2 = result[ClientInstallationMain.WEGAME_DEFAULTICON_PATH]

      if (item1 && item1.exists) {
        const p = item1.values[ClientInstallationMain.TENCENT_REG_INSTALL_VALUE]

        if (!p) {
          return
        }

        try {
          await fs.promises.access(p.value as string)
        } catch {
          this._log.info('注册表检测到腾讯服英雄联盟安装位置但无法访问, 可能并不存在', p.value)
          return
        }

        this._log.info('注册表检测到腾讯服英雄联盟安装位置', p.value)
        this.state.setTencentInstallationPath(p.value as string)

        try {
          const tclsPath = path.resolve(p.value as string, 'Launcher', 'Client.exe')
          await fs.promises.access(tclsPath)
          this.state.setHasTcls(true)
        } catch {
          this._log.info('TCLS 无法访问, 可能并不存在', p.value)
          return
        }

        try {
          const weGamePath = path.resolve(p.value as string, 'WeGameLauncher', 'launcher.exe')
          await fs.promises.access(weGamePath)
          this.state.setHasWeGameLauncher(true)
        } catch {
          this._log.info('WeGame 启动器无法访问, 可能并不存在', p.value)
          return
        }
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

          this._log.info('注册表检测到 WeGame 安装位置', match[1])
          this.state.setWeGameExecutablePath(match[1])
        }
      }
    } catch (error) {
      this._log.warn(`使用注册表信息读取安装目录时发生错误`, error)
    }
  }

  private async _getDrives() {
    try {
      const { stdout } = await execAsync('wmic logicaldisk get name')
      return stdout
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => /^[A-Z]:$/.test(line))
    } catch (error) {
      this._log.warn('尝试获取逻辑磁盘时出现错误', error)
      return []
    }
  }

  /**
   * 通过扫盘来更新腾讯服安装位置
   */
  private async _updateTencentPathsByFile() {
    if (this.state.tencentInstallationPath) {
      return
    }

    const drives = await this._getDrives()

    this._log.info('当前的逻辑磁盘', drives)

    for (const drive of drives) {
      const installation = path.join(
        drive,
        ClientInstallationMain.TENCENT_INSTALL_DIRNAME,
        ClientInstallationMain.TENCENT_LOL_DIRNAME
      )

      try {
        await fs.promises.access(installation)

        this._log.info('通过文件检测到腾讯服英雄联盟安装位置', installation)

        this.state.setTencentInstallationPath(installation)

        const tcls = path.resolve(installation, 'Launcher', 'Client.exe')
        const weGameLauncher = path.resolve(installation, 'WeGameLauncher', 'launcher.exe')

        try {
          await fs.promises.access(tcls)
          this.state.setHasTcls(true)
          this._log.info('通过文件检测到腾讯服 TCLS 安装位置', tcls)
        } catch {}

        try {
          await fs.promises.access(weGameLauncher)
          this.state.setHasWeGameLauncher(true)
          this._log.info('通过文件检测到腾讯服 WeGameLauncher 安装位置', weGameLauncher)
        } catch {}

        // 如果都找到了，则直接退出
        if (this.state.hasTcls && this.state.hasWeGameLauncher) {
          return
        }
      } catch (error) {
        continue
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
      await this._launchTencentTcls()
    })

    this._ipc.onCall(ClientInstallationMain.id, 'launchWeGame', async () => {
      await this._launchWeGame()
    })

    this._ipc.onCall(ClientInstallationMain.id, 'launchDefaultRiotClient', async () => {
      await this._launchDefaultRiotClient()
    })

    this._ipc.onCall(ClientInstallationMain.id, 'launchWeGameLeagueOfLegends', async () => {
      await this._launchWeGameLeagueOfLegends()
    })
  }

  // unused
  private _spawnDetached(location: string, args: string[] = []) {
    return new Promise<void>((resolve, reject) => {
      const p = cp.spawn(location, args, { detached: true, shell: true })

      p.on('error', (error) => {
        reject(error)
      })

      setImmediate(() => {
        p.unref()
        resolve()
      })
    })
  }

  private _launchTencentTcls() {
    if (!this.state.tencentInstallationPath) {
      return
    }

    const location = path.resolve(this.state.tencentInstallationPath, 'Launcher', 'Client.exe')
    return execAsync(`"${location}"`, { shell: 'cmd' })
  }

  private _launchWeGameLeagueOfLegends() {
    if (!this.state.tencentInstallationPath) {
      return
    }
    const location = path.resolve(
      this.state.tencentInstallationPath,
      'WeGameLauncher',
      'launcher.exe'
    )
    return execAsync(`"${location}"`, { shell: 'cmd' })
  }

  private _launchWeGame() {
    if (!this.state.weGameExecutablePath) {
      return
    }

    return execAsync(`"${this.state.weGameExecutablePath}"`, { shell: 'cmd' })
  }

  private _launchDefaultRiotClient() {
    if (!this.state.officialRiotClientExecutablePath) {
      return
    }

    return execAsync(
      `"${this.state.officialRiotClientExecutablePath}" --launch-product=league_of_legends --launch-patchline=live`,
      { shell: 'cmd' }
    )
  }
}
