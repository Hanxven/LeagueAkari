<template>
  <div class="main-body" v-if="isApplicableSchemaVersion">
    <div class="primary">
      <div class="header-styles">
        <PerkstyleSvgIcon
          v-for="style of lcs.gameData.perkstyles.styles"
          :size="28"
          :key="style.id"
          :perkstyle-id="style.id"
          :selected="style.id === primaryStyleId"
          @item-click="(id) => (primaryStyleId = id)"
        />
      </div>
      <template v-if="primaryStyle">
        <div class="slots key" v-for="slot of primaryStyle.keyStone">
          <PerkIcon
            v-for="perk of slot.perks"
            :size="36"
            :perk-id="perk"
            :key="perk"
            :selected="primarySelections[slot.slotId] === perk"
            :darken="
              primarySelections[slot.slotId] !== undefined &&
              primarySelections[slot.slotId] !== perk
            "
            @item-click="(perk) => handleSelectPrimaryPerk(slot.slotId, perk)"
          />
        </div>
        <div class="slots" v-for="slot of primaryStyle.regular">
          <PerkIcon
            v-for="perk of slot.perks"
            :size="32"
            :perk-id="perk"
            :key="perk"
            :selected="primarySelections[slot.slotId] === perk"
            :darken="
              primarySelections[slot.slotId] !== undefined &&
              primarySelections[slot.slotId] !== perk
            "
            @item-click="(perk) => handleSelectPrimaryPerk(slot.slotId, perk)"
          />
        </div>
      </template>
    </div>
    <div class="divider"></div>
    <div class="right-side-column">
      <div class="header-styles" v-if="primaryStyle">
        <PerkstyleSvgIcon
          v-for="styleId of primaryStyle.style.allowedSubStyles"
          :size="28"
          :key="styleId"
          :perkstyle-id="styleId"
          :selected="styleId === subStyleId"
          @item-click="(id) => (subStyleId = id)"
        />
      </div>
      <div class="sub">
        <template v-if="subStyle">
          <div class="slots" v-for="slot of subStyle.regular">
            <PerkIcon
              v-for="perk of slot.perks"
              :size="32"
              :perk-id="perk"
              :key="perk"
              :selected="subSelections[slot.slotId] === perk"
              :darken="
                (subSelections[slot.slotId] !== undefined && subSelections[slot.slotId] !== perk) ||
                (!subSelections[slot.slotId] && Object.keys(subSelections).length >= SUB_COUNT)
              "
              @item-click="(perk) => handleSelectSubPerk(slot.slotId, perk)"
            />
          </div>
        </template>
      </div>
      <div class="stat-mod">
        <template v-if="primaryStyle">
          <div class="slots sparse" v-for="slot of primaryStyle.statMod">
            <PerkIcon
              v-for="perk of slot.perks"
              :size="22"
              :perk-id="perk"
              :key="perk"
              :selected="primarySelections[slot.slotId] === perk"
              :darken="
                primarySelections[slot.slotId] !== undefined &&
                primarySelections[slot.slotId] !== perk
              "
              @item-click="(perk) => handleSelectPrimaryPerk(slot.slotId, perk)"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
  <div class="main-body" v-else>当前符文构型未支持</div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NModal } from 'naive-ui'
import { computed, onDeactivated, ref, watch } from 'vue'

import PerkIcon from './PerkIcon.vue'
import PerkstyleSvgIcon from './PerkstyleSvgIcon.vue'

defineProps<{
  disabled?: boolean
  targetId?: string
}>()

const { t } = useTranslation()

const lc = useInstance<LeagueClientRenderer>('league-client-renderer')

const lcs = useLeagueClientStore()
const isApplicableSchemaVersion = computed(() => {
  return lcs.gameData.perkstyles.schemaVersion === 2
})

const modelData = defineModel<
  | {
      primaryStyleId: number
      selectedPerkIds: number[]
      subStyleId: number
    }
  | null
  | undefined
>('page', {
  default: null
})

const show = defineModel<boolean>('show', { default: false })

const primaryStyleId = ref(0)
const subStyleId = ref(0)

