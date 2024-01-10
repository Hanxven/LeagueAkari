import PQueue from 'p-queue'
import { markRaw, watch } from 'vue'

import { notify } from '@renderer/events/notifications'
import { getChampSelectSession, getPickableChampIds } from '@renderer/http-api/champ-select'
import { getMe } from '@renderer/http-api/chat'
import {
  getAugments,
  getChampionSummary,
  getItems,
  getPerks,
  getPerkstyles,
  getQueues,
  getSummonerSpells
} from '@renderer/http-api/game-data'
import { getGameFlowPhase } from '@renderer/http-api/gameflow'
import { getCurrentSummoner } from '@renderer/http-api/summoner'
import { call, onUpdate } from '@renderer/ipc'

import { useLcuStateStore } from '../stores/lcu-connection'
import { useChampSelectStore } from '../stores/lcu/champ-select'
import { useChatStore } from '../stores/lcu/chat'
import { useGameDataStore } from '../stores/lcu/game-data'
import { useGameflowStore } from '../stores/lcu/gameflow'
import { useLobbyStore } from '../stores/lcu/lobby'
import { useSummonerStore } from '../stores/lcu/summoner'
import { onLcuEvent, startLcuEventUpdate } from './lcu-events'

export const id = 'core:lcu-state-update'

// 处理 App 和 LCU 的状态更新
export function setupStateUpdater() {
  // 开始监听 LCU 事件更新
  startLcuEventUpdate()

  // 基本连接状态信息
  lcuState()

  // 游戏流
  gameflow()

  // 游戏数据
  gameData()

  // 召唤师
  summoner()

  // 房间
  lobby()

  // 聊天
  chat()

  // 英雄选择
  champSelect()
}

function lcuState() {
  const lcuState = useLcuStateStore()

  call('getLcuState').then((state) => {
    lcuState.state = state
  })

  call('getLcuAuth').then((auth) => {
    lcuState.auth = auth
  })

  onUpdate('lcuState', (_, state) => {
    lcuState.state = state
  })

  onUpdate('lcuAuth', (_, auth) => {
    lcuState.auth = auth
  })

  watch(
    () => lcuState.auth,
    (auth) => {
      if (auth) {
        console.log('LCU Auth got', auth)
      }
    }
  )
}

function gameflow() {
  const lcuState = useLcuStateStore()
  const gameflow = useGameflowStore()

  // 立即初始化
  watch(
    () => lcuState.state,
    async (state) => {
      if (state === 'connected') {
        gameflow.phase = (await getGameFlowPhase()).data
      } else {
        gameflow.phase = null
      }
    },
    { immediate: true }
  )

  onLcuEvent('/lol-gameflow/v1/gameflow-phase', (event) => {
    gameflow.phase = event.data
  })
}

// 对于静态文件的获取，添加一个并发限制
const gameDataFetchLimiter = new PQueue({
  concurrency: 3
})

