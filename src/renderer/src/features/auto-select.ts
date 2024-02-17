import { computed, watch } from 'vue'

import { useStableRef } from '@renderer/compositions/useStableRef'
import { notify } from '@renderer/events/notifications'
import { action, benchSwap, pickOrBan } from '@renderer/http-api/champ-select'
import { chatSend } from '@renderer/http-api/chat'
import { Action, ChampSelectSummoner } from '@renderer/types/champ-select'
import { getSetting, removeSetting, setSetting } from '@renderer/utils/storage'

import { useChampSelectStore } from './stores/lcu/champ-select'
import { useChatStore } from './stores/lcu/chat'
import { useGameDataStore } from './stores/lcu/game-data'
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
  const gameData = useGameDataStore()
  const summoner = useSummonerStore()
  const gameflow = useGameflowStore()
  const chat = useChatStore()

  loadSettingsFromStorage()

  const getRandomValue = () => {
    return Math.floor(Math.random() * 1.14514e12)
  }

  let randomlyPickSeed = 1.14e12
  let randomlyBanSeed = 5.14e11
  watch(
    () => gameflow.phase,
    (phase) => {
      if (phase === 'ChampSelect') {
        randomlyPickSeed = getRandomValue()
        randomlyBanSeed = getRandomValue()
      }
    }
  )

  // 这个响应式变量指示了自动选择即将选择的英雄
  const currentPickActionChampion = computed(() => {
    if (!cs.session || !settings.autoSelect.expectedChampions || !summoner.currentSummoner) {
      return null
    }

    if (!settings.autoSelect.normalModeEnabled) {
      return null
    }

    if (!cs.session.hasSimultaneousPicks && settings.autoSelect.onlySimulMode) {
      return null
    }

    let hasPickAction = false
    for (const arr of cs.session.actions) {
      if (arr.findIndex((a) => a.type === 'pick') !== -1) {
        hasPickAction = true
        break
      }
    }

    if (!hasPickAction) {
      return null
    }

    const self = cs.session.myTeam.find(
      (t) => t.summonerId === summoner.currentSummoner?.summonerId
    )

    if (!self) {
      return null
    }

    const unselectableChampions = [...cs.session.myTeam, ...cs.session.theirTeam].reduce(
      (prev, cur) => {
        if (cur.championId && cur.summonerId !== summoner.currentSummoner!.summonerId) {
          prev.add(cur.championId)
        }
        return prev
      },
      new Set<number>()
    )

    cs.session.actions.forEach((ar) =>
      ar.forEach((a) => {
        if (a.type === 'ban' && a.completed) {
          unselectableChampions.add(a.championId)
        }
      })
    )

    if (!settings.autoSelect.selectTeammateIntendedChampion) {
      cs.session.myTeam.forEach((m) => {
        if (m.championPickIntent && m.summonerId !== summoner.currentSummoner!.summonerId) {
          unselectableChampions.add(m.championPickIntent)
        }
      })
    }

    ;[...cs.session.bans.myTeamBans, ...cs.session.bans.theirTeamBans].forEach((c) =>
      unselectableChampions.add(c)
    )

    const expected = [...settings.autoSelect.expectedChampions]

    const pickableChampions = expected.filter(
      (c) => !unselectableChampions.has(c) && cs.currentPickableChampions.has(c)
    )

    if (pickableChampions.length === 0) {
      return null
    }

    const candidate =
      settings.autoSelect.selectRandomly && !self!.championPickIntent
        ? pickableChampions[randomlyPickSeed % pickableChampions.length]
        : pickableChampions[0]

    // 已经选择的英雄将不再触发操作
    if (!settings.autoSelect.completed && self!.championId === candidate) {
      return null
    }

    return candidate
  })

  // 在选择之前实时更新预选
  watch(
    () => currentPickActionChampion.value,
    (id) => {
      if (!settings.autoSelect.showIntent) {
        return
      }

      if (id && cs.session && summoner.currentSummoner) {
        const cellId = cs.session.myTeam.find(
          (c) => c.summonerId === summoner.currentSummoner!.summonerId
        )!.cellId

        for (const arr of cs.session.actions) {
          const a = arr.find((c) => c.actorCellId === cellId && c.type === 'pick')

          if (a) {
            if (!a.isInProgress && !a.completed) {
              action(a.id, { championId: id }).catch()
            }
            break
          }
        }
      }
    }
  )

  const activeSummonerState = useStableRef<{
    actionType: string
    actions: Pick<Action, 'id' | 'type'>[]
    cellId: number
  } | null>(null)

  watch(
    () => gameflow.phase,
    (phase) => {
      if (phase !== 'ChampSelect') {
        activeSummonerState.value = null
      }
    }
  )

  watch(
    () => chat.conversations.championSelect?.id,
    (id) => {
      if (id && gameflow.phase === 'ChampSelect') {
        if (!cs.session) {
          return
        }
        const texts: string[] = []
        if (!cs.session.benchEnabled && settings.autoSelect.normalModeEnabled) {
          texts.push('普通模式自动选择')
        }
        if (cs.session.benchEnabled && settings.autoSelect.benchModeEnabled) {
          texts.push('随机模式自动选择')
        }
        if (!cs.session.benchEnabled && settings.autoSelect.banEnabled) {
          let hasBanAction = false
          for (const arr of cs.session.actions) {
            if (arr.findIndex((a) => a.type === 'ban') !== -1) {
              hasBanAction = true
              break
            }
          }
          if (hasBanAction) {
            texts.push('自动禁用')
          }
        }
        if (texts.length) {
          chatSend(id, `[League Toolkit] ${texts.join('，')}已开启`, 'celebration').catch()
        }
      }
    }
  )

  onLcuEvent<ChampSelectSummoner>('/lol-champ-select/v1/summoners/*', async (event) => {
    if (event.eventType === 'Delete') {
      activeSummonerState.value = null
      return
    }

    if (!event.data.isSelf || !event.data.isActingNow) {
      return
    }

    if (!cs.session) {
      return
    }

    const myInProgressActions = cs.session.actions.reduce((p, c) => {
      const action = c.find((a) => a.actorCellId === event.data.cellId)
      if (action && action.isInProgress) {
        p.push(action)
      }
      return p
    }, [] as Action[])

    activeSummonerState.value = {
      actionType: event.data.activeActionType,
      cellId: event.data.cellId,
      actions: myInProgressActions.map((a) => ({
        id: a.id,
        type: a.type
      }))
    }
  })

  watch(
    () => activeSummonerState.value,
    async (s) => {
      if (!s) {
        return
      }

      if (!summoner.currentSummoner) {
        return
      }

      if (s.actionType === 'pick') {
        if (!currentPickActionChampion.value) {
          if (chat.conversations.championSelect && settings.autoSelect.normalModeEnabled) {
            chatSend(
              chat.conversations.championSelect.id,
              '[League Toolkit] 无可用英雄供自动选择',
              'celebration'
            ).catch()
          }
          return
        }

        const firstPickAction = s.actions.find((a) => a.type === 'pick')

        if (!firstPickAction) {
          return
        }

        try {
          await pickOrBan(
            currentPickActionChampion.value,
            settings.autoSelect.completed,
            'pick',
            firstPickAction.id
          )
        } catch (err) {
          notify.emit({
            id,
            content: `尝试自动选择英雄时失败，尝试选择 ${
              gameData.champions[currentPickActionChampion.value]?.name ||
              currentPickActionChampion.value
            }`,
            type: 'warning',
            extra: { error: err }
          })
        }
      } else if (s.actionType === 'ban') {
        if (!settings.autoSelect.banEnabled) {
          return
        }

        if (!cs.session) {
          return
        }

        const firstBanAction = s.actions.find((a) => a.type === 'ban')

        if (!firstBanAction) {
          return
        }

        const unbannableChampions = [
          ...cs.session.bans.myTeamBans,
          ...cs.session.bans.theirTeamBans
        ].reduce((prev, cur) => {
          if (cur) {
            prev.add(cur)
          }
          return prev
        }, new Set<number>())

        cs.session.actions.forEach((ar) =>
          ar.forEach((a) => {
            if (a.type === 'ban' && a.completed) {
              unbannableChampions.add(a.championId)
            }
          })
        )

        if (!settings.autoSelect.banTeammateIntendedChampion) {
          cs.session.myTeam.forEach((m) => {
            if (m.championPickIntent && m.summonerId !== summoner.currentSummoner!.summonerId) {
              unbannableChampions.add(m.championPickIntent)
            }
          })
        }

        const bannableChampions = settings.autoSelect.bannedChampions.filter(
          (c) => !unbannableChampions.has(c) && cs.currentBannableChampions.has(c)
        )

        if (bannableChampions.length === 0) {
          if (chat.conversations.championSelect) {
            chatSend(
              chat.conversations.championSelect.id,
              '[League Toolkit] 无可用英雄供自动禁用',
              'celebration'
            ).catch()
          }
          return
        }

        const candidate = settings.autoSelect.banRandomly
          ? bannableChampions[randomlyBanSeed % bannableChampions.length]
          : bannableChampions[0]

        try {
          await pickOrBan(candidate, true, 'ban', firstBanAction.id)
        } catch (err) {
          notify.emit({
            id,
            content: `尝试自动禁用英雄时失败，尝试禁用 ${
              gameData.champions[candidate]?.name || candidate
            }`,
            type: 'warning',
            extra: { error: err }
          })
        }
      }
    }
  )

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
        notifyInChat('cancel', targetingChampion)
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
          notifyInChat('select', targetingChampion, waitTime)
          grabTimer = window.setTimeout(trySwap, waitTime)
        }
        break
      }
    }
  })
}

