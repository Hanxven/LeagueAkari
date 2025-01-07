<template>
  <NPopover
    v-if="spellId && lcs.gameData.summonerSpells[spellId]"
    :delay="delay"
    :disabled="disablePopover"
    :keep-alive-on-hover="keepAliveOnHover"
  >
    <template #trigger>
      <LcuImage
        :src="lcs.gameData.summonerSpells[spellId].iconPath"
        v-bind="$attrs"
        :style="{ width: `${size}px`, height: `${size}px` }"
        class="spell"
      />
    </template>
    <div style="max-width: 240px">
      <div class="name">{{ lcs.gameData.summonerSpells[spellId].name }}</div>
      <div class="cooldown">
        {{
          t('SummonerSpellDisplay.cooldown', {
            time: lcs.gameData.summonerSpells[spellId].cooldown
          })
        }}
      </div>
      <div class="level">
        {{
          t('SummonerSpellDisplay.levelRequirement', {
            level: lcs.gameData.summonerSpells[spellId].summonerLevel
          })
        }}
      </div>
      <div class="description">{{ lcs.gameData.summonerSpells[spellId].description }}</div>
    </div>
  </NPopover>
  <div
    v-else
    :style="{ width: `${size}px`, height: `${size}px` }"
    v-bind="$attrs"
    class="empty"
  ></div>
</template>

<script setup lang="ts">
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'

import LcuImage from '../LcuImage.vue'

const { size = 20, delay = 50 } = defineProps<{
  disablePopover?: boolean
  spellId?: number
  size?: number
  keepAliveOnHover?: boolean
  delay?: number
}>()

const { t } = useTranslation()

const lcs = useLeagueClientStore()
</script>

<style lang="less" scoped>
.cooldown,
.description,
.level {
  font-size: 12px;
}

.cooldown,
.level {
  font-style: italic;
}

.level {
  margin-bottom: 2px;
}

.name {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 2px;
}

.spell {
  border-radius: 2px;
}

.empty {
  border-radius: 2px;
  background-color: rgb(34, 34, 34);
}
</style>
