import { GameflowPhase, GameflowSession } from '@shared/types/league-client/gameflow'
import { AxiosInstance } from 'axios'

export class GameflowHttpApi {
  constructor(private _http: AxiosInstance) {}

  getGameflowPhase() {
    return this._http.get<GameflowPhase>('/lol-gameflow/v1/gameflow-phase')
  }

  getGameflowSession() {
    return this._http.get<GameflowSession>('/lol-gameflow/v1/session')
  }

  earlyExit() {
    return this._http.post('/lol-gameflow/v1/early-exit')
  }

  dodge() {
    return this._http.post('/lol-gameflow/v1/session/dodge', {
      dodgeIds: [1145141919810],
      phase: 'ChampSelect'
    })
  }

  reconnect() {
    return this._http.post('/lol-gameflow/v1/reconnect')
  }

  ackFailedToLaunch() {
    return this._http.post('/lol-gameflow/v1/ack-failed-to-launch')
  }
}
