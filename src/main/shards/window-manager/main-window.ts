import { BrowserWindow } from 'electron'

import { type WindowManagerMain } from '.'
import { SetterSettingService } from '../setting-factory/setter-setting-service'

/**
 * Experimental
 */
export class MainWindowPart {
  private _forceClose = false

  private readonly _setting: SetterSettingService

  constructor(
    private _cls: typeof WindowManagerMain,
    private _inst: WindowManagerMain,
    private _deps: any
  ) {
    this._setting = _deps['setting-factory-main'].create(
      _cls.id,
      {
        mainWindowCloseAction: { default: this._inst.settings.mainWindowCloseAction }
      },
      this._inst.settings
    )
  }

  private _window: BrowserWindow | null = null

  get window() {
    return this._window
  }

  async init() {
    await this._setting.applyToState()

    // this._mobx.propSync(this._cls.id, 'state', this._inst.state, [
    //   'mainWindowFocus',
    //   'mainWindowShow',
    //   'mainWindowStatus',
    //   'auxWindowFocus',
    //   'auxWindowReady',
    //   'auxWindowFunctionality',
    //   'auxWindowStatus',
    //   'supportsMica'
    // ])

    // this._mobx.propSync(this._cls.id, 'settings', this._inst.settings, [
    //   'mainWindowCloseAction',
    //   'auxWindowEnabled',
    //   'auxWindowAutoShow',
    //   'auxWindowOpacity',
    //   'auxWindowPinned',
    //   'auxWindowShowSkinSelector',
    //   'backgroundMaterial'
    // ])
  }
}
