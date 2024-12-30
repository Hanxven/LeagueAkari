import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { MaybeRefOrGetter, computed, toRef } from 'vue'

export function usePerkstyleInfo(styleId: MaybeRefOrGetter<number>) {
  const styleIdV = toRef(styleId)

  const lcs = useLeagueClientStore()

  const style = computed(() => {
    if (!lcs.gameData.perkstyles.styles[styleIdV.value]) {
      return null
    }

    return lcs.gameData.perkstyles.styles[styleIdV.value]
  })

  const keyStone = computed(() => {
    if (!style.value) {
      return []
    }

    return style.value.slots
      .filter((s) => s.type === 'kKeyStone')
      .map((s, i) => ({ ...s, slotId: `${style.value!.id}-${s.type}-${i}` }))
  })

  const regular = computed(() => {
    if (!style.value) {
      return []
    }

    return style.value.slots
      .filter((s) => s.type === 'kMixedRegularSplashable')
      .map((s, i) => ({ ...s, slotId: `${style.value!.id}-${s.type}-${i}` }))
  })

  const statMod = computed(() => {
    if (!style.value) {
      return []
    }

    return style.value.slots
      .filter((s) => s.type === 'kStatMod')
      .map((s, i) => ({ ...s, slotId: `${style.value!.id}-${s.type}-${i}` }))
  })

  return {
    style,
    keyStone,
    regular,
    statMod
  }
}

export function useRunesToSelections(
  runes: MaybeRefOrGetter<{
    primaryStyleId: number
    subStyleId: number
    selectedPerkIds: number[]
  }>
) {
  const runesV = toRef(runes)

  const {
    keyStone: pKeyStone,
    regular: pRegular,
    statMod: pStatMod
  } = usePerkstyleInfo(() => runesV.value.primaryStyleId)

  const { regular: sRegular } = usePerkstyleInfo(() => runesV.value.subStyleId)

  return computed(() => {
    if (runesV.value.selectedPerkIds.length !== 9) {
      return {
        primarySelections: {},
        subSelections: {}
      }
    }

    const primaryKeyStone = runesV.value.selectedPerkIds.slice(0, 1)
    const primaryRegular = runesV.value.selectedPerkIds.slice(1, 4)
    const subRegular = runesV.value.selectedPerkIds.slice(4, 6)
    const primaryStatMod = runesV.value.selectedPerkIds.slice(6, 9)

    const primarySelections: Record<string, number> = {}
    const subSelections: Record<string, number> = {}

    pKeyStone.value.forEach((slot, i) => {
      primarySelections[slot.slotId] = primaryKeyStone[i]
    })

    pRegular.value.forEach((slot, i) => {
      primarySelections[slot.slotId] = primaryRegular[i]
    })

    // 建立在副系符文中, 不存在重复的情况下
    const subPerkPosition: Record<number, string> = {}
    sRegular.value.forEach((slot) => {
      slot.perks.forEach((perk) => {
        subPerkPosition[perk] = slot.slotId
      })
    })

    sRegular.value.forEach((_, i) => {
      const perkId = subRegular[i]
      if (perkId) {
        subSelections[subPerkPosition[perkId]] = perkId
      }
    })

    pStatMod.value.forEach((slot, i) => {
      primarySelections[slot.slotId] = primaryStatMod[i]
    })

    return {
      primarySelections,
      subSelections
    }
  })
}

export function useValidatedRunes(
  runes: MaybeRefOrGetter<{
    primaryStyleId: number
    subStyleId: number
    selectedPerkIds: number[]
  }>
) {
  const runesV = toRef(runes)

  const {
    style: pStyle,
    keyStone: pKeyStone,
    regular: pRegular,
    statMod: pStatMod
  } = usePerkstyleInfo(() => runesV.value.primaryStyleId)

  const { style: sStyle, regular: sRegular } = usePerkstyleInfo(() => runesV.value.subStyleId)

  return computed(() => {
    if (runesV.value.selectedPerkIds.length !== 9) {
      return false
    }

    if (!pStyle.value || !sStyle.value) {
      return false
    }

    const parsed = useRunesToSelections(runes)

    if (!parsed) {
      return false
    }

    const availablePerks = pStyle.value.slots
      .concat(sStyle.value.slots)
      .reduce((acc, slot) => acc.concat(slot.perks), [] as number[])

    // 主系选满
    if (pStyle) {
      const toCheck = pKeyStone.value.concat(pRegular.value).concat(pStatMod.value)

      for (const slot of toCheck) {
        if (
          parsed.value.primarySelections[slot.slotId] === undefined ||
          parsed.value.primarySelections[slot.slotId] === 0 ||
          !availablePerks.includes(slot.perks[0])
        ) {
          return false
        }
      }
    }

    // 副系三选二
    if (sStyle) {
      const toCheck = sRegular.value

      let slotSelected = 0
      for (const slot of toCheck) {
        if (parsed.value.subSelections[slot.slotId] && availablePerks.includes(slot.perks[0])) {
          slotSelected++
        }
      }

      if (slotSelected !== 2) {
        return false
      }
    }

    return true
  })
}
