<template>
  <div class="player-page">
    <div class="player-content" ref="headerEl">
      <Transition name="fade">
        <div class="player-header-simplified" v-if="shouldShowTinyHeader" :appear="false">
          Konata #99889
        </div>
      </Transition>
      <div class="player-header">
        <div class="player-header-profile">
          <div class="profile-image">
            <LcuImage
              class="profile-image-icon"
              :src="championIcon(1)"
            />
            <div class="profile-image-lv">452</div>
          </div>
          <div class="profile-name">
            <span class="game-name">Konata</span>
            <span class="tag-line">#11223</span>
          </div>
        </div>
        <div class="player-header-ranked">
          <RankedDisplay class="ranked-solo" />
          <RankedDisplay class="ranked-flex" />
        </div>
      </div>
      <div class="long-content">123</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import { useScroll } from '@vueuse/core'
import { computed, ref } from 'vue'
import { championIcon } from '@shared/renderer/modules/game-data'

import RankedDisplay from './widgets/RankedDisplay.vue'

const headerEl = ref<HTMLElement | null>(null)

const SHOW_TINY_HEADER_THRESHOLD = 160

const { y } = useScroll(headerEl)
const shouldShowTinyHeader = computed(() => y.value > SHOW_TINY_HEADER_THRESHOLD)
</script>

<style lang="less" scoped>
.player-page {
  position: relative;
  height: 100%;
  background-color: #414141;
}

.player-header {
  display: flex;
  align-items: center;
  height: 160px;
  box-sizing: border-box;
  padding: 20px 32px;
  background-color: #333;
}

.player-header-profile {
  display: flex;
  width: 260px;
  height: 64px;

  .profile-image {
    position: relative;
    width: 64px;
    height: 64px;
  }

  .profile-image .profile-image-icon {
    width: 100%;
    height: 100%;
    border-radius: 4px;
    margin-bottom: 2px;
  }

  .profile-image .profile-image-lv {
    font-size: 10px;
    color: #fff;
    position: absolute;
    bottom: -4px;
    right: -4px;
    background-color: #00000060;
    padding: 2px 4px;
    border-radius: 2px;
  }

  .profile-name {
    display: flex;
    align-self: flex-end;
    align-items: baseline;
    margin-left: 12px;
  }

  .profile-name .game-name {
    font-size: 24px;
    color: #fff;
    font-weight: bold;
  }

  .profile-name .tag-line {
    font-size: 14px;
    color: #858585;
    margin-left: 4px;
  }
}

.player-header-simplified {
  position: absolute;
  width: 100%;
  top: 0;
  height: 64px;
  background-color: #4b525f;
  z-index: 200;
}

.player-header-ranked {
  display: flex;

  .ranked-flex,
  .ranked-solo {
    margin-right: 12px;
  }
}

.player-content {
  height: 100%;
  background-color: #524242;
  overflow: auto;

  .long-content {
    height: 9999px;
    background-color: #3c5c27;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
