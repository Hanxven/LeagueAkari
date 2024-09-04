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

    this.stateSync('gameflow', gameflow)
  }

  private _syncLcuSummoner() {
    const summoner = useSummonerStore()

    this.stateSync('summoner', summoner)
  }

  private _syncLcuLobby() {
    const lobby = useLobbyStore()

    this.stateSync('lobby', lobby)
  }

  private _syncLcuChat() {
    const chat = useChatStore()

    this.stateSync('chat', chat)
  }

  private _syncLcuChampSelect() {
    const champSelect = useChampSelectStore()

    this.stateSync('champSelect', champSelect)
  }

  private _syncLcuGameData() {
    const gameData = useGameDataStore()

    this.stateSync('gameData', gameData)
  }

  private _syncLcuLogin() {
    const login = useLoginStore()

    this.stateSync('login', login)
  }

  private _syncLcuMatchmaking() {
    const matchmaking = useMatchmakingStore()

    this.stateSync('matchmaking', matchmaking)
  }
}

export const lcuSyncRendererModule = new LcuSyncRendererModule()
