<template>
  <div class="main-body" v-if="isApplicableSchemaVersion">
    <div class="primary">
      <div class="header-styles">
        <PerkstyleSvgIcon
          v-for="style of lcs.gameData.perkstyles.styles"
          :size="28"
          :key="style.id"
          :perkstyle-id="style.id"
          :selected="style.id === page.primaryStyleId"
          @item-click="(id) => handleSelectPrimaryStyle(id)"
        />
      </div>
      <template v-if="pStyle">
        <div class="slots key" v-for="slot of pKeyStone">
          <PerkIcon
            v-for="perk of slot.perks"
            :size="36"
            :perk-id="perk"
            :key="perk"
            :selected="selections !== null && selections.primarySelections[slot.slotId] === perk"
            :darken="
              selections !== null &&
              slot.perks.includes(selections.primarySelections[slot.slotId]) &&
              selections.primarySelections[slot.slotId] !== 0 &&
              selections.primarySelections[slot.slotId] !== undefined &&
              selections.primarySelections[slot.slotId] !== perk
            "
            @item-click="(perk) => handleSelectPrimaryPerk(slot.slotId, perk)"
          />
        </div>
        <div class="slots" v-for="slot of pRegular">
          <PerkIcon
            v-for="perk of slot.perks"
            :size="32"
            :perk-id="perk"
            :key="perk"
            :selected="selections !== null && selections.primarySelections[slot.slotId] === perk"
            :darken="
              selections !== null &&
              slot.perks.includes(selections.primarySelections[slot.slotId]) &&
              selections.primarySelections[slot.slotId] !== 0 &&
              selections.primarySelections[slot.slotId] !== undefined &&
              selections.primarySelections[slot.slotId] !== perk
            "
            @item-click="(perk) => handleSelectPrimaryPerk(slot.slotId, perk)"
          />
        </div>
      </template>
    </div>
    <div class="divider"></div>
    <div class="right-side-column">
      <div class="header-styles" v-if="pStyle">
        <PerkstyleSvgIcon
          v-for="styleId of pStyle.allowedSubStyles"
          :size="28"
          :key="styleId"
          :perkstyle-id="styleId"
          :selected="styleId === page.subStyleId"
          @item-click="(id) => handleSelectSubStyle(id)"
        />
      </div>
      <div class="sub">
        <template v-if="sStyle">
          <div class="slots" v-for="slot of sRegular">
            <PerkIcon
              v-for="perk of slot.perks"
              :size="32"
              :perk-id="perk"
              :key="perk"
              :selected="selections !== null && selections.subSelections[slot.slotId] === perk"
              :darken="
                selections !== null &&
                selections.subSelections[slot.slotId] !== 0 &&
                (selections.subSelections[slot.slotId] !== undefined || subPerksSelectedTwo) &&
                selections.subSelections[slot.slotId] !== perk
              "
              @item-click="(perk) => handleSelectSubPerk(slot.slotId, perk)"
            />
          </div>
        </template>
      </div>
      <div class="stat-mod">
        <template v-if="pStyle">
          <div class="slots sparse" v-for="slot of pStatMod">
            <PerkIcon
              v-for="perk of slot.perks"
              :size="22"
              :perk-id="perk"
              :key="perk"
              :selected="selections !== null && selections.primarySelections[slot.slotId] === perk"
              :darken="
                selections !== null &&
                selections.primarySelections[slot.slotId] !== 0 &&
                selections.primarySelections[slot.slotId] !== undefined &&
                selections.primarySelections[slot.slotId] !== perk
              "
              @item-click="(perk) => handleSelectPrimaryPerk(slot.slotId, perk)"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
  <div class="main-body" v-else>{{ t('RuneEditV2.unsupported') }}</div>
</template>

<script setup lang="ts">
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import _ from 'lodash'
import { computed, watch } from 'vue'

