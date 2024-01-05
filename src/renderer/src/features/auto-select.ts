import { computed, watch } from 'vue'

import { useStableComputed } from '@renderer/compositions/useStableComputed'
import { notify } from '@renderer/events/notifications'
import { benchSwap, pickOrBan } from '@renderer/http-api/champ-select'
import { Action, ChampSelectSession, ChampSelectSummoner } from '@renderer/types/champ-select'
import { getSetting, setSetting } from '@renderer/utils/storage'

import { useChampSelectStore } from './stores/lcu/champ-select'
import { useChatStore } from './stores/lcu/chat'
import { useGameflowStore } from './stores/lcu/gameflow'
import { useSummonerStore } from './stores/lcu/summoner'
import { useSettingsStore } from './stores/settings'
import { onLcuEvent } from './update/lcu-events'

export const id = 'feature:auto-select'

let grabTimer = 0
let targetingChampion: number | null = null

// 处理自动英雄选择相关逻辑
export function setupAutoSelect() {
  const settings = useSettingsStore()
  const cs = useChampSelectStore()

  loadSettingsFromStorage()

  const isSimulPick = computed(() => {
    if (!cs.session) {
      return false
    }

    return cs.session.hasSimultaneousPicks
  })

  let isDoingPick = false
  let isDoingBan = false
  let t = 1
  onLcuEvent<ChampSelectSummoner>('/lol-champ-select/v1/summoners/*', async (event) => {
    if (!cs.session) {
      return
    }

    if (event.eventType === 'Delete') {
      return
    }

    if (!event.data.isSelf || !event.data.isActingNow) {
      return
    }

    switch (event.data.activeActionType) {
      case 'pick': {
        if (!settings.autoSelect.normalModeEnabled) {
          return
        }

        /* 在用户手动选择其他的时候，不会自动改回去，championId 为 0 为未选 */
        if (event.data.championId) {
          return
        }

        if (settings.autoSelect.onlySimulMode && !isSimulPick.value) {
          return
        }
        
        if (cs.session.isCustomGame) {
          return
        }

        if (isDoingPick) {
          return
        }

        // 客户端在英雄选择阶段，分为若干个 action 阶段
        // session 中的 action 阶段可能会动态更新，会比这个事件 (/lol-champ-select/v1/summoners/:cellId) 更早发生
        // 比如竞技场中，有三个 action 阶段:
        // 分别是 ban 阶段 (10 名玩家各自有一个 ban 的 action)
        // pick 1 阶段 (奇数位置的玩家各自有一个 pick 的 action)
        // pick 2 阶段 (偶数位置的玩家各自有一个 pick 的 action)
        // 这样的流程，表现为一个 actions[][] 的数组
        const myInProgressActions = cs.session.actions.reduce((p, c) => {
          const action = c.find((a) => a.actorCellId === event.data.cellId)
          if (action && action.isInProgress) {
            p.push(action)
          }
          return p
        }, [] as Action[])

        const firstPickAction = myInProgressActions.find((a) => a.type === 'pick')
        if (firstPickAction) {
          isDoingPick = true
          try {
            await pickOrBan(
              settings.autoSelect.championId || 1,
              settings.autoSelect.completed,
              'pick',
              firstPickAction.id
            )
          } catch (err) {
            notify.emit({
              id,
              content: '尝试自动选择英雄时失败',
              type: 'warning',
              extra: { error: err }
            })
          } finally {
            isDoingPick = false
          }
        }
        break
      }

      case 'ban': {
        if (!settings.autoSelect.banEnabled) {
          return
        }

        if (cs.session.isCustomGame) {
          return
        }

        if (isDoingBan) {
          return
        }

        const myInProgressActions = cs.session.actions.reduce((p, c) => {
          const action = c.find((a) => a.actorCellId === event.data.cellId)
          if (action && action.isInProgress) {
            p.push(action)
          }
          return p
        }, [] as Action[])

        const firstBanAction = myInProgressActions.find((a) => a.type === 'ban')
        if (firstBanAction) {
          isDoingBan = true
          try {
            await pickOrBan(
              settings.autoSelect.banChampionId++ || 1,
              true,
              'ban',
              firstBanAction.id
            )
          } catch (err) {
            notify.emit({
              id,
              content: '尝试自动禁用英雄时失败',
              type: 'warning',
              extra: { error: err }
            })
          } finally {
            isDoingBan = false
          }
        }
      }
    }
  })

  interface BenchChampionInfo {
    // 最近一次在英雄选择台上的时间
    lastTimeOnBench: number
  }

  // 追踪了英雄选择信息的细节 k = 英雄 ID，v = 英雄信息
  const benchChampions = new Map<number, BenchChampionInfo>()

  const diffBenchAndUpdate = (prevBench: number[], newBench: number[], time: number) => {
    // 多出来的英雄，新的有但上一次没有
    newBench.forEach((c) => {
      if (!prevBench.includes(c)) {
        benchChampions.set(c, { lastTimeOnBench: time })
      }
    })

    // 消失的英雄，旧的有但新的没有
    prevBench.forEach((c) => {
      if (!newBench.includes(c)) {
        benchChampions.delete(c)
      }
    })
  }

  const trySwap = async () => {
    try {
      await benchSwap(targetingChampion!)
    } catch (err) {
      notify.emit({
        id,
        content: '尝试英雄失败',
        type: 'warning',
        extra: { error: err }
      })
    } finally {
      targetingChampion = null
    }
  }

  // s = session, ps = previous session, e = expected champions
  watch([() => cs.session, () => settings.autoSelect.benchExpectedChampions], ([s, e], [ps]) => {
    if (!s) {
      if (ps) {
        benchChampions.clear()
      }
      return
    }

    if (!s.benchEnabled || !settings.autoSelect.benchModeEnabled) {
      return
    }

    const now = Date.now()
    // 对比变化并更新
    diffBenchAndUpdate(
      ps?.benchChampions.map((c) => c.championId) || [],
      s.benchChampions.map((c) => c.championId),
      now
    )

    // 对于有目标的情况，如果目标还存在期望列表中且还在选择台中，那么直接返回
    // 如果不存在期望列表中了，那么找一个新的
    if (targetingChampion) {
      if (e.includes(targetingChampion) && benchChampions.has(targetingChampion)) {
        return
      } else {
        window.clearTimeout(grabTimer)
        targetingChampion = null
      }
    }

    // 如果手上已经有一个期望的了，那么直接返回
    const selfChampionId = s.myTeam.find((v) => v.cellId === s.localPlayerCellId)?.championId
    if (selfChampionId && e.includes(selfChampionId)) {
      return
    }

    // 寻找一个想要抢选的英雄，按照期望列表顺序遍历，排在前面的优先级更高
    for (const c of e) {
      // 很想要，但不能选，假装它不存在
      if (!cs.currentPickableChampions.has(c)) {
        continue
      }
      // 找到了一个用于目标
      if (benchChampions.has(c)) {
        // 单位：ms
        const waitTime = Math.max(
          settings.autoSelect.grabDelay * 1e3 - (now - benchChampions.get(c)!.lastTimeOnBench),
          0
        )
        targetingChampion = c
        if (waitTime <= 15) {
          trySwap()
        } else {
          grabTimer = window.setTimeout(trySwap, waitTime)
        }
        break
      }
    }
  })
}

