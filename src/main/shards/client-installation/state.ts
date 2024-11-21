import { makeAutoObservable, observable } from 'mobx'

export class ClientInstallationState {
  /**
   * 检测到的已经安装的 LeagueClient
   */
  leagueClientExecutablePaths: string[] = []

  /**
   * 检测 Tencent 的安装情况
   */
  tencentInstallationPath: string | null = null

  hasTcls: boolean = false
  hasWeGameLauncher: boolean = false

  /**
   * 额外检测 WeGame 的安装情况
   */
  weGameExecutablePath: string | null = null

  /**
   * 获取默认的 RiotClient 的路径
   */
  officialRiotClientExecutablePath: string | null = null

  setLeagueClientExecutablePaths(clients: string[]) {
    this.leagueClientExecutablePaths = clients
  }

  setTencentInstallationPath(path: string) {
    this.tencentInstallationPath = path
  }

  setWeGameExecutablePath(path: string) {
    this.weGameExecutablePath = path
  }

  setOfficialRiotClientExecutablePath(path: string) {
    this.officialRiotClientExecutablePath = path
  }

  setHasTcls(has: boolean) {
    this.hasTcls = has
  }

  setHasWeGameLauncher(has: boolean) {
    this.hasWeGameLauncher = has
  }

  constructor() {
    makeAutoObservable(this, {
      leagueClientExecutablePaths: observable.struct
    })
  }
}