const SUB_COUNT = 2

const extractStyle = (styleId: number) => {
  const style = lcs.gameData.perkstyles.styles[styleId]

  if (!style) {
    return null
  }

  const keyStone = style.slots
    .filter((s) => s.type === 'kKeyStone')
    .map((s, i) => ({ ...s, slotId: `${style.id}-${s.type}-${i}` }))
  const regular = style.slots
    .filter((s) => s.type === 'kMixedRegularSplashable')
    .map((s, i) => ({ ...s, slotId: `${style.id}-${s.type}-${i}` }))
  const statMod = style.slots
    .filter((s) => s.type === 'kStatMod')
    .map((s, i) => ({ ...s, slotId: `${style.id}-${s.type}-${i}` }))

  return {
    style,
    keyStone,
    regular,
    statMod,
    slots: style.slots
  }
}

// slotId, perkId
const primarySelections = ref<Record<string, number>>({})

const subSelections = ref<Record<string, number>>({})
const subSelectionQueue = ref<string[]>([])

const primaryStyle = computed(() => {
  return extractStyle(primaryStyleId.value)
})

const subStyle = computed(() => {
  return extractStyle(subStyleId.value)
})

watch(
  [() => primaryStyleId.value, () => Object.keys(lcs.gameData.perkstyles.styles).length],
  ([styleId, perkstylesReady]) => {
    if (!perkstylesReady) {
      return
    }

    if (styleId) {
      const style = lcs.gameData.perkstyles.styles[styleId]
      if (
        style &&
        style.allowedSubStyles.length &&
        !style.allowedSubStyles.includes(subStyleId.value)
      ) {
        subStyleId.value = style.allowedSubStyles[0]
        return
      }
    } else {
      const all = Object.values(lcs.gameData.perkstyles.styles)

      if (all.length) {
        primaryStyleId.value = all[0].id
      }
    }
  },
  { immediate: true }
)

watch(
  () => primaryStyle.value,
  (_style) => {
    primarySelections.value = {}
  }
)

watch(
  () => subStyle.value,
  (_style) => {
    subSelections.value = {}
    subSelectionQueue.value = []
  }
)

const testApply = async () => {
  const pages = (await lc.api.perks.getPerkPages()).data
  if (!pages.length) {
    return
  }

  const page1 = pages[0]
  await lc.api.perks.putPage({
    id: page1.id,
    isRecommendationOverride: false,
    isTemporary: false,
    name: `测试内容`,
    primaryStyleId: primaryStyleId.value,
    selectedPerkIds: selectedPerks.value,
    subStyleId: subStyleId.value
  })
  await lc.api.perks.putCurrentPage(page1.id)
}

// 细心活
const parsePageDataToSelection = (
  primaryStyleId: number,
  subStyleId: number,
  perkIds: number[]
) => {
  if (perkIds.length !== 9) {
    return null
  }

  const pStyle = extractStyle(primaryStyleId)
  const sStyle = extractStyle(subStyleId)

  if (!pStyle || !sStyle) {
    return null
  }

  const primaryKeyStone = perkIds.slice(0, 1)
  const primaryRegular = perkIds.slice(1, 4)
  const subRegular = perkIds.slice(4, 6)
  const primaryStatMod = perkIds.slice(6, 9)

  const primarySelections: Record<string, number> = {}
  const subSelections: Record<string, number> = {}

  pStyle.keyStone.forEach((slot, i) => {
    primarySelections[slot.slotId] = primaryKeyStone[i]
  })

  pStyle.regular.forEach((slot, i) => {
    primarySelections[slot.slotId] = primaryRegular[i]
  })

  const subPerkPosition: Record<number, string> = {}
  sStyle.regular.forEach((slot) => {
    slot.perks.forEach((perk) => {
      subPerkPosition[perk] = slot.slotId
    })
  })

  sStyle.regular.forEach((_, i) => {
    const perkId = subRegular[i]
    if (perkId) {
      subSelections[subPerkPosition[perkId]] = perkId
    }
  })

  pStyle.statMod.forEach((slot, i) => {
    primarySelections[slot.slotId] = primaryStatMod[i]
  })

  return {
    primarySelections,
    subSelections
  }
}

