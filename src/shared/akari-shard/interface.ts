/**
 * AkariShard 模块初始化和清理接口, 实现此接口的模块将在初始化和清理时被调用
 */
export interface IAkariShardInitDispose {
  /**
   * 在模块初始化时被调用
   */
  onInit?(): Promise<void>

  /**
   * 在模块清理时被调用
   */
  onDispose?(): Promise<void>

  /**
   * 在所有模块初始化完成后被调用
   */
  onFinish?(): Promise<void>
}

export interface AkariSharedGlobal {}
