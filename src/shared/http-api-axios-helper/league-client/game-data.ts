import {
  Augment,
  ChampDetails,
  ChampionSimple,
  GameMap,
  GameMapAsset,
  Item,
  Perk,
  Perkstyles,
  Queue,
  StrawberryHub,
  SummonerSpell
} from '@shared/types/league-client/game-data'
import { AxiosInstance } from 'axios'

export class GameDataHttpApi {
  constructor(private _http: AxiosInstance) {}

  getSummonerSpells() {
    return this._http.get<SummonerSpell[]>('/lol-game-data/assets/v1/summoner-spells.json')
  }

  getPerkstyles() {
    return this._http.get<Perkstyles>('/lol-game-data/assets/v1/perkstyles.json')
  }

  getItems() {
    return this._http.get<Item[]>('/lol-game-data/assets/v1/items.json')
  }

  getChampionSummary() {
    return this._http.get<ChampionSimple[]>('/lol-game-data/assets/v1/champion-summary.json')
  }

  getMaps() {
    return this._http.get<GameMap[]>('/lol-game-data/assets/v1/maps.json')
  }

  getPerks() {
    return this._http.get<Perk[]>('/lol-game-data/assets/v1/perks.json')
  }

  getQueues() {
    return this._http.get<Queue[]>('/lol-game-data/assets/v1/queues.json')
  }

  getMapAssets() {
    return this._http.get<GameMapAsset>('/lol-game-data/assets/v1/map-assets/map-assets.json')
  }

  getChampDetails(champId: number) {
    return this._http.get<ChampDetails>(`/lol-game-data/assets/v1/champions/${champId}.json`)
  }

  getAugments() {
    return this._http.get<Augment[]>('/lol-game-data/assets/v1/cherry-augments.json')
  }

  getStrawberryHub() {
    return this._http.get<StrawberryHub[]>('/lol-game-data/assets/v1/strawberry-hub.json')
  }
}
