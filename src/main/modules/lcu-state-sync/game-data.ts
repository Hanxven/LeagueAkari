import { lcuConnectionState } from '@main/modules/akari-core/lcu-connection'
import { mwNotification } from '@main/modules/akari-core/main-window'
import {
  getAugments,
  getChampionSummary,
  getItems,
  getPerks,
  getPerkstyles,
  getQueues,
  getSummonerSpells
} from '@main/http-api/game-data'
import { ipcStateSync } from '@main/utils/ipc'
import {
  Augment,
  ChampionSimple,
  Item,
  Perk,
  Perkstyles,
  Queue,
  SummonerSpell
} from '@shared/types/lcu/game-data'
import { formatError } from '@shared/utils/errors'
import { reaction } from 'mobx'
import { makeAutoObservable, observable } from 'mobx'
import PQueue from 'p-queue'

import { logger } from './common'

class GameDataState {
  summonerSpells: Record<number | string, SummonerSpell> = {}
  items: Record<number | string, Item> = {}
  queues: Record<number | string, Queue> = {}
  perks: Record<number | string, Perk> = {}
  perkstyles: Record<number | string, Perkstyles['styles'][number]> = {}
  augments: Record<number | string, Augment> = {}
  champions: Record<number | string, ChampionSimple> = {}

  constructor() {
    makeAutoObservable(this, {
      summonerSpells: observable.ref,
      augments: observable.ref,
      champions: observable.ref,
      items: observable.ref,
      perks: observable.ref,
      perkstyles: observable.ref,
      queues: observable.ref
    })
  }

  setSummonerSpells(value: Record<number | string, SummonerSpell>) {
    this.summonerSpells = value
  }

  setItems(value: Record<number | string, Item>) {
    this.items = value
  }

  setQueues(value: Record<number | string, Queue>) {
    this.queues = value
  }

  setPerks(value: Record<number | string, Perk>) {
    this.perks = value
  }

  setPerkStyles(value: Record<number | string, Perkstyles['styles'][number]>) {
    this.perkstyles = value
  }

  setAugments(value: Record<number | string, Augment>) {
    this.augments = value
  }

  setChampions(value: Record<number | string, ChampionSimple>) {
    this.champions = value
  }
}

export const gameData = new GameDataState()

const limiter = new PQueue({
  concurrency: 3
})

async function loadSummonerSpells() {
  try {
    const spells = (await getSummonerSpells()).data
    gameData.setSummonerSpells(
      spells.reduce((prev, cur) => {
        prev[cur.id] = cur
        return prev
      }, {})
    )
  } catch (error) {
    mwNotification.warn('lcu-state-sync', '状态同步', '获取召唤师技能失败')
    logger.warn(`获取召唤师技能失败 ${formatError(error)}`)
  }
}

async function loadItems() {
  try {
    const items = (await getItems()).data
    gameData.setItems(
      items.reduce((prev, cur) => {
        prev[cur.id] = cur
        return prev
      }, {})
    )
  } catch (error) {
    mwNotification.warn('lcu-state-sync', '状态同步', '获取装备列表失败')
    logger.warn(`获取装备列表失败 ${formatError(error)}`)
  }
}

async function loadQueues() {
  try {
    const queues = (await getQueues()).data
    gameData.setQueues(queues)
  } catch (error) {
    mwNotification.warn('lcu-state-sync', '状态同步', '获取可用队列失败')
    logger.warn(`获取可用队列失败 ${formatError(error)}`)
  }
}

async function loadPerks() {
  try {
    const perks = (await getPerks()).data
    gameData.setPerks(
      perks.reduce((prev, cur) => {
        prev[cur.id] = cur
        return prev
      }, {})
    )
  } catch (error) {
    mwNotification.warn('lcu-state-sync', '状态同步', '获取 perks 失败')
    logger.warn(`获取 perks 失败 ${formatError(error)}`)
  }
}

async function loadPerkstyles() {
  try {
    const perkstyles = (await getPerkstyles()).data
    gameData.setPerkStyles(
      perkstyles.styles.reduce((prev, cur) => {
        prev[cur.id] = cur
        return prev
      }, {})
    )
  } catch (error) {
    mwNotification.warn('lcu-state-sync', '状态同步', '获取 perkstyles 失败')
    logger.warn(`获取 perkstyles 失败 ${formatError(error)}`)
  }
}

async function loadAugments() {
  try {
    const augments = (await getAugments()).data
    gameData.setAugments(
      augments.reduce((prev, cur) => {
        prev[cur.id] = cur
        return prev
      }, {})
    )
  } catch (error) {
    mwNotification.warn('lcu-state-sync', '状态同步', '获取 augments 失败')
    logger.warn(`获取 augments 失败 ${formatError(error)}`)
  }
}

async function loadChampions() {
  try {
    const champions = (await getChampionSummary()).data
    gameData.setChampions(
      champions.reduce((prev, cur) => {
        prev[cur.id] = cur
        return prev
      }, {})
    )
  } catch (error) {
    mwNotification.warn('lcu-state-sync', '状态同步', '获取英雄列表失败')
    logger.warn(`获取英雄列表失败 ${formatError(error)}`)
  }
}

export function gameDataSync() {
  ipcStateSync('lcu/game-data/augments', () => gameData.augments)
  ipcStateSync('lcu/game-data/champions', () => gameData.champions)
  ipcStateSync('lcu/game-data/items', () => gameData.items)
  ipcStateSync('lcu/game-data/perks', () => gameData.perks)
  ipcStateSync('lcu/game-data/perkstyles', () => gameData.perkstyles)
  ipcStateSync('lcu/game-data/queues', () => gameData.queues)
  ipcStateSync('lcu/game-data/summoner-spells', () => gameData.summonerSpells)

  reaction(
    () => lcuConnectionState.state,
    (state) => {
      if (state === 'connected') {
        limiter.add(loadSummonerSpells)
        limiter.add(loadItems)
        limiter.add(loadQueues)
        limiter.add(loadPerks)
        limiter.add(loadPerkstyles)
        limiter.add(loadAugments)
        limiter.add(loadChampions)
      }
    }
  )
}