function loadSettingsFromStorage() {
  const settings = useSettingsStore()

  settings.autoSelect.completed = getSetting('autoSelect.completed', false)
  settings.autoSelect.normalModeEnabled = getSetting('autoSelect.normalModeEnabled', false)
  settings.autoSelect.onlySimulMode = getSetting('autoSelect.onlySimulMode', true)
  settings.autoSelect.benchModeEnabled = getSetting('autoSelect.benchModeEnabled', false)
  settings.autoSelect.benchExpectedChampions = getSetting('autoSelect.benchExpectedChampions', [])
  settings.autoSelect.grabDelay = getSetting('autoSelect.grabDelay', 1)
  settings.autoSelect.banEnabled = getSetting('autoSelect.banEnabled', false)
  settings.autoSelect.banTeammateIntendedChampion = getSetting(
    'autoSelect.banTeammateIntendedChampion',
    false
  )
  settings.autoSelect.selectTeammateIntendedChampion = getSetting(
    'autoSelect.selectTeammateIntendedChampion',
    false
  )
  settings.autoSelect.selectRandomly = getSetting('autoSelect.selectRandomly', false)
  settings.autoSelect.banRandomly = getSetting('autoSelect.banRandomly', false)
  settings.autoSelect.showIntent = getSetting('autoSelect.showIntent', false)

  // migrate from previous version
  const formerExpected = getSetting('autoSelect.championId')
  if (formerExpected) {
    settings.autoSelect.expectedChampions = getSetting('autoSelect.expectedChampions', [
      formerExpected
    ])
    removeSetting('autoSelect.championId')
  } else {
    settings.autoSelect.expectedChampions = getSetting('autoSelect.expectedChampions', [])
  }

  const formerBanned = getSetting('autoSelect.banChampionId')
  if (formerBanned) {
    settings.autoSelect.bannedChampions = getSetting('autoSelect.bannedChampions', [formerBanned])
    removeSetting('autoSelect.banChampionId')
  } else {
    settings.autoSelect.bannedChampions = getSetting('autoSelect.bannedChampions', [])
  }
}

