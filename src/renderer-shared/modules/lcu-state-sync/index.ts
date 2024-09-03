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

    this.sync(gameflow, `${this.id}/gameflow`, 'session')
    this.sync(gameflow, `${this.id}/gameflow`, 'phase')
  }

  private _syncLcuSummoner() {
    const summoner = useSummonerStore()

    this.sync(summoner, `${this.id}/summoner`, 'me')
  }

  private _syncLcuLobby() {
    const lobby = useLobbyStore()

    this.sync(lobby, `${this.id}/lobby`, 'lobby')
  }

  private _syncLcuChat() {
    const chat = useChatStore()

    this.sync(chat, `${this.id}/chat`, 'me')
    this.sync(chat, `${this.id}/chat`, 'conversations.championSelect')
    this.sync(chat, `${this.id}/chat`, 'conversations.postGame')
    this.sync(chat, `${this.id}/chat`, 'conversations.customGame')
  }

  private _syncLcuChampSelect() {
    const champSelect = useChampSelectStore()

    this.sync(champSelect, `${this.id}/champSelect`, 'session')
    this.sync(champSelect, `${this.id}/champSelect`, 'currentPickableChampionIds')
    this.sync(champSelect, `${this.id}/champSelect`, 'currentBannableChampionIds')
    this.sync(champSelect, `${this.id}/champSelect`, 'currentChampion')
  }

  private _syncLcuGameData() {
    const gameData = useGameDataStore()

    this.sync(gameData, `${this.id}/gameData`, 'augments')
    this.sync(gameData, `${this.id}/gameData`, 'champions')
    this.sync(gameData, `${this.id}/gameData`, 'items')
    this.sync(gameData, `${this.id}/gameData`, 'perks')
    this.sync(gameData, `${this.id}/gameData`, 'perkstyles')
    this.sync(gameData, `${this.id}/gameData`, 'queues')
    this.sync(gameData, `${this.id}/gameData`, 'summonerSpells')
  }

  private _syncLcuLogin() {
    const login = useLoginStore()

    this.sync(login, `${this.id}/login`, 'loginQueueState')
  }

  private _syncLcuMatchmaking() {
    const matchmaking = useMatchmakingStore()

    this.sync(matchmaking, `${this.id}/matchmaking`, 'readyCheck')
    this.sync(matchmaking, `${this.id}/matchmaking`, 'search')
  }
}

export const lcuSyncRendererModule = new LcuSyncRendererModule()
