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

  /**
   * 额外检测 WeGame 的安装情况
   */
  weGameExecutablePath: string | null = null

  /**
   * 获取默认的 RiotClient 的路径
   */
  defaultRiotClientExecutablePath: string | null = null

  setLeagueClientExecutablePaths(clients: string[]) {
    this.leagueClientExecutablePaths = clients
  }

  setTencentInstallationPath(path: string) {
    this.tencentInstallationPath = path
  }

  setWeGameExecutablePath(path: string) {
    this.weGameExecutablePath = path
  }

  setDefaultRiotClientExecutablePath(path: string) {
    this.defaultRiotClientExecutablePath = path
  }

  constructor() {
    makeAutoObservable(this, {
      leagueClientExecutablePaths: observable.struct
    })
  }
}