import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { computed } from 'vue'

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

export function useIdleState() {
  const lc = useLeagueClientStore()

  return computed(() => {
    return (
      lc.gameflow.phase === 'Lobby' ||
      lc.gameflow.phase === 'None' ||
      lc.gameflow.phase === 'Matchmaking' ||
      lc.gameflow.phase === 'ReadyCheck' ||
      lc.gameflow.phase === 'WatchInProgress' ||
      (lc.gameflow.phase !== 'InProgress' &&
        lc.champSelect.session &&
        lc.champSelect.session.isSpectating) ||
      lc.connectionState !== 'connected'
    )
  })
}

export interface TeamMeta {
  name: string
}

export const CHINESE_NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

export const PREMADE_TEAMS = [
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

export const PREMADE_TEAM_COLORS = {
  A: { foregroundColor: '#48e5db', color: '#000', borderColor: '#48e5dbd0' },
  B: { foregroundColor: '#628aff', color: '#000', borderColor: '#628affd0' },
  C: { foregroundColor: '#d4de17', color: '#000', borderColor: '#d4de17d0' },
  D: { foregroundColor: '#17d628', color: '#000', borderColor: '#17d628d0' },
  E: { foregroundColor: '#17c1d6', color: '#000', borderColor: '#17c1d6d0' },
  F: { foregroundColor: '#d63a17', color: '#fff', borderColor: '#d63a17d0' },
  G: { foregroundColor: '#b517b5', color: '#fff', borderColor: '#b517b5d0' },
  H: { foregroundColor: '#fa4e80', color: '#fff', borderColor: '#fa4e80d0' }
}

export const FIXED_CARD_WIDTH_PX_LITERAL = '240px'
