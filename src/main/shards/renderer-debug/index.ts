import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { MobxUtilsMain } from '../mobx-utils'
import { RendererDebugState } from './state'

export class RendererDebugMain {
  static id = 'renderer-debug-main'
  static dependencies = ['akari-ipc-main', 'league-client-main', 'mobx-utils-main']

  public readonly state = new RendererDebugState()

  private readonly _ipc: AkariIpcMain
  private readonly _lc: LeagueClientMain
  private readonly _mobx: MobxUtilsMain

  constructor(deps: any) {
    this._ipc = deps['akari-ipc-main']
    this._lc = deps['league-client-main']
    this._mobx = deps['mobx-utils-main']
  }

  async onInit() {
    this._mobx.propSync(RendererDebugMain.id, 'state', this.state, ['sendAllNativeLcuEvents'])

    this._lc.events.on('/**', (data) => {
      if (this.state.sendAllNativeLcuEvents) {
        this._ipc.sendEvent(RendererDebugMain.id, 'lc-event', data)
      }
    })

    this._handleIpcCall()
  }

  private _handleIpcCall() {
    this._ipc.onCall(RendererDebugMain.id, 'setSendAllNativeLcuEvents', (enabled: boolean) => {
      this.state.setSendAllNativeLcuEvents(enabled)
    })
  }
}
