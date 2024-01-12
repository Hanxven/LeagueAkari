import { watch } from 'vue'

import { notify } from '@renderer/events/notifications'
import { benchSwap, getChampSelectSession, pickOrBan } from '@renderer/http-api/champ-select'
import { Action, ChampSelectSummoner } from '@renderer/types/champ-select'
import { getSetting, removeSetting, setSetting } from '@renderer/utils/storage'

import { useChampSelectStore } from './stores/lcu/champ-select'
import { useGameDataStore } from './stores/lcu/game-data'
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

  loadSettingsFromStorage()

  let isDoingPick = false
  let isDoingBan = false
  onLcuEvent<ChampSelectSummoner>('/lol-champ-select/v1/summoners/*', async (event) => {
    if (event.eventType === 'Delete') {
      return
    }

    if (!event.data.isSelf || !event.data.isActingNow) {
      return
    }

    if (!summoner.currentSummoner) {
      return
    }

    const session = (await getChampSelectSession()).data

    if (!session) {
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

        if (settings.autoSelect.onlySimulMode && !session.hasSimultaneousPicks) {
          return
        }

        if (isDoingPick) {
          return
        }

        // 客户端在英雄选择阶段，分为若干个 action 阶段
        // 比如竞技场中，有三个 action 阶段:
        // 分别是 ban 阶段 (10 名玩家各自有一个 ban 的 action)
        // pick 1 阶段 (奇数位置的玩家各自有一个 pick 的 action)
        // pick 2 阶段 (偶数位置的玩家各自有一个 pick 的 action)
        // 这样的流程，表现为一个 actions[][] 的数组
        const myInProgressActions = session.actions.reduce((p, c) => {
          const action = c.find((a) => a.actorCellId === event.data.cellId)
          if (action && action.isInProgress) {
            p.push(action)
          }
          return p
        }, [] as Action[])

        const firstPickAction = myInProgressActions.find((a) => a.type === 'pick')
        if (firstPickAction) {
          // 场上出现的英雄，不能选
          const unselectableChampions = [...session.myTeam, ...session.theirTeam].reduce(
            (prev, cur) => {
              if (cur.championId && cur.summonerId !== summoner.currentSummoner!.summonerId) {
                prev.add(cur.championId)
              }
              return prev
            },
            new Set<number>()
          )

          if (!settings.autoSelect.selectTeammateIntendedChampion) {
            session.myTeam.forEach((m) => {
              if (m.championPickIntent && m.summonerId !== summoner.currentSummoner!.summonerId) {
                unselectableChampions.add(m.championPickIntent)
              }
            })
          }

          // ban 位出现的英雄也不能选
          ;[...session.bans.myTeamBans, ...session.bans.theirTeamBans].forEach((c) =>
            unselectableChampions.add(c)
          )

          const pickableChampions = settings.autoSelect.expectedChampions.filter(
            (c) => !unselectableChampions.has(c) && cs.currentPickableChampions.has(c)
          )

          if (pickableChampions.length === 0) {
            return
          }

          const candidate = settings.autoSelect.selectRandomly
            ? pickableChampions[Math.floor(Math.random() * pickableChampions.length)]
            : pickableChampions[0]

          isDoingPick = true
          try {
            await pickOrBan(candidate, settings.autoSelect.completed, 'pick', firstPickAction.id)
          } catch (err) {
            notify.emit({
              id,
              content: `尝试自动选择英雄时失败，尝试选择 ${
                gameData.champions[candidate]?.name || candidate
              }`,
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

        if (isDoingBan) {
          return
        }

        const myInProgressActions = session.actions.reduce((p, c) => {
          const action = c.find((a) => a.actorCellId === event.data.cellId)
          if (action && action.isInProgress) {
            p.push(action)
          }
          return p
        }, [] as Action[])

        const firstBanAction = myInProgressActions.find((a) => a.type === 'ban')
        if (firstBanAction) {
          const unbannableChampions = [
            ...session.bans.myTeamBans,
            ...session.bans.theirTeamBans
          ].reduce((prev, cur) => {
            if (cur) {
              prev.add(cur)
            }
            return prev
          }, new Set<number>())

          if (!settings.autoSelect.banTeammateIntendedChampion) {
            session.myTeam.forEach((m) => {
              if (m.championPickIntent && m.summonerId !== summoner.currentSummoner!.summonerId) {
                unbannableChampions.add(m.championPickIntent)
              }
            })
          }

          const bannableChampions = settings.autoSelect.bannedChampions.filter(
            (c) => !unbannableChampions.has(c) && cs.currentBannableChampions.has(c)
          )

          if (bannableChampions.length === 0) {
            return
          }

          const candidate = settings.autoSelect.banRandomly
            ? bannableChampions[Math.floor(Math.random() * bannableChampions.length)]
            : bannableChampions[0]

          isDoingBan = true
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