function gameData() {
  const gameData = useGameDataStore()
  const lcuState = useLcuStateStore()

  watch(
    () => lcuState.state,
    (state) => {
      if (state !== 'connected') {
        return
      }

      gameDataFetchLimiter.add(async () => {
        try {
          const spells = (await getSummonerSpells()).data
          gameData.summonerSpells = spells.reduce((prev, cur) => {
            prev[cur.id] = cur
            return prev
          }, {})
        } catch (err) {
          notify.emit({
            id,
            type: 'warning',
            content: '加载召唤师技能失败',
            extra: { error: err }
          })
        }
      })

      gameDataFetchLimiter.add(async () => {
        try {
          const items = (await getItems()).data
          gameData.items = items.reduce((prev, cur) => {
            prev[cur.id] = cur
            return prev
          }, {})
        } catch (err) {
          notify.emit({
            id,
            type: 'warning',
            content: '加载装备列表失败',
            extra: { error: err }
          })
        }
      })

      gameDataFetchLimiter.add(async () => {
        try {
          const queues = (await getQueues()).data
          gameData.queues = queues
        } catch (err) {
          notify.emit({
            id,
            type: 'warning',
            content: '加载可用队列失败',
            extra: { error: err }
          })
        }
      })

      gameDataFetchLimiter.add(async () => {
        try {
          const perks = (await getPerks()).data
          gameData.perks = perks.reduce((prev, cur) => {
            prev[cur.id] = cur
            return prev
          }, {})
        } catch (err) {
          notify.emit({
            type: 'warning',
            content: '加载符文 (Perk) 失败',
            extra: { error: err }
          })
        }
      })

      gameDataFetchLimiter.add(async () => {
        try {
          const perkstyles = (await getPerkstyles()).data
          gameData.perkstyles = perkstyles.styles.reduce((prev, cur) => {
            prev[cur.id] = cur
            return prev
          }, {})
        } catch (err) {
          notify.emit({
            id,
            type: 'warning',
            content: '加载符文 (Perkstyle) 失败',
            extra: { error: err }
          })
        }
      })

      gameDataFetchLimiter.add(async () => {
        try {
          const augments = (await getAugments()).data
          gameData.augments = augments.reduce((prev, cur) => {
            prev[cur.id] = cur
            return prev
          }, {})
        } catch (err) {
          notify.emit({
            id,
            type: 'warning',
            content: '加载 Augment 对照表失败',
            extra: { error: err }
          })
        }
      })

      gameDataFetchLimiter.add(async () => {
        try {
          const champions = (await getChampionSummary()).data
          gameData.champions = champions.reduce((prev, cur) => {
            prev[cur.id] = cur
            return prev
          }, {})
        } catch (err) {
          notify.emit({
            id,
            type: 'warning',
            content: '加载 Champions 对照表失败',
            extra: { error: err }
          })
        }
      })
    },
    { immediate: true }
  )
}

function summoner() {
  const summoner = useSummonerStore()
  const lcuState = useLcuStateStore()

  let error: Error
  let retryCount = 0
  const maxRetries = 10
  let timerId = 0

  const retryFetching = async () => {
    if (retryCount < maxRetries) {
      try {
        const data = (await getCurrentSummoner()).data
        summoner.currentSummoner = data
        console.log('selfSummoner', data)
        retryCount = 0
        summoner.newIdSystemEnabled = Boolean(data.tagLine)
      } catch (err) {
        error = err as Error
        retryCount++
        timerId = window.setTimeout(retryFetching, 1000)
      }
    } else {
      notify.emit({
        id,
        type: 'warning',
        content: '初始化用户信息失败',
        extra: { error }
      })
      window.clearTimeout(timerId)
    }
  }

  watch(
    () => lcuState.state,
    (state) => {
      if (state === 'connected') {
        retryFetching()
      } else if (state === 'disconnected') {
        window.clearTimeout(timerId)
        summoner.currentSummoner = null
        retryCount = 0
      }
    },
    { immediate: true }
  )

  onLcuEvent('/lol-summoner/v1/current-summoner', (event) => {
    summoner.currentSummoner = event.data
  })
}

function lobby() {
  const lobby = useLobbyStore()

  onLcuEvent('/lol-lobby/v2/lobby', (event) => {
    lobby.lobby = event.data
  })
}

