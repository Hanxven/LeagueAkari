import { LcuEvent } from '@shared/types/league-client/event'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { RendererDebugState } from './state'

export class RendererDebugMain {
  static id = 'renderer-debug-main'
  static dependencies = [
    AkariIpcMain.id,
    LeagueClientMain.id,
    MobxUtilsMain.id,
    LoggerFactoryMain.id
  ]

  public readonly state = new RendererDebugState()

  private readonly _ipc: AkariIpcMain
  private readonly _lc: LeagueClientMain
  private readonly _mobx: MobxUtilsMain
  private readonly _loggerFactory: LoggerFactoryMain
  private readonly _log: AkariLogger

  constructor(deps: any) {
    this._ipc = deps[AkariIpcMain.id]
    this._lc = deps[LeagueClientMain.id]
    this._mobx = deps[MobxUtilsMain.id]
    this._loggerFactory = deps[LoggerFactoryMain.id]
    this._log = this._loggerFactory.create(RendererDebugMain.id)
  }

  async onInit() {
    this._mobx.propSync(RendererDebugMain.id, 'state', this.state, [
      'sendAllNativeLcuEvents',
      'logAllLcuEvents'
    ])

    this._lc.events.on('/**', (data: LcuEvent) => {
      if (this.state.sendAllNativeLcuEvents) {
        this._ipc.sendEvent(RendererDebugMain.id, 'lc-event', data)
      }

      if (this.state.logAllLcuEvents) {
        this._log.info(data.uri, data.eventType, data)
      }
    })

    this._mobx.reaction(
      () => this.state.logAllLcuEvents,
      (enabled) => {
        if (enabled) {
          this._log.info('Logging all LCU events')
        } else {
          this._log.info('Stopped logging all LCU events')
        }
      }
    )

    this._handleIpcCall()
  }

  private _handleIpcCall() {
    this._ipc.onCall(RendererDebugMain.id, 'setSendAllNativeLcuEvents', (_, enabled: boolean) => {
      this.state.setSendAllNativeLcuEvents(enabled)
    })

    this._ipc.onCall(RendererDebugMain.id, 'setLogAllLcuEvents', (_, enabled: boolean) => {
      this.state.setLogAllLcuEvents(enabled)
    })
  }
}
