import BronzeMedal from '@renderer-shared/assets/ranked-icons/bronze.png'
import ChallengerMedal from '@renderer-shared/assets/ranked-icons/challenger.png'
import DiamondMedal from '@renderer-shared/assets/ranked-icons/diamond.png'
import EmeraldMedal from '@renderer-shared/assets/ranked-icons/emerald.png'
import GoldMedal from '@renderer-shared/assets/ranked-icons/gold.png'
import GrandmasterMedal from '@renderer-shared/assets/ranked-icons/grandmaster.png'
import IronMedal from '@renderer-shared/assets/ranked-icons/iron.png'
import MasterMedal from '@renderer-shared/assets/ranked-icons/master.png'
import PlatinumMedal from '@renderer-shared/assets/ranked-icons/platinum.png'
import SilverMedal from '@renderer-shared/assets/ranked-icons/silver.png'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { computed } from 'vue'

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
  D: { foregroundColor: '#2eda3e', color: '#000', borderColor: '#2eda3ed0' },
  E: { foregroundColor: '#ff9f1c', color: '#000', borderColor: '#ff9f1cd0' },
  F: { foregroundColor: '#da4e2e', color: '#fff', borderColor: '#da4e2ed0' },
  G: { foregroundColor: '#bc2ebc', color: '#fff', borderColor: '#bc2ebcd0' },
  H: { foregroundColor: '#fa4e80', color: '#000', borderColor: '#fa4e80d0' },
  I: { foregroundColor: '#0B3D91', color: '#fff', borderColor: '#0B3D91d0' },
  J: { foregroundColor: '#7F0000', color: '#fff', borderColor: '#7F0000d0' },
  K: { foregroundColor: '#8B4513', color: '#fff', borderColor: '#8B4513d0' },
  L: { foregroundColor: '#555555', color: '#fff', borderColor: '#555555d0' }
}

export const FIXED_CARD_WIDTH_PX_LITERAL = '240px'
export const FIXED_CARD_WIDTH_PX_NUMBER = 240