function chat() {
  const chat = useChatStore()
  const lcuState = useLcuStateStore()

  // TODO 中途进入时的初始化操作，暂时不处理

  // 各种对话房间的创建和销毁
  onLcuEvent('/lol-chat/v1/conversations/:id', (event, { id }) => {
    if (event.eventType === 'Delete') {
      if (chat.conversations.championSelect?.id === id) {
        chat.conversations.championSelect = null
        chat.participants.championSelect = null
      } else if (chat.conversations.postGame?.id === id) {
        chat.conversations.postGame = null
        chat.participants.postGame = null
      }
      return
    }

    switch (event.data.type) {
      case 'championSelect':
        if (event.eventType === 'Create') {
          chat.conversations.championSelect = event.data
          chat.participants.championSelect = []
        } else if (event.eventType === 'Update') {
          chat.conversations.championSelect = event.data
        }
        break
      case 'postGame':
        if (event.eventType === 'Create') {
          chat.conversations.postGame = event.data
          chat.participants.postGame = []
        } else if (event.eventType === 'Update') {
          chat.conversations.postGame = event.data
        }
        break
    }
  })

  // 监测用户进入房间
  // 有的时候只能通过聊天室来判断队友
  onLcuEvent('/lol-chat/v1/conversations/:conversationId/messages/:messageId', (event, param) => {
    // 英雄选择期间聊天室
    // 处理英雄选择时，用户加入的记录（只处理加入一次，因为要用来查战绩。用户退出聊天不管，因为会在聊天室销毁后统一清除）
    if (
      event.data &&
      event.data.type === 'system' &&
      event.data.body === 'joined_room' &&
      chat.conversations.championSelect &&
      chat.conversations.championSelect.id === param.conversationId
    ) {
      // 如果召唤师是混淆的，那么 ID = 0，这种情况需要考虑
      if (!event.data.fromSummonerId) {
        return
      }

      // 去重的 id
      chat.participants.championSelect = Array.from(
        new Set([...(chat.participants.championSelect ?? []), event.data.fromSummonerId])
      )
    }

    // TODO 游戏结束后聊天室 - 目前还没有逻辑用到
    // ...
  })

  onLcuEvent('/lol-chat/v1/me', (event) => {
    if (event.eventType === 'Update' || event.eventType === 'Create') {
      chat.me = event.data
      return
    }

    chat.me = null
  })

  watch(
    () => lcuState.state,
    async (state) => {
      if (state === 'connected') {
        try {
          chat.me = (await getMe()).data
        } catch (err) {
          notify.emit({
            id,
            type: 'warning',
            content: '尝试初始化聊天个人信息时失败',
            extra: { error: err }
          })
        }
      }
    }
  )
}

function champSelect() {
  const champSelect = useChampSelectStore()
  const gameflow = useGameflowStore()
  const lcuState = useLcuStateStore()

  watch(
    () => gameflow.phase,
    async (phase) => {
      if (phase === 'ChampSelect') {
        try {
          champSelect.session = (await getChampSelectSession()).data
        } catch (err) {
          notify.emit({
            id,
            type: 'warning',
            content: '拉取当前英雄选择信息失败',
            extra: { error: err }
          })
        }
      } else {
        champSelect.session = null
      }
    }
  )

  // 处理中场进入的情况，主动获取可用英雄列表
  watch([() => lcuState.state, () => gameflow.phase], async ([state, phase]) => {
    if (state === 'connected' && phase === 'ChampSelect') {
      try {
        if (champSelect.currentPickableChampions.size) {
          champSelect.currentPickableChampions.clear()
        }
        const pickables = (await getPickableChampIds()).data
        pickables.forEach((id) => champSelect.currentPickableChampions.add(id))
      } catch (err) {
        notify.emit({
          id,
          type: 'warning',
          content: '拉取当前英雄可选信息失败',
          extra: { error: err }
        })
      }
    }
  })

  onLcuEvent('/lol-champ-select/v1/session', (event) => {
    // create, update, delete, 3 in 1
    champSelect.session = event.data
  })

  onLcuEvent<number[]>('/lol-champ-select/v1/pickable-champion-ids', (event) => {
    if (event.eventType === 'Delete') {
      champSelect.currentPickableChampions.clear()
    } else {
      if (champSelect.currentPickableChampions.size) {
        champSelect.currentPickableChampions.clear()
      }
      event.data.forEach((id) => champSelect.currentPickableChampions.add(id))
    }
  })
}
