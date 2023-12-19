/**
 * 实验性 API，并未实装
 */
declare module '*/ltInputWin32x64.node' {
  interface LeagueToolkitInputAddon {
    /**
     * Win32 API SendInput 封装，发送一个按键的输入。可在游戏中模拟键盘输入。
     * @param key
     * @param pressed
     */
    sendKey(key: number, pressed: boolean): void

    /**
     * Win32 API SendInput 封装，发送一串 Unicode 字符串，可输入到游戏内聊天框中。
     * @param str
     */
    sendKeys(str: string): void

    /**
     * Win32 API SetWindowsHookEx 的封装，设置一个回调（仅一个回调，新设置会替换后设置的）
     * 监听所有正在按下的按键
     * @param callback
     */
    setOnKeysPressed(callback: (keys: number[]) => void): void

    /**
     * Win32 API SetWindowsHookEx 的封装，设置一个回调（仅一个回调，新设置会替换后设置的）
     * 监听按键的状态
     * @param callback
     */
    setOnKeyUpDown(callback: (key: { keyCode: number; isKeyDown: boolean }) => void): void

    /**
     * 开启按键监听
     */
    install(): number

    /**
     * 停止按键监听，执行清理工作
     */
    uninstall(): void
  }

  const ltInput: LeagueToolkitInputAddon
  export default ltInput
}

/**
 * 工具封装
 */
declare module '*/ltToolkitWin32x64.node' {
  interface LeagueToolkit1Addon {
    /**
     * 感谢 Bilibili @Butter_Cookies 提供的思路
     * https://space.bilibili.com/248303677
     * https://github.com/LeagueTavern/fix-lcu-window
     * 通过 Win32 API 设置窗口属性
     * @param clientZoom 参考缩放
     * @param config 具体设置
     */
    fixWindowMethodA(clientZoom: number, config?: { baseWidth: number; baseHeight: number }): void
  }

  const lt1: LeagueToolkit1Addon
  export default lt1
}