import PerkIcon from './PerkIcon.vue'
import PerkstyleSvgIcon from './PerkstyleSvgIcon.vue'
import { usePerkstyleInfo, useRunesToSelections } from './utils'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const isApplicableSchemaVersion = computed(() => {
  return lcs.gameData.perkstyles.schemaVersion === 2
})

const page = defineModel<{
  primaryStyleId: number
  selectedPerkIds: number[]
  subStyleId: number
}>('page', {
  default: () => ({
    primaryStyleId: 0,
    subStyleId: 0,
    selectedPerkIds: []
  })
})

const selections = useRunesToSelections(() => page.value)

const {
  style: pStyle,
  keyStone: pKeyStone,
  regular: pRegular,
  statMod: pStatMod
} = usePerkstyleInfo(() => page.value.primaryStyleId)

const { style: sStyle, regular: sRegular } = usePerkstyleInfo(() => page.value.subStyleId)

const handleSelectPrimaryStyle = (styleId: number) => {
  const pStyle = lcs.gameData.perkstyles.styles[styleId]

  if (!pStyle) {
    return
  }

  const availableSubStyles = pStyle.allowedSubStyles

  const perkIds =
    page.value.selectedPerkIds.length !== 9 ? Array(9).fill(0) : [...page.value.selectedPerkIds]

  if (availableSubStyles.includes(page.value.subStyleId)) {
    page.value = {
      ...page.value,
      primaryStyleId: styleId,
      selectedPerkIds: perkIds
    }
  } else {
    page.value = {
      primaryStyleId: styleId,
      subStyleId: availableSubStyles[0],
      selectedPerkIds: perkIds
    }
  }
}

const handleSelectSubStyle = (styleId: number) => {
  const perkIds =
    page.value.selectedPerkIds.length !== 9 ? Array(9).fill(0) : [...page.value.selectedPerkIds]

  page.value = {
    ...page.value,
    subStyleId: styleId,
    selectedPerkIds: perkIds
  }
}

// 多余的纠正步骤: 如果当前的选择不在范围内, 则尝试一次自动纠正
watch(
  () => page.value,
  (page) => {
    const pStyle = lcs.gameData.perkstyles.styles[page.primaryStyleId]

    if (!pStyle) {
      const all = Object.values(lcs.gameData.perkstyles.styles)

      if (all.length) {
        handleSelectPrimaryStyle(all[0].id)
      }
    }
  },
  { immediate: true }
)

const handleSelectPrimaryPerk = (slotId: string, perkId: number) => {
  const allSlots = [...pKeyStone.value, ...pRegular.value, ...pStatMod.value]

  if (!allSlots.some((slot) => slot.slotId === slotId && slot.perks.includes(perkId))) {
    return
  }

  const map: Record<string, number> = {}
  pKeyStone.value.forEach((slot, i) => {
    map[slot.slotId] = i
  })

  pRegular.value.forEach((slot, i) => {
    map[slot.slotId] = i + 1
  })

  pStatMod.value.forEach((slot, i) => {
    map[slot.slotId] = i + 6
  })

  const slotIndex = map[slotId]
  if (slotIndex !== undefined) {
    if (page.value.selectedPerkIds[slotIndex] === perkId) {
      return
    }

    const perkIds =
      page.value.selectedPerkIds.length !== 9 ? Array(9).fill(0) : [...page.value.selectedPerkIds]

    perkIds[slotIndex] = perkId

    page.value = {
      ...page.value,
      selectedPerkIds: perkIds
    }
  }
}

