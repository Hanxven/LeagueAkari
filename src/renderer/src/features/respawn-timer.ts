import { watch } from 'vue'

import { getPlayerList } from '@renderer/http-api/game-client'
import { getSetting, setSetting } from '@renderer/utils/storage'

import { useGameDataStore } from './stores/lcu/game-data'
import { useGameflowStore } from './stores/lcu/gameflow'
import { useSummonerStore } from './stores/lcu/summoner'
import { useMatchHistoryStore } from './stores/match-history'
import { useRespawnTimerStore } from './stores/respawn-timer'
import { useSettingsStore } from './stores/settings'

export const id = 'feature:respawn-timer'

let timer = 0
let isStarted = false
let stopRespawnTimerPoll: () => void
let startRespawnTimerPoll: () => Promise<void>

const POLL_INTERVAL = 1000
export function setupRespawnTimer() {
  const summoner = useSummonerStore()
  const mh = useMatchHistoryStore()
  const gameData = useGameDataStore()
  const respawnTimer = useRespawnTimerStore()
  const gameflow = useGameflowStore()
  const settings = useSettingsStore()

  loadSettingsFromStorage()

  const queryRespawnTime = async () => {
    if (!summoner.currentSummoner) {
      return
    }

    try {
      const playerList = (await getPlayerList()).data
      const self = playerList.find((p) => {
        // 名称检查确认
        const isNameEqualed =
          p.summonerName ===
          (summoner.currentSummoner!.displayName || summoner.currentSummoner!.gameName)

        // 额外保险步骤
        const championId = mh.ongoingPlayers[summoner.currentSummoner!.summonerId]?.championId
        if (championId && gameData.champions) {
          return isNameEqualed && gameData.champions[championId]?.name === p.championName
        }

        return isNameEqualed
      })

      if (self) {
        respawnTimer.isDead = self.isDead
        respawnTimer.timeLeft = self.respawnTimer
      }
    } catch (err) {}
  }

  watch([() => respawnTimer.timeLeft, () => respawnTimer.isDead], (t, i) => {
    console.log(t, i)
  })

  startRespawnTimerPoll = async () => {
    if (isStarted) {
      return
    }

    isStarted = true
    queryRespawnTime()
    timer = window.setInterval(queryRespawnTime, POLL_INTERVAL)
  }

  stopRespawnTimerPoll = () => {
    if (!isStarted) {
      return
    }

    isStarted = false
    window.clearInterval(timer)
    respawnTimer.isDead = false
    respawnTimer.timeLeft = 0
  }

  watch(
    () => gameflow.phase,
    (phase) => {
      if (phase === 'InProgress') {
        console.log('dp')
        if (settings.respawnTimer.enabled) {
          startRespawnTimerPoll()
        }
      } else {
        stopRespawnTimerPoll()
      }
    }
  )
}

function loadSettingsFromStorage() {
  const settings = useSettingsStore()

  settings.respawnTimer.enabled = getSetting('respawnTimer.enabled', false)
}

export function setEnableRespawnTimer(enabled: boolean) {
  const settings = useSettingsStore()
  const gameflow = useGameflowStore()

  if (enabled && gameflow.phase === 'InProgress') {
    startRespawnTimerPoll()
  } else if (enabled === false) {
    stopRespawnTimerPoll()
  }

  setSetting('respawnTimer.enabled', enabled)
  settings.respawnTimer.enabled = enabled
}