const handleSelectPrimaryPerk = (slotId: string, perkId: number) => {
  primarySelections.value[slotId] = perkId
}

const handleSelectSubPerk = (slotId: string, perkId: number) => {
  subSelections.value[slotId] = perkId

  if (!subSelectionQueue.value.includes(slotId)) {
    subSelectionQueue.value.push(slotId)
  }

  if (subSelectionQueue.value.length > SUB_COUNT) {
    const countNeedToDelete = subSelectionQueue.value.length - SUB_COUNT
    const deleted = subSelectionQueue.value.splice(0, countNeedToDelete)
    for (const slotId of deleted) {
      delete subSelections.value[slotId]
    }
  }
}

// 经过测试, 顺序必须是: 主系 key 1, 主系 regular 3, 副系 regular 2, 主系 statMod 3
const selectedPerks = computed(() => {
  if (!primaryStyle.value || !subStyle.value) {
    return []
  }

  const primaryKeyStone = primaryStyle.value.keyStone.map(
    (s) => primarySelections.value[s.slotId] || 0
  )

  const primaryRegular = primaryStyle.value.regular.map(
    (s) => primarySelections.value[s.slotId] || 0
  )

  const subRegular = subStyle.value.regular
    .filter((s) => subSelections.value[s.slotId])
    .map((s) => subSelections.value[s.slotId])

  while (subRegular.length < SUB_COUNT) {
    subRegular.push(0)
  }

  const primaryStatMod = primaryStyle.value.statMod.map(
    (s) => primarySelections.value[s.slotId] || 0
  )

  return [...primaryKeyStone, ...primaryRegular, ...subRegular, ...primaryStatMod]
})

const isValidPerks = computed(() => {
  if (!primaryStyle.value || !subStyle.value) {
    return false
  }

  // 和当前符文页相符
  const availablePerks = primaryStyle.value.slots
    .concat(subStyle.value.slots)
    .reduce((acc, slot) => acc.concat(slot.perks), [] as number[])

  // 主系选满
  if (primaryStyle.value) {
    const toCheck = primaryStyle.value.keyStone
      .concat(primaryStyle.value.regular)
      .concat(primaryStyle.value.statMod)

    for (const slot of toCheck) {
      if (
        primarySelections.value[slot.slotId] === undefined ||
        !availablePerks.includes(slot.perks[0])
      ) {
        return false
      }
    }
  }

  // 副系三选二
  if (subStyle.value) {
    const toCheck = subStyle.value.regular

    let slotSelected = 0
    for (const slot of toCheck) {
      if (subSelections.value[slot.slotId] && availablePerks.includes(slot.perks[0])) {
        slotSelected++
      }
    }

    if (slotSelected !== SUB_COUNT) {
      return false
    }
  }

  return true
})

const handleSubmit = async () => {
  if (!isValidPerks.value) {
    return
  }

  modelData.value = {
    primaryStyleId: primaryStyleId.value,
    subStyleId: subStyleId.value,
    selectedPerkIds: selectedPerks.value
  }
}

watch(
  () => modelData.value,
  (page) => {
    if (!page) {
      return
    }

    const parsed = parsePageDataToSelection(
      page.primaryStyleId,
      page.subStyleId,
      page.selectedPerkIds
    )

    if (parsed) {
      primarySelections.value = parsed.primarySelections
      subSelections.value = parsed.subSelections
    }
  }
)

const reset = () => {
  if (modelData.value) {
    const { primaryStyleId, subStyleId, selectedPerkIds } = modelData.value
    const parsed = parsePageDataToSelection(primaryStyleId, subStyleId, selectedPerkIds)

    if (parsed) {
      primarySelections.value = parsed.primarySelections
      subSelections.value = parsed.subSelections
    }
  } else {
    primarySelections.value = {}
    subSelections.value = {}
  }
}

defineExpose({
  reset
})

onDeactivated(() => {
  show.value = false
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
