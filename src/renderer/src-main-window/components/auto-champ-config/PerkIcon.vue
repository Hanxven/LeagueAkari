<template>
  <NPopover
    v-if="lcs.isConnected && perkId && lcs.gameData.perks[perkId]"
    :delay="500"
    :keep-alive-on-hover="false"
  >
    <template #trigger>
      <div
        class="ring-wrapper"
        :class="{
          selected: selected,
          darken: darken
        }"
        @click="emits('itemClick', perkId)"
      >
        <LcuImage
          :src="lcs.gameData.perks[perkId].iconPath"
          v-bind="$attrs"
          :style="{ width: `${size}px`, height: `${size}px` }"
          class="perk"
        />
      </div>
    </template>
    <div :style="{ 'max-width': `${maxWidth}px` }" class="info">
      <LcuImage class="image" :src="lcs.gameData.perks[perkId].iconPath" />
      <div class="right-side">({{ perkId || '-' }}) {{ lcs.gameData.perks[perkId].name }}</div>
    </div>
    <div
      :style="{ 'max-width': `${maxWidth}px` }"
      style="font-size: 12px"
      lol-view
      v-html="lcs.gameData.perks[perkId].longDesc"
    ></div>
  </NPopover>
  <div
    v-else
    class="ring-wrapper"
    :class="{
      selected: selected
    }"
  >
    <div :style="{ width: `${size}px`, height: `${size}px` }" class="empty"></div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { NPopover } from 'naive-ui'

const { size = 20, maxWidth = 400 } = defineProps<{
  selected?: boolean
  darken?: boolean
  perkId?: number
  size?: number
  maxWidth?: number
}>()

const emits = defineEmits<{
  itemClick: [perkId: number]
}>()

const lcs = useLeagueClientStore()
</script>

<style lang="less" scoped>
.ring-wrapper {
  cursor: pointer;
  border-radius: 50%;
  padding: 2px;
  border: 2px solid #c8aa6e10;
  transition:
    border-color 0.2s,
    filter 0.2s;

  &.selected {
    border: 2px solid #c8aa6e;
  }

  &.darken {
    filter: grayscale(0.82);
  }

  &:not(.selected):hover {
    filter: grayscale(0);
    border: 2px solid #c8aa6e80;
  }
}

.info {
  display: flex;
  align-items: center;
  margin-bottom: 8px;

  .image {
    border-radius: 2px;
    height: 28px;
  }

  .right-side {
    margin-left: 8px;
    font-size: 12px;
    font-weight: bold;
  }
}

.empty {
  border-radius: 50%;
  background-color: #353535;
}

.perkstyle-icon {
  mask-position: 50% 50%;
  mask-repeat: no-repeat;
}

// copied from LeagueClientUx
@perks-color-domination-light: #d44242;
@perks-color-domination-dark: #dc4747;
@perks-color-inspiration-light: #49aab9;
@perks-color-inspiration-dark: #48b4be;
@perks-color-precision-light: #aea789;
@perks-color-precision-dark: #c8aa6e;
@perks-color-resolve-light: #a1d586;
@perks-color-resolve-dark: #a4d08d;
@perks-color-sorcery-light: #9faafc;
@perks-color-sorcery-dark: #6c75f5;

.perks-domination-style-icon {
  background: linear-gradient(
    to bottom,
    @perks-color-domination-light 0%,
    @perks-color-domination-dark 100%
  );
}

.perks-inspiration-style-icon {
  background: linear-gradient(
    to bottom,
    @perks-color-inspiration-light 0%,
    @perks-color-inspiration-dark 100%
  );
}

.perks-precision-style-icon {
  background: linear-gradient(
    to bottom,
    @perks-color-precision-light 0%,
    @perks-color-precision-dark 100%
  );
}

.perks-resolve-style-icon {
  background: linear-gradient(
    to bottom,
    @perks-color-resolve-light 0%,
    @perks-color-resolve-dark 100%
  );
}

.perks-sorcery-style-icon {
  background: linear-gradient(
    to bottom,
    @perks-color-sorcery-light 0%,
    @perks-color-sorcery-dark 100%
  );
}
</style>
