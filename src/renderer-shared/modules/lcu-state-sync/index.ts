import { StateSyncModule } from '@renderer-shared/akari-ipc/state-sync-module'

import { useChampSelectStore } from './champ-select'
import { useChatStore } from './chat'
import { useGameDataStore } from './game-data'
import { useGameflowStore } from './gameflow'
import { useLobbyStore } from './lobby'
import { useLoginStore } from './login'
import { useMatchmakingStore } from './matchmaking'
import { useSummonerStore } from './summoner'

export class LcuSyncRendererModule extends StateSyncModule {
  constructor() {
    super('lcu-state-sync')
  }

  override async setup() {
    await super.setup()

    this._syncLcuChampSelect()
    this._syncLcuChat()
    this._syncLcuGameData()
    this._syncLcuGameflow()
    this._syncLcuLobby()
    this._syncLcuLogin()
    this._syncLcuMatchmaking()
    this._syncLcuSummoner()
  }

  private _syncLcuGameflow() {
    const gameflow = useGameflowStore()

    this.dotPropSync(gameflow, `${this.id}/gameflow`, 'session')
    this.dotPropSync(gameflow, `${this.id}/gameflow`, 'phase')
  }

  private _syncLcuSummoner() {
    const summoner = useSummonerStore()

    this.dotPropSync(summoner, `${this.id}/summoner`, 'me')
  }

  private _syncLcuLobby() {
    const lobby = useLobbyStore()

    this.dotPropSync(lobby, `${this.id}/lobby`, 'lobby')
  }

  private _syncLcuChat() {
    const chat = useChatStore()

    this.dotPropSync(chat, `${this.id}/chat`, 'me')
    this.dotPropSync(chat, `${this.id}/chat`, 'conversations.championSelect')
    this.dotPropSync(chat, `${this.id}/chat`, 'conversations.postGame')
    this.dotPropSync(chat, `${this.id}/chat`, 'conversations.customGame')
  }

  private _syncLcuChampSelect() {
    const champSelect = useChampSelectStore()

    this.dotPropSync(champSelect, `${this.id}/champSelect`, 'session')
    this.dotPropSync(champSelect, `${this.id}/champSelect`, 'currentPickableChampionIds')
    this.dotPropSync(champSelect, `${this.id}/champSelect`, 'currentBannableChampionIds')
    this.dotPropSync(champSelect, `${this.id}/champSelect`, 'currentChampion')
  }

  private _syncLcuGameData() {
    const gameData = useGameDataStore()

    this.dotPropSync(gameData, `${this.id}/gameData`, 'augments')
    this.dotPropSync(gameData, `${this.id}/gameData`, 'champions')
    this.dotPropSync(gameData, `${this.id}/gameData`, 'items')
    this.dotPropSync(gameData, `${this.id}/gameData`, 'perks')
    this.dotPropSync(gameData, `${this.id}/gameData`, 'perkstyles')
    this.dotPropSync(gameData, `${this.id}/gameData`, 'queues')
    this.dotPropSync(gameData, `${this.id}/gameData`, 'summonerSpells')
  }

  private _syncLcuLogin() {
    const login = useLoginStore()

    this.dotPropSync(login, `${this.id}/login`, 'loginQueueState')
  }

  private _syncLcuMatchmaking() {
    const matchmaking = useMatchmakingStore()

    this.dotPropSync(matchmaking, `${this.id}/matchmaking`, 'readyCheck')
    this.dotPropSync(matchmaking, `${this.id}/matchmaking`, 'search')
  }
}

export const lcuSyncRendererModule = new LcuSyncRendererModule()
