import { AxiosInstance } from 'axios'

import { ChallengesHttpApi } from './challenges'
import { ChampSelectHttpApi } from './champ-select'
import { ChampionMasteryHttpApi } from './champion-mastery'
import { ChatHttpApi } from './chat'
import { EntitlementsHttpApi } from './entitlements'
import { GameDataHttpApi } from './game-data'
import { GameflowHttpApi } from './gameflow'
import { HonorHttpApi } from './honor'
import { LoadoutsHttpApi } from './loadouts'
import { LobbyHttpApi } from './lobby'
import { LoginHttpApi } from './login'
import { LolLeagueSessionHttpApi } from './lol-league-session'
import { LootHttpApi } from './loot'
import { MatchHistoryHttpApi } from './match-history'
import { MatchmakingHttpApi } from './matchmaking'
import { PlayerNotificationsHttpApi } from './player-notifications'
import { ProcessControlHttpApi } from './process-control'
import { RankedHttpApi } from './ranked'
import { RegaliaHttpApi } from './regalia'
import { RiotClientHttpApi } from './riotclient'
import { SpectatorHttpApi } from './spectator'
import { SummonerHttpApi } from './summoner'
import { PerksHttpApi } from './perks'

/**
 * 基于 Axios 封装的调用
 */
export class LeagueClientHttpApiAxiosHelper {
  public readonly champSelect: ChampSelectHttpApi
  public readonly championMastery: ChampionMasteryHttpApi
  public readonly chat: ChatHttpApi
  public readonly entitlements: EntitlementsHttpApi
  public readonly gameData: GameDataHttpApi
  public readonly gameflow: GameflowHttpApi
  public readonly honor: HonorHttpApi
  public readonly lobby: LobbyHttpApi
  public readonly login: LoginHttpApi
  public readonly lolLeagueSession: LolLeagueSessionHttpApi
  public readonly loot: LootHttpApi
  public readonly matchHistory: MatchHistoryHttpApi
  public readonly matchmaking: MatchmakingHttpApi
  public readonly playerNotifications: PlayerNotificationsHttpApi
  public readonly processControl: ProcessControlHttpApi
  public readonly ranked: RankedHttpApi
  public readonly riotclient: RiotClientHttpApi
  public readonly spectator: SpectatorHttpApi
  public readonly summoner: SummonerHttpApi
  public readonly regalia: RegaliaHttpApi
  public readonly loadouts: LoadoutsHttpApi
  public readonly challenges: ChallengesHttpApi
  public readonly perks: PerksHttpApi

  constructor(private _http: AxiosInstance) {
    this.champSelect = new ChampSelectHttpApi(this._http)
    this.championMastery = new ChampionMasteryHttpApi(this._http)
    this.chat = new ChatHttpApi(this._http)
    this.entitlements = new EntitlementsHttpApi(this._http)
    this.gameData = new GameDataHttpApi(this._http)
    this.gameflow = new GameflowHttpApi(this._http)
    this.honor = new HonorHttpApi(this._http)
    this.lobby = new LobbyHttpApi(this._http)
    this.login = new LoginHttpApi(this._http)
    this.lolLeagueSession = new LolLeagueSessionHttpApi(this._http)
    this.loot = new LootHttpApi(this._http)
    this.matchHistory = new MatchHistoryHttpApi(this._http)
    this.matchmaking = new MatchmakingHttpApi(this._http)
    this.playerNotifications = new PlayerNotificationsHttpApi(this._http)
    this.processControl = new ProcessControlHttpApi(this._http)
    this.ranked = new RankedHttpApi(this._http)
    this.riotclient = new RiotClientHttpApi(this._http)
    this.spectator = new SpectatorHttpApi(this._http)
    this.summoner = new SummonerHttpApi(this._http)
    this.regalia = new RegaliaHttpApi(this._http)
    this.loadouts = new LoadoutsHttpApi(this._http)
    this.challenges = new ChallengesHttpApi(this._http)
    this.perks = new PerksHttpApi(this._http)
  }
}