function loadSettingsFromStorage() {
  const settings = useSettingsStore()

  settings.autoSelect.championId = getSetting('autoSelect.championId', 157)
  settings.autoSelect.completed = getSetting('autoSelect.completed', false)
  settings.autoSelect.normalModeEnabled = getSetting('autoSelect.normalModeEnabled', false)
  settings.autoSelect.onlySimulMode = getSetting('autoSelect.onlySimulMode', true)
  settings.autoSelect.benchModeEnabled = getSetting('autoSelect.benchModeEnabled', false)
  settings.autoSelect.benchExpectedChampions = getSetting('autoSelect.benchExpectedChampions', [])
  settings.autoSelect.grabDelay = getSetting('autoSelect.grabDelay', 1)
  settings.autoSelect.banChampionId = getSetting('autoSelect.banChampionId', 157)
  settings.autoSelect.banEnabled = getSetting('autoSelect.banEnabled', false)
}

export function setNormalModeAutoSelectEnabled(enabled: boolean) {
  const settings = useSettingsStore()

  setSetting('autoSelect.normalModeEnabled', enabled)
  settings.autoSelect.normalModeEnabled = enabled
}

export function setBenchModeAutoSelectEnabled(enabled: boolean) {
  const settings = useSettingsStore()

  if (!enabled) {
    window.clearTimeout(grabTimer)
    targetingChampion = null
  }

  setSetting('autoSelect.benchModeEnabled', enabled)
  settings.autoSelect.benchModeEnabled = enabled
}

export function setBenchModeExpectedChampions(list: number[]) {
  const settings = useSettingsStore()

  setSetting('autoSelect.benchExpectedChampions', list)
  settings.autoSelect.benchExpectedChampions = list
}

export function setAutoSelectChampionId(id: number) {
  const settings = useSettingsStore()

  setSetting('autoSelect.championId', id)
  settings.autoSelect.championId = id
}

export function setAutoBanChampionId(id: number) {
  const settings = useSettingsStore()

  setSetting('autoSelect.banChampionId', id)
  settings.autoSelect.banChampionId = id
}

export function setAutoBanEnabled(enabled: boolean) {
  const settings = useSettingsStore()

  setSetting('autoSelect.banEnabled', enabled)
  settings.autoSelect.banEnabled = enabled
}

export function setAutoSelectCompleted(completed: boolean) {
  const settings = useSettingsStore()

  setSetting('autoSelect.completed', completed)
  settings.autoSelect.completed = completed
}

export function setOnlySimulMode(yes: boolean) {
  const settings = useSettingsStore()

  setSetting('autoSelect.onlySimulMode', yes)
  settings.autoSelect.onlySimulMode = yes
}

export function setGrabDelay(delay: number) {
  const settings = useSettingsStore()

  setSetting('autoSelect.grabDelay', delay)
  settings.autoSelect.grabDelay = delay
}
