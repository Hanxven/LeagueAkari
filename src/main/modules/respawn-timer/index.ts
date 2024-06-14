import { createLogger } from '@main/modules/akari-core/log'
import { getPlayerList } from '@main/http-api/game-client'
import { getSetting, setSetting } from '@main/storage/settings'
import { ipcStateSync, onRendererCall } from '@main/utils/ipc'
import { reaction, runInAction } from 'mobx'

import { gameData } from '../lcu-state-sync/game-data'
import { gameflow } from '../lcu-state-sync/gameflow'
import { summoner } from '../lcu-state-sync/summoner'
import { respawnTimerState } from './state'

const logger = createLogger('respawn-timer')

let timer: NodeJS.Timeout
let isStarted = false
let stopRespawnTimerPoll: () => void
let startRespawnTimerPoll: () => Promise<void>

const POLL_INTERVAL = 1000
export async function setupRespawnTimer() {
  stateSync()
  ipcCall()
  await loadSettings()

  const queryRespawnTime = async () => {
    if (!summoner.me) {
      logger.warn('召唤师信息未正确加载')
      return
    }

    try {
      const playerList = (await getPlayerList()).data
      const self = playerList.find((p) => {
        // 2024-04-27 之后，有 Tag 了
        if (!p.summonerName.includes('#')) {
          return p.summonerName === summoner.me?.gameName || summoner.me?.displayName
        }

        const isNameEqualed = p.summonerName === summoner.me?.gameName || summoner.me?.displayName

        // 额外保险步骤
        const championId = respawnTimerState.selfChampionInGameSelection
        if (championId && gameData.champions) {
          return isNameEqualed && gameData.champions[championId]?.name === p.championName
        }

        return isNameEqualed
      })

      if (self) {
        if (!respawnTimerState.isDead && self.isDead) {
          runInAction(() => (respawnTimerState.totalTime = self.respawnTimer))
        }

        runInAction(() => {
          respawnTimerState.isDead = self.isDead
          respawnTimerState.timeLeft = self.respawnTimer
        })
      }
    } catch {}
  }

  startRespawnTimerPoll = async () => {
    if (isStarted) {
      return
    }

    logger.info('轮询开始')

    isStarted = true
    queryRespawnTime()
    timer = setInterval(queryRespawnTime, POLL_INTERVAL)
  }

  stopRespawnTimerPoll = () => {
    if (!isStarted) {
      return
    }

    logger.info('轮询结束')

    isStarted = false
    clearInterval(timer)

    runInAction(() => {
      respawnTimerState.isDead = false
      respawnTimerState.timeLeft = 0
    })
  }

  reaction(
    () => gameflow.phase,
    (phase) => {
      if (phase === 'InProgress') {
        if (respawnTimerState.settings.enabled) {
          startRespawnTimerPoll()
        }
      } else {
        runInAction(() => {
          respawnTimerState.isDead = false
          respawnTimerState.timeLeft = 0
        })
        stopRespawnTimerPoll()
      }
    }
  )

  logger.info('初始化完成')
}

async function loadSettings() {
  respawnTimerState.settings.setEnabled(
    await getSetting('respawn-timer/enabled', respawnTimerState.settings.enabled)
  )
}

function ipcCall() {
  onRendererCall('respawn-timer/settings/enabled/set', async (_, enabled) => {
    if (enabled && gameflow.phase === 'InProgress') {
      startRespawnTimerPoll()
    } else if (enabled === false) {
      stopRespawnTimerPoll()
    }

    respawnTimerState.settings.setEnabled(enabled)
    await setSetting('respawn-timer/enabled', enabled)
  })
}

function stateSync() {
  ipcStateSync('respawn-timer/settings/enabled', () => respawnTimerState.settings.enabled)
  ipcStateSync('respawn-timer/is-dead', () => respawnTimerState.isDead)
  ipcStateSync('respawn-timer/time-left', () => respawnTimerState.timeLeft)
  ipcStateSync('respawn-timer/total-time', () => respawnTimerState.totalTime)
}