// 记录了加载顺序的队列历史记录
const subPerkSlotHistory: Record<string, number> = {}
const handleSelectSubPerk = (slotId: string, perkId: number) => {
  if (!sRegular.value.some((slot) => slot.slotId === slotId && slot.perks.includes(perkId))) {
    return
  }

  const perkIds =
    page.value.selectedPerkIds.length !== 9 ? Array(9).fill(0) : [...page.value.selectedPerkIds]

  const sRegularPerkIds = perkIds.slice(4, 6)

  const perkRelativePosition: Record<number, number> = {}
  sRegular.value.forEach((slot, i) => {
    slot.perks.forEach((perk) => {
      perkRelativePosition[perk] = i
    })
  })

  const perkSlot: Record<number, string> = {}
  sRegular.value.forEach((slot) => {
    slot.perks.forEach((perk) => {
      perkSlot[perk] = slot.slotId
    })
  })

  const slotSelections: Record<string, number> = {}
  ;[...sRegularPerkIds, perkId].forEach((perkId) => {
    if (perkSlot[perkId]) {
      slotSelections[perkSlot[perkId]] = perkId
    }
  })

  // 如果 selection 数量超过 2，则移除最早的一个
  if (Object.keys(slotSelections).length > 2) {
    const sorted = Object.entries(subPerkSlotHistory).toSorted((a, b) => a[1] - b[1])

    const keyToDelete = sorted[0]?.[0] || Object.keys(slotSelections)[0]

    delete slotSelections[keyToDelete]
    delete subPerkSlotHistory[keyToDelete]
  }

  const toSortedPerkIds = Object.values(slotSelections).toSorted((a, b) => {
    return perkRelativePosition[a] - perkRelativePosition[b]
  })

  toSortedPerkIds.push(...Array(Math.max(0, 2 - toSortedPerkIds.length)).fill(0))

  if (_.isEqual(sRegularPerkIds, toSortedPerkIds)) {
    return
  }

  perkIds.splice(4, 2, ...toSortedPerkIds)

  subPerkSlotHistory[slotId] = Date.now()

  page.value = {
    ...page.value,
    selectedPerkIds: perkIds
  }
}

watch(
  () => sStyle.value,
  (style) => {
    if (style) {
      Object.keys(subPerkSlotHistory).forEach((key) => {
        delete subPerkSlotHistory[key]
      })

      const perkSlot: Record<number, string> = {}
      sRegular.value.forEach((slot) => {
        slot.perks.forEach((perk) => {
          perkSlot[perk] = slot.slotId
        })
      })

      const perkIds = page.value.selectedPerkIds.slice(4, 6)

      perkIds.forEach((perkId) => {
        if (perkSlot[perkId]) {
          subPerkSlotHistory[perkSlot[perkId]] = Date.now()
        }
      })
    }
  },
  {
    immediate: true
  }
)

const subPerksSelectedTwo = computed(() => {
  const perkIds = page.value.selectedPerkIds.slice(4, 6)
  let count = 0
  sRegular.value.forEach((slot) => {
    if (slot.perks.some((perk) => perkIds.includes(perk))) {
      count++
    }
  })

  return count >= 2
})
</script>

<style lang="less" scoped>
.rune-edit-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.main-body {
  display: flex;
  width: 440px;

  .header-styles {
    display: flex;
    margin-bottom: 16px;
    gap: 4px;
  }

  .slots {
    display: flex;
    gap: 8px;

    &.key {
      margin-bottom: 12px;
    }

    &.sparse {
      gap: 16px;
    }
  }

  .primary {
    display: flex;
    align-items: center;
    flex-direction: column;
    flex: 1;
    gap: 8px;
  }

  .right-side-column {
    display: flex;
    align-items: center;
    flex-direction: column;
    flex: 1;
    gap: 8px;

    .sub {
      display: flex;
      flex: 1;
      align-items: center;
      flex-direction: column;
      margin-bottom: 8px;
      gap: 8px;
    }

    .stat-mod {
      display: flex;
      flex: 1;
      align-items: center;
      flex-direction: column;
      gap: 4px;
    }
  }
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.divider {
  width: 1px;
  background-color: #ffffff10;
  margin: 0 16px;
}
</style>

<style lang="less" module>
.modal-content {
  width: fit-content;
}
</style>
