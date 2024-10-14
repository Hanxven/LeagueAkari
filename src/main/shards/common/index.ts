import toolkit from '../../native/laToolkitWin32x64.node'
import { CommonState } from './state'

/**
 * 一些不知道如何分类的功能, 可以放到这里
 */
export class CommonMain {
  static id = 'common-main'

  public state = new CommonState()

  constructor() {
    this.state.setAdministrator(toolkit.isElevated())
  }
}
