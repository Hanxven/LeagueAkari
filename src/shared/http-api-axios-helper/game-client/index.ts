import { GameStats, PlayerList } from '@shared/types/game-client'
import { AxiosInstance } from 'axios'

// https://static.developer.riotgames.com/docs/lol/liveclientdata_sample.json
export class GameClientHttpApiAxiosHelper {
  constructor(private _http: AxiosInstance) {}

  getLiveClientDataPlayerList() {
    return this._http.get<PlayerList[]>('/liveclientdata/playerlist')
  }

  getActivePlayer() {
    return this._http.get('/liveclientdata/activeplayer')
  }

  getAllGameData() {
    return this._http.get('/liveclientdata/allgamedata')
  }

  getActivePlayerAbilities() {
    return this._http.get('/liveclientdata/activeplayerabilities')
  }

  getActivePlayerName() {
    return this._http.get('/liveclientdata/activeplayername')
  }

  getActivePlayerRunes() {
    return this._http.get('/liveclientdata/activeplayerrunes')
  }

  getActivePlayerSummonerSpells() {
    return this._http.get('/liveclientdata/playersummonerspells')
  }

  getEventData() {
    return this._http.get('/liveclientdata/eventdata')
  }

  getGameStats() {
    return this._http.get<GameStats>('/liveclientdata/gamestats')
  }

  getPlayerItems() {
    return this._http.get('/liveclientdata/playeritems')
  }

  getPlayerMainRunes() {
    return this._http.get('/liveclientdata/playermainrunes')
  }

  getPlayerScores() {
    return this._http.get('/liveclientdata/playerscores')
  }

  getSummonerSpells() {
    return this._http.get('/liveclientdata/playersummonerspells')
  }
}
