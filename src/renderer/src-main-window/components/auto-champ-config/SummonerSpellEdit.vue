<template>
  <div class="summoner-spells">
    <NPopover trigger="click" v-model:show="popover1Show">
      <template #trigger>
        <LcuImage class="icon" :src="lcs.gameData.summonerSpells[modelData.spell1Id]?.iconPath" />
      </template>
      <div class="selectable-spells">
        <SummonerSpellDisplay
          :size="32"
          v-for="s of lcs.gameData.summonerSpells"
          :spell-id="s.id"
          @click="handle1Click(s.id)"
        />
      </div>
    </NPopover>
    <NPopover trigger="click" v-model:show="popover2Show">
      <template #trigger>
        <LcuImage class="icon" :src="lcs.gameData.summonerSpells[modelData.spell2Id]?.iconPath" />
      </template>
      <div class="selectable-spells">
        <SummonerSpellDisplay
          :size="32"
          v-for="s of lcs.gameData.summonerSpells"
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
import { NPopover } from 'naive-ui'
import { ref } from 'vue'

const lcs = useLeagueClientStore()

const modelData = defineModel<{
  spell1Id: number
  spell2Id: number
}>('spell-ids', {
  default: () => ({
    spell1Id: 1,
    spell2Id: 1
  })
})

const popover1Show = ref(false)
const popover2Show = ref(false)

const handle1Click = (id: number) => {
  modelData.value = { ...modelData.value, spell1Id: id }
  popover1Show.value = false
}

const handle2Click = (id: number) => {
  modelData.value = { ...modelData.value, spell2Id: id }
  popover2Show.value = false
}
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
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}
</style>
