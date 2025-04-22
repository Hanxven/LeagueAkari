import { makeAutoObservable, observable } from 'mobx'

export class ClientInstallationState {
  /**
   * 检测到的已经安装的 LeagueClient
   */
  leagueClientExecutablePaths: string[] = []

  /**
   * 检测英雄联盟的安装位置, 腾讯服务器
   */
  tencentInstallationPath: string | null = null

  /**
   * 如果有英雄联盟的安装位置, 同时检测两者是否存在
   */
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

  detectedLiveStreamingClients: string[] = []

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

  setDetectedLiveStreamingClients(clients: string[]) {
    this.detectedLiveStreamingClients = clients
  }

  constructor() {
    makeAutoObservable(this, {
      leagueClientExecutablePaths: observable.struct,
      detectedLiveStreamingClients: observable.struct
    })
  }
}
