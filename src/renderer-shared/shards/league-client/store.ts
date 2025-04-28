import { ChampSelectSession, OngoingTrade } from '@shared/types/league-client/champ-select'
import { ChatPerson, Conversation } from '@shared/types/league-client/chat'
import {
  Augment,
  ChampionSimple,
  Item,
  Perk,
  Queue,
  Style,
  SummonerSpell
} from '@shared/types/league-client/game-data'
import { GameflowPhase, GameflowSession } from '@shared/types/league-client/gameflow'
import { Ballot } from '@shared/types/league-client/honorV2'
import { Lobby, ReceivedInvitation } from '@shared/types/league-client/lobby'
import { LoginQueueState } from '@shared/types/league-client/login'
import { GetSearch, ReadyCheck } from '@shared/types/league-client/matchmaking'
import { SummonerInfo, SummonerProfile } from '@shared/types/league-client/summoner'
import { defineStore } from 'pinia'
import { computed, shallowReactive, shallowRef } from 'vue'

// copied
export type LcConnectionStateType = 'connecting' | 'connected' | 'disconnected'

// copied
export interface UxCommandLine {
  port: number
  pid: number
  authToken: string
  certificate: string
  region: string
  rsoPlatformId: string
  riotClientPort: number
  riotClientAuthToken: string
}

// copied
type InitializationProgress = {
  currentId: string | null
  finished: string[]
  all: string[]
}

export const useLeagueClientStore = defineStore('shard:league-client-renderer', () => {
  const connectionState = shallowRef<LcConnectionStateType>('disconnected')
  const auth = shallowRef<UxCommandLine | null>(null)
  const connectingClient = shallowRef<UxCommandLine | null>(null)

  const isConnected = computed(() => connectionState.value === 'connected')
  const isConnecting = computed(() => connectionState.value === 'connecting')
  const isDisconnected = computed(() => connectionState.value === 'disconnected')

  const isInConnectionLoop = computed(() => {
    return connectingClient.value && connectionState.value !== 'connected'
  })

  const settings = shallowReactive({
    autoConnect: false
  })

  const gameData = {
    champions: shallowRef<Record<number, ChampionSimple>>({}),
    augments: shallowRef<Record<number, Augment>>({}),
    perks: shallowRef<Record<number, Perk>>({}),
    perkstyles: shallowRef<{
      schemaVersion: number
      styles: Record<number, Style>
    }>({
      schemaVersion: 0,
      styles: {}
    }),
    queues: shallowRef<Record<number, Queue>>({}),
    items: shallowRef<Record<number, Item>>({}),
    summonerSpells: shallowRef<Record<number, SummonerSpell>>({})
  } as const

  const champSelect = {
    session: shallowRef<ChampSelectSession | null>(null),
    currentChampion: shallowRef<number | null>(null),
    currentPickableChampionIds: shallowRef<Set<number>>(new Set()),
    currentBannableChampionIds: shallowRef<Set<number>>(new Set()),
    disabledChampionIds: shallowRef<Set<number>>(new Set()),
    ongoingTrade: shallowRef<OngoingTrade | null>(null)
  } as const

  const chat = {
    me: shallowRef<ChatPerson | null>(null),
    conversations: {
      championSelect: shallowRef<Conversation | null>(null),
      postGame: shallowRef<Conversation | null>(null),
      customGame: shallowRef<Conversation | null>(null)
    } as const,
    participants: {
      championSelect: shallowRef<Conversation | null>(null),
      postGame: shallowRef<Conversation | null>(null),
      customGame: shallowRef<Conversation | null>(null)
    } as const
  } as const

  const gameflow = {
    phase: shallowRef<GameflowPhase | null>(null),
    session: shallowRef<GameflowSession | null>(null)
  } as const

  const honor = {
    ballot: shallowRef<Ballot | null>(null)
  } as const

  const lobby = {
    lobby: shallowRef<Lobby | null>(null),
    receivedInvitations: shallowRef<ReceivedInvitation[]>([])
  } as const

  const summoner = {
    me: shallowRef<SummonerInfo | null>(null),
    profile: shallowRef<SummonerProfile | null>(null)
  } as const

  const login = {
    loginQueueState: shallowRef<LoginQueueState | null>(null)
  } as const

  const matchmaking = {
    readyCheck: shallowRef<ReadyCheck | null>(null),
    search: shallowRef<GetSearch | null>(null)
  } as const

  const initialization = {
    progress: null as InitializationProgress | null
  }

  return {
    gameData,
    champSelect,
    chat,
    gameflow,
    honor,
    lobby,
    summoner,
    login,
    matchmaking,

    initialization,

    settings,

    connectionState,
    isConnected, // for convenience
    isConnecting, // for convenience
    isDisconnected, // for convenience
    isInConnectionLoop, // for convenience
    auth,
    connectingClient
  }
})
