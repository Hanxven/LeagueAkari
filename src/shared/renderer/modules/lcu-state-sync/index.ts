import { LeagueAkariRendererModuleManager } from '@shared/renderer/akari-ipc/renderer-module-manager'
import { StateSyncModule } from '@shared/renderer/akari-ipc/state-sync-module'

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
    this.simpleSync('lcu/gameflow/phase', (s) => (gameflow.phase = s))
    this.simpleSync('lcu/gameflow/session', (s) => (gameflow.session = s))
  }

  private _syncLcuSummoner() {
    const summoner = useSummonerStore()

    this.simpleSync('lcu/summoner/me', (s) => (summoner.me = s))
  }

  private _syncLcuLobby() {
    const lobby = useLobbyStore()

    this.simpleSync('lcu/lobby/lobby', (s) => (lobby.lobby = s))
  }

  private _syncLcuChat() {
    const chat = useChatStore()

    this.simpleSync('lcu/chat/me', (s) => (chat.me = s))

    this.simpleSync(
      'lcu/chat/conversations/champ-select',
      (s) => (chat.conversations.championSelect = s)
    )

    this.simpleSync('lcu/chat/conversations/post-game', (s) => (chat.conversations.postGame = s))
    this.simpleSync(
      'lcu/chat/conversations/custom-game',
      (s) => (chat.conversations.customGame = s)
    )
  }

  private _syncLcuChampSelect() {
    const champSelect = useChampSelectStore()

    this.simpleSync('lcu/champ-select/session', (s) => (champSelect.session = s))

    this.simpleSync('lcu/champ-select/pickable-champion-ids', (s: number[]) => {
      champSelect.currentPickableChampions.clear()
      s.forEach((c) => champSelect.currentPickableChampions.add(c))
    })

    this.simpleSync('lcu/champ-select/bannable-champion-ids', (s: number[]) => {
      champSelect.currentBannableChampions.clear()
      s.forEach((c) => champSelect.currentBannableChampions.add(c))
    })

    this.simpleSync('lcu/champ-select/current-champion', (s: number) => {
      champSelect.currentChampion = s
    })
  }

  private _syncLcuGameData() {
    const gameData = useGameDataStore()

    this.simpleSync('lcu/game-data/augments', (s) => (gameData.augments = s))
    this.simpleSync('lcu/game-data/champions', (s) => (gameData.champions = s))
    this.simpleSync('lcu/game-data/items', (s) => (gameData.items = s))
    this.simpleSync('lcu/game-data/perks', (s) => (gameData.perks = s))
    this.simpleSync('lcu/game-data/perkstyles', (s) => (gameData.perkstyles = s))
    this.simpleSync('lcu/game-data/queues', (s) => (gameData.queues = s))
    this.simpleSync('lcu/game-data/summoner-spells', (s) => (gameData.summonerSpells = s))
  }

  private _syncLcuLogin() {
    const login = useLoginStore()

    this.simpleSync('lcu/login/login-queue-state', (s) => (login.loginQueueState = s))
  }

  private _syncLcuMatchmaking() {
    const matchmaking = useMatchmakingStore()

    this.simpleSync('lcu/matchmaking/ready-check', (s) => (matchmaking.readyCheck = s))
    this.simpleSync('lcu/matchmaking/search', (s) => (matchmaking.search = s))
  }
}

export const lcuSyncRendererModule = new LcuSyncRendererModule()
