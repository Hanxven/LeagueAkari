import { SgpState } from './state'

/**
 * SGP API
 */
export class SgpMain {
  static id = 'sgp-main'

  public readonly state = new SgpState()

  constructor() {}
}
