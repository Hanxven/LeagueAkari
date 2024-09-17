import { useLcuConnectionStore } from '@renderer-shared/modules/lcu-connection/store'
import { useChampSelectStore } from '@renderer-shared/modules/lcu-state-sync/champ-select'
import { useGameDataStore } from '@renderer-shared/modules/lcu-state-sync/game-data'
import { useGameflowStore } from '@renderer-shared/modules/lcu-state-sync/gameflow'
import { InjectionKey, computed } from 'vue'

import BronzeMedal from '@main-window/assets/ranked-icons/bronze.png'
import ChallengerMedal from '@main-window/assets/ranked-icons/challenger.png'
import DiamondMedal from '@main-window/assets/ranked-icons/diamond.png'
import EmeraldMedal from '@main-window/assets/ranked-icons/emerald.png'
import GoldMedal from '@main-window/assets/ranked-icons/gold.png'
import GrandmasterMedal from '@main-window/assets/ranked-icons/grandmaster.png'
import IronMedal from '@main-window/assets/ranked-icons/iron.png'
import MasterMedal from '@main-window/assets/ranked-icons/master.png'
import PlatinumMedal from '@main-window/assets/ranked-icons/platinum.png'
import SilverMedal from '@main-window/assets/ranked-icons/silver.png'

export const RANKED_MEDAL_MAP: Record<string, string> = {
  IRON: IronMedal,
  BRONZE: BronzeMedal,
  SILVER: SilverMedal,
  GOLD: GoldMedal,
  PLATINUM: PlatinumMedal,
  EMERALD: EmeraldMedal,
  DIAMOND: DiamondMedal,
  MASTER: MasterMedal,
  GRANDMASTER: GrandmasterMedal,
  CHALLENGER: ChallengerMedal
}

export const POSITION_ASSIGNMENT_REASON = {
  FILL_SECONDARY: {
    name: '副选补位',
    color: '#82613b',
    foregroundColor: '#ffffff'
  },
  FILL_PRIMARY: {
    name: '主选补位',
    color: '#5b4694',
    foregroundColor: '#ffffff'
  },
  PRIMARY: {
    name: '主选',
    color: '#5b4694',
    foregroundColor: '#ffffff'
  },
  SECONDARY: {
    name: '副选',
    color: '#5b4694',
    foregroundColor: '#ffffff'
  },
  AUTOFILL: {
    name: '系统补位',
    color: '#944646',
    foregroundColor: '#ffffff'
  }
}

export function useQueueOptions() {
  const gameData = useGameDataStore()

  return computed(() => {
    return [
      {
        label: '优先当前队列',
        value: -1
      },
      {
        label: '全部队列',
        value: -2
      },
      {
        label: gameData.queues[420]?.name || 'Ranked Solo/Duo',
        value: 420
      },
      {
        label: gameData.queues[430]?.name || 'Normal',
        value: 430
      },
      {
        label: gameData.queues[440]?.name || 'Ranked Flex',
        value: 440
      },
      {
        label: gameData.queues[450]?.name || 'ARAM',
        value: 450
      },

      {
        label: gameData.queues[1700]?.name || 'ARENA',
        value: 1700
      },
      {
        label: gameData.queues[490]?.name || 'Quickplay',
        value: 490
      },
      {
        label: gameData.queues[1900]?.name || 'URF',
        value: 1900
      },
      {
        label: gameData.queues[900]?.name || 'ARURF',
        value: 900
      }
    ]
  })
}

export function useOrderOptions() {
  return [
    {
      label: '默认',
      value: 'default'
    },
    {
      label: '胜率',
      value: 'win-rate'
    },
    {
      label: 'KDA',
      value: 'kda'
    },
    {
      label: 'Akari 😼',
      value: 'akari-score'
    }
  ]
}

export function useIdleState() {
  const gameflow = useGameflowStore()
  const champSelect = useChampSelectStore()
  const lc = useLcuConnectionStore()

  return computed(() => {
    return (
      gameflow.phase === 'Lobby' ||
      gameflow.phase === 'None' ||
      gameflow.phase === 'Matchmaking' ||
      gameflow.phase === 'ReadyCheck' ||
      gameflow.phase === 'WatchInProgress' ||
      (gameflow.phase !== 'InProgress' &&
        champSelect.session &&
        champSelect.session.isSpectating) ||
      lc.state !== 'connected'
    )
  })
}

export interface TeamMeta {
  name: string
  side: number // 100 和 200 代表红色方和蓝色方, -1 代表未知
}

export const TEAM_NAMES: Record<string, TeamMeta> = {
  '100': {
    name: '蓝色方',
    side: 100
  },
  '200': {
    name: '红色方',
    side: 200
  },
  our: {
    name: '我方',
    side: -1
  },
  their: {
    name: '敌方',
    side: -1
  },
  'our-1': {
    name: '我方 (蓝色方)',
    side: 100
  },
  'our-2': {
    name: '我方 (红色方)',
    side: 200
  },
  'their-1': {
    name: '敌方 (蓝色方)',
    side: 100
  },
  'their-2': {
    name: '敌方 (红色方)',
    side: 200
  }
}

export const CHINESE_NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
export const ENGLISH_NUMBERS = [
  '1st',
  '2nd',
  '3rd',
  '4th',
  '5th',
  '6th',
  '7th',
  '8th',
  '9th',
  '10th'
]

export const POSITION_NAMES = {
  AUTOFILL: '无',
  FILL_PRIMARY: '主选补位',
  FILL_SECONDARY: '副选补位',
  FILL: '补位',
  UNSELECTED: '未选择',
  BOTTOM: '下路',
  JUNGLE: '打野',
  MIDDLE: '中路',
  UTILITY: '辅助'
}

export const PRE_MADE_TEAMS = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z'
]

export const PRE_MADE_TEAM_COLORS = {
  A: { foregroundColor: '#da2e80', color: '#fff' },
  B: { foregroundColor: '#17d628', color: '#000' },
  C: { foregroundColor: '#628aff', color: '#000' },
  D: { foregroundColor: '#17c1d6', color: '#000' },
  E: { foregroundColor: '#d4de17', color: '#000' },
  F: { foregroundColor: '#b517b5', color: '#ff' },
  G: { foregroundColor: '#48e5db', color: '#000' },
  H: { foregroundColor: '#d63a17', color: '#fff' }
}

export const FIXED_CARD_WIDTH = '240px'

export const ONGOING_GAME_COMP_K = Symbol('AKARI_OGC_IJK') as InjectionKey<any>
