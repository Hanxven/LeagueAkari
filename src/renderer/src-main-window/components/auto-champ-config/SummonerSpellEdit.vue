<template>
  <div class="summoner-spells">
    <NPopover trigger="click" v-model:show="popover1Show">
      <template #trigger>
        <LcuImage
          class="icon"
          :src="
            modelData.spell1Id
              ? lcs.gameData.summonerSpells[modelData.spell1Id]?.iconPath
              : undefined
          "
        />
      </template>
      <div class="selectable-spells">
        <SummonerSpellDisplay
          :keep-alive-on-hover="false"
          :size="32"
          :delay="1000"
          v-for="s of availableSpells"
          :spell-id="s.id"
          @click="handle1Click(s.id)"
        />
      </div>
    </NPopover>
    <NPopover trigger="click" v-model:show="popover2Show">
      <template #trigger>
        <LcuImage
          class="icon"
          :src="
            modelData.spell2Id
              ? lcs.gameData.summonerSpells[modelData.spell2Id]?.iconPath
              : undefined
          "
        />
      </template>
      <div class="selectable-spells">
        <SummonerSpellDisplay
          :keep-alive-on-hover="false"
          :size="32"
          :delay="1000"
          v-for="s of availableSpells"
          :spell-id="s.id"
          @click="handle2Click(s.id)"
        />
      </div>
    </NPopover>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import SummonerSpellDisplay from '@renderer-shared/components/widgets/SummonerSpellDisplay.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { SummonerSpell } from '@shared/types/league-client/game-data'
import { NPopover } from 'naive-ui'
import { computed, ref, watch } from 'vue'

const lcs = useLeagueClientStore()

const modelData = defineModel<{
  spell1Id?: number
  spell2Id?: number
}>('spell-ids', {
  default: () => ({})
})

const emits = defineEmits<{
  validated: [isValid: boolean]
}>()

const props = defineProps<{
  gameMode?: string
}>()

const popover1Show = ref(false)
const popover2Show = ref(false)

const handle1Click = (id: number) => {
  modelData.value = { ...modelData.value, spell1Id: id }

  if (id === modelData.value.spell2Id) {
    modelData.value = {
      spell1Id: modelData.value.spell2Id,
      spell2Id: modelData.value.spell1Id
    }
  }

  popover1Show.value = false
}

const handle2Click = (id: number) => {
  modelData.value = { ...modelData.value, spell2Id: id }

  if (id === modelData.value.spell1Id) {
    modelData.value = {
      spell1Id: modelData.value.spell2Id,
      spell2Id: modelData.value.spell1Id
    }
  }

  popover2Show.value = false
}

const availableSpells = computed(() => {
  const spells: SummonerSpell[] = []
  for (const spell of Object.values(lcs.gameData.summonerSpells)) {
    if (props.gameMode) {
      if (spell.gameModes.includes(props.gameMode)) {
        spells.push(spell)
      }
    } else {
      spells.push(spell)
    }
  }

  return spells
})

// 填充或修正为可用的召唤师技能
watch(
  () => availableSpells.value,
  (spells) => {
    if (modelData.value.spell1Id && !spells.find((s) => s.id === modelData.value.spell1Id)) {
      modelData.value = { ...modelData.value, spell1Id: undefined }
    }

    if (modelData.value.spell2Id && !spells.find((s) => s.id === modelData.value.spell2Id)) {
      modelData.value = { ...modelData.value, spell2Id: undefined }
    }

    if (!modelData.value.spell1Id && spells[0]) {
      modelData.value = { ...modelData.value, spell1Id: spells[0].id }
    }

    if (!modelData.value.spell2Id && spells[1]) {
      modelData.value = { ...modelData.value, spell2Id: spells[1].id }
    }
  },
  { immediate: true }
)

watch(
  [() => modelData.value, () => availableSpells.value],
  ([value, list]) => {
    // 验证是否正确，即两个是否都在可用技能列表中，如果不是，替换成两个可用的
    const isSpell1Valid = list.find((s) => s.id === value.spell1Id)
    const isSpell2Valid = list.find((s) => s.id === value.spell2Id)

    if (isSpell1Valid && isSpell2Valid) {
      return
    }

    let modifiedSpell1Id = value.spell1Id
    let modifiedSpell2Id = value.spell2Id

    if (!isSpell1Valid) {
      const newSpell1 = list.find((s) => s.id !== modifiedSpell2Id)
      modifiedSpell1Id = newSpell1?.id
    }

    if (!isSpell2Valid) {
      const newSpell2 = list.find((s) => s.id !== modifiedSpell1Id)
      modifiedSpell2Id = newSpell2?.id
    }

    modelData.value = {
      spell1Id: modifiedSpell1Id,
      spell2Id: modifiedSpell2Id
    }
  },
  { immediate: true }
)

const isValidated = computed(() => {
  return Boolean(
    availableSpells.value.find((s) => s.id === modelData.value.spell1Id) &&
      availableSpells.value.find((s) => s.id === modelData.value.spell2Id)
  )
})

watch(
  () => isValidated.value,
  (isValid) => {
    emits('validated', isValid)
  },
  { immediate: true }
)
</script>

<style scoped lang="less">
.summoner-spells {
  display: flex;
  gap: 8px;
}

.icon {
  border-radius: 2px;
  cursor: pointer;
  width: 28px;
  height: 28px;
}

.selectable-spells {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}
</style>
