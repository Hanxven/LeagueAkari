declare module '@main/native/la-input-win64.node' {
  interface LeagueAkariInputAddon {
    /**
     * 模拟按键输入
     * @param code 按键码
     * @param press 是否按下
     */
    sendKey(code: number, press: boolean): void

    /**
     * 发送 Unicode 字符串
     * @param str 字符串
     */
    sendKeys(str: string): void

    /**
     * 设置 **一个** 监听器，新设置会替换之前的
     * 将会收到类似于 `132,DOWN` 或 `132,UP` 的类似的字符串
     * @param cb 回调
     */
    onKeyEvent(cb: (raw: string) => void): void

    /**
     * 开始和停止监听
     */
    startHook(): void

    /**
     * 停止监听
     */
    stopHook(): void
  }

  const inputAddon: LeagueAkariInputAddon
  export default inputAddon
}

declare module '@main/native/la-tools-win64.node' {
  interface LeagueAkariToolsAddon {
    /**
     * 感谢 Bilibili @Butter_Cookies 提供的思路
     * https://space.bilibili.com/248303677
     * https://github.com/LeagueTavern/fix-lcu-window
     * 通过 Win32 API 设置窗口属性
     * @param clientZoom 参考缩放
     * @param config 具体设置
     */
    fixWindowMethodA(clientZoom: number, config?: { baseWidth: number; baseHeight: number }): void

    /**
     * 检测是否在提升后的权限中运行
     */
    isElevated(): boolean

    /**
     * 获取英雄联盟客户端窗口位置
     */
    GetLeagueClientWindowPlacementInfo(): {
      left: number
      top: number
      right: number
      bottom: number
      shownState: numbre
    } | null

    /**
     * 获取进程 PID
     */
    getCommandLine1(pid: number): string

    /**
     * 获取进程名的 PID
     * @param name 进程名
     */
    getPidsByName(name: string): number[]

    /**
     * 结束进程
     * @param pid 进程 PID
     */
    terminateProcess(pid: number): boolean

    /**
     * 判断进程是否在前台
     * @param pid 进程 PID
     */
    isProcessForeground(pid: number): boolean
  }

  const toolsAddon: LeagueAkariToolsAddon
  export default toolsAddon
}

/**
 * 工具封装
 */
declare module '*/laToolkitWin32x64.node' {
  interface LeagueAkari1Addon {
    /**
     * 感谢 Bilibili @Butter_Cookies 提供的思路
     * https://space.bilibili.com/248303677
     * https://github.com/LeagueTavern/fix-lcu-window
     * 通过 Win32 API 设置窗口属性
     * @param clientZoom 参考缩放
     * @param config 具体设置
     */
    fixWindowMethodA(clientZoom: number, config?: { baseWidth: number; baseHeight: number }): void

    /**
     * 检测是否在提升后的权限中运行
     */
    isElevated(): boolean

    /**
     * 获取英雄联盟客户端窗口位置
     */
    GetLeagueClientWindowPlacementInfo(): {
      left: number
      top: number
      right: number
      bottom: number
      shownState: numbre
    } | null

    /**
     * 获取进程 PID
     */
    getCommandLine1(pid: number): string

    /**
     * 获取进程名的 PID
     * @param name 进程名
     */
    getPidsByName(name: string): number[]

    /**
     * 结束进程
     * @param pid 进程 PID
     */
    terminateProcess(pid: number): boolean

    /**
     * 判断进程是否在前台
     * @param pid 进程 PID
     */
    isProcessForeground(pid: number): boolean
  }

  const lt1: LeagueAkari1Addon
  export default lt1
}
