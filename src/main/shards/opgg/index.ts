import { OpggState } from './state'

/**
 * 适用于 OPGG 的主进程模块
 */
export class OpggMain {
  static id = 'opgg-main'

  public state = new OpggState()

  constructor() {}
}
