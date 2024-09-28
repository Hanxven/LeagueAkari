export interface IAkariModuleInitDispose {
  /**
   * 在模块初始化时被调用
   */
  onInit?(): Promise<void>

  /**
   * 在模块清理时被调用
   */
  onDispose?(): Promise<void>
}