async function notifyInChat(type: 'cancel' | 'select', championId: number, time = 0) {
  const chat = useChatStore()
  const gameData = useGameDataStore()

  if (!chat.conversations.championSelect) {
    return
  }

  try {
    await chatSend(
      chat.conversations.championSelect.id,
      type === 'select'
        ? `[League Toolkit] - [自动选择]: 即将在 ${(time / 1000).toFixed(1)} 秒后选择 ${gameData.champions[championId]?.name || championId}`
        : `[League Toolkit] - [自动选择]: 已取消选择 ${gameData.champions[championId]?.name || championId}`,
      'celebration'
    )
  } catch {}
}

export function setNormalModeAutoSelectEnabled(enabled: boolean) {
  const settings = useSettingsStore()

  setSetting('autoSelect.normalModeEnabled', enabled)
  settings.autoSelect.normalModeEnabled = enabled
}

export function setBenchModeAutoSelectEnabled(enabled: boolean) {
  const settings = useSettingsStore()

  if (!enabled && grabTimer) {
    notifyInChat('cancel', targetingChampion!)
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

export function setNormalModeExpectedChampions(list: number[]) {
  const settings = useSettingsStore()

  setSetting('autoSelect.expectedChampions', list)
  settings.autoSelect.expectedChampions = list
}

export function setNormalModeBannedChampions(list: number[]) {
  const settings = useSettingsStore()

  setSetting('autoSelect.bannedChampions', list)
  settings.autoSelect.bannedChampions = list
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

export function setBanTeammateIntendedChampion(enabled: boolean) {
  const settings = useSettingsStore()

  setSetting('autoSelect.banTeammateIntendedChampion', enabled)
  settings.autoSelect.banTeammateIntendedChampion = enabled
}

export function setSelectTeammateIntendedChampion(enabled: boolean) {
  const settings = useSettingsStore()

  setSetting('autoSelect.selectTeammateIntendedChampion', enabled)
  settings.autoSelect.selectTeammateIntendedChampion = enabled
}

export function setSelectRandomly(enabled: boolean) {
  const settings = useSettingsStore()
  setSetting('autoSelect.selectRandomly', enabled)
  settings.autoSelect.selectRandomly = enabled
}
export function setBanRandomly(enabled: boolean) {
  const settings = useSettingsStore()
  setSetting('autoSelect.banRandomly', enabled)
  settings.autoSelect.banRandomly = enabled
}

export function setShowIntent(enabled: boolean) {
  const settings = useSettingsStore()
  setSetting('autoSelect.showIntent', enabled)
  settings.autoSelect.showIntent = enabled
}
