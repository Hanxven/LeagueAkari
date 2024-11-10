import { useExtraAssetsStore } from '@renderer-shared/shards/extra-assets/store'
import { MaybeRefOrGetter, computed, readonly, toRef } from 'vue'

const ADJUSTMENT_EFFECT = {
  'damage-dealt': 'buff',
  'damage-taken': 'nerf',
  shielding: 'buff',
  healing: 'buff',
  'ability-haste': 'buff',
  'attack-speed': 'buff',
  'energy-regen': 'buff',
  tenacity: 'buff',
  'movement-speed': 'buff',
  special: 'neutral'
}

const ADJUSTMENT_DISPLAY = {
  'damage-dealt': 'percentage',
  'damage-taken': 'percentage',
  shielding: 'percentage',
  healing: 'percentage',
  'ability-haste': 'literal',
  'attack-speed': 'percentage',
  'energy-regen': 'percentage',
  tenacity: 'percentage',
  'movement-speed': 'percentage',
  special: 'literal'
}

const FANDOM_TYPE_MAP = {
  dmg_dealt: 'damage-dealt',
  dmg_taken: 'damage-taken',
  shielding: 'shielding',
  healing: 'healing',
  ability_haste: 'ability-haste',
  attack_speed: 'attack-speed',
  energy_regen: 'energy-regen',
  tenacity: 'tenacity',
  movement_speed: 'movement-speed'
}

// for reference
export const ALL_MODES = [
  'ARAM',
  'ASCENSION',
  'CLASSIC',
  'FIRSTBLOOD',
  'KINGPORO',
  'ODIN',
  'ONEFORALL',
  'TUTORIAL',
  'TUTORIAL_MODULE_1',
  'TUTORIAL_MODULE_2',
  'TUTORIAL_MODULE_3',
  'SIEGE',
  'ASSASSINATE',
  'DARKSTAR',
  'ARSR',
  'URF',
  'DOOMBOTSTEEMO',
  'STARGUARDIAN',
  'STRAWBERRY',
  'PROJECT',
  'OVERCHARGE',
  'SNOWURF',
  'PRACTICETOOL',
  'NEXUSBLITZ',
  'ODYSSEY',
  'ULTBOOK',
  'CHERRY',
  'WIPMODEWIP'
] as const

const FANDOM_MODE_MAP = {
  ofa: 'ONEFORALL',
  urf: 'URF',
  usb: 'ULTBOOK',
  nb: 'NEXUSBLITZ',
  aram: 'ARAM',
  ar: 'CHERRY'
}
export interface BalanceAdjustment {
  /** 该增益 / 减益的类型 */
  type:
    | 'damage-dealt'
    | 'damage-taken'
    | 'shielding'
    | 'healing'
    | 'ability-haste'
    | 'attack-speed'
    | 'energy-regen'
    | 'mana-regen'
    | 'tenacity'
    | 'movement-speed'
    | 'special'

  /** 具体数值 */
  value: number

  display: 'percentage' | 'literal'

  /**
   * 效果类型
   * buff - percentage 下, 当大于 1 时表示增益, 小于 1 时表示减益; literal 下, 大于 0 表示增益, 小于 0 表示减益
   * nerf - percentage 下, 当大于 1 时表示减益, 小于 1 时表示增益; literal 下, 大于 0 表示减益, 小于 0 表示增益
   * neutral - 无法评判的变动效果
   */
  effectType: 'buff' | 'nerf' | 'neutral'

  /**
   * 具体效果
   */
  effect: 'buffed' | 'nerfed' | 'neutral'

  /** 额外说明 */
  description?: string
}

export interface ChampionModeBalance {
  overallEffect: 'buffed' | 'nerfed' | 'mixed' | 'neutral'
  adjustments: BalanceAdjustment[]
}

export interface ChampionBalance {
  id: number

  modes: Record<string, ChampionModeBalance>
}

/**
 * 组装英雄平衡性数据适配
 * @returns
 */
export function useChampionBalanceData(_source: MaybeRefOrGetter<string>) {
  const eas = useExtraAssetsStore()
  const source = toRef(_source)

  const data = computed(() => {
    if (!source.value) {
      return {}
    }

    if (source.value === 'fandom') {
      if (!eas.fandom.balance) {
        return {}
      }

      return Object.values(eas.fandom.balance).reduce(
        (acc, value) => {
          if (typeof value !== 'object' || value === null) {
            return acc
          }

          const id = Math.floor(value.id)
          const modeAdjustments = {
            id,
            modes: Object.entries(value.balance).reduce(
              (acc, [mode, balance]) => {
                const adjustments = Object.entries(balance).reduce((acc, [key, value]) => {
                  const type = FANDOM_TYPE_MAP[key]
                  const effectType = ADJUSTMENT_EFFECT[type]
                  const display = ADJUSTMENT_DISPLAY[type] || 'literal'

                  if (!type || !effectType || typeof value !== 'number') {
                    return acc
                  }

                  let effect: BalanceAdjustment['effect'] = 'neutral'
                  if (display === 'percentage') {
                    if (effectType === 'buff') {
                      effect = value > 1 ? 'buffed' : 'nerfed'
                    } else if (effectType === 'nerf') {
                      effect = value > 1 ? 'nerfed' : 'buffed'
                    }
                  } else {
                    if (effectType === 'buff') {
                      effect = value > 0 ? 'buffed' : 'nerfed'
                    } else if (effectType === 'nerf') {
                      effect = value > 0 ? 'nerfed' : 'buffed'
                    }
                  }

                  acc.push({ type, value, effectType, display, effect })

                  return acc
                }, [] as BalanceAdjustment[])

                if (adjustments.length) {
                  let nerfed = 0
                  let buffed = 0
                  let neutral = 0

                  for (const { effect } of adjustments) {
                    if (effect === 'nerfed') {
                      nerfed++
                    } else if (effect === 'buffed') {
                      buffed++
                    } else {
                      neutral++
                    }
                  }

                  let overallEffect: ChampionModeBalance['overallEffect'] = 'neutral'
                  if (nerfed && buffed) {
                    overallEffect = 'mixed'
                  } else if (nerfed) {
                    overallEffect = 'nerfed'
                  } else if (buffed) {
                    overallEffect = 'buffed'
                  }

                  acc[FANDOM_MODE_MAP[mode]] = { overallEffect, adjustments }
                }

                return acc
              },
              {} as Record<string, ChampionModeBalance>
            )
          }

          if (Object.keys(modeAdjustments.modes).length) {
            acc[id] = modeAdjustments
          }

          return acc
        },
        {} as Record<string, ChampionBalance>
      )
    }

    // implementing soon
    if (source.value === 'opgg') {
      return {}
    }

    return {}
  })

  return { data, source: readonly(source) }
}
