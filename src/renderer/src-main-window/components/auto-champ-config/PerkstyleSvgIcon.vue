<template>
  <NPopover
    v-if="lcs.isConnected && perkstyleId && lcs.gameData.perkstyles.styles[perkstyleId]"
    :delay="500"
    :keep-alive-on-hover="false"
  >
    <template #trigger>
      <div
        class="ring-wrapper"
        :class="{
          selected: selected
        }"
        @click="emits('itemClick', perkstyleId)"
      >
        <div
          :style="{
            width: `${size}px`,
            height: `${size}px`,
            'mask-size': `${size - 6}px`,
            'mask-image': `url(akari://league-client${getIconPath(perkstyleId)})`
          }"
          class="perkstyle-icon"
          :class="{
            [getSvgClasses(perkstyleId)]: true
          }"
        />
      </div>
    </template>
    <div style="width: 180px" class="info">
      <div
        v-bind="$attrs"
        :style="{
          width: `24px`,
          height: `24px`,
          'mask-size': `18px`,
          'mask-image': `url(akari://league-client${getIconPath(perkstyleId)})`
        }"
        class="perkstyle-icon"
        :class="{
          [getSvgClasses(perkstyleId)]: true
        }"
      />
      <div class="right-side">
        ({{ perkstyleId || '-' }}) {{ lcs.gameData.perkstyles.styles[perkstyleId].name }}
      </div>
    </div>
    <div style="max-width: 180px; font-size: 12px">
      {{ lcs.gameData.perkstyles.styles[perkstyleId].tooltip }}
    </div>
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
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { NPopover } from 'naive-ui'

const { size = 20 } = defineProps<{
  selected?: boolean
  perkstyleId?: number
  size?: number
}>()

const emits = defineEmits<{
  itemClick: [perkstyleId: number]
}>()

const lcs = useLeagueClientStore()

const getIconPath = (perkstyleId: number) => {
  return lcs.gameData.perkstyles.styles[perkstyleId]?.assetMap.svg_icon
}

const getSvgClasses = (perkstyleId: number) => {
  const style = lcs.gameData.perkstyles.styles[perkstyleId]
  if (!style) return ''

  switch (style.id) {
    case 8100:
      return 'perks-domination-style-icon'
    case 8300:
      return 'perks-inspiration-style-icon'
    case 8000:
      return 'perks-precision-style-icon'
    case 8400:
      return 'perks-resolve-style-icon'
    case 8200:
      return 'perks-sorcery-style-icon'
    default:
      return ''
  }
}
</script>

<style lang="less" scoped>
.ring-wrapper {
  cursor: pointer;
  border-radius: 50%;
  padding: 2px;
  border: 2px solid #0000;
  transition: border-color 0.2s;

  &:not(.selected):hover {
    border: 2px solid #c8aa6e80;
  }

  &.selected {
    border: 2px solid #c8aa6e;
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
