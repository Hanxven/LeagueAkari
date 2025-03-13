<template>
  <div class="title-bar">
    <div class="title-area">
      <span class="title">Akari Timer</span>
    </div>
    <div class="traffic">
      <div class="traffic-button close" @click="handleClose">
        <NIcon><CloseIcon /></NIcon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { Close as CloseIcon } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

const wm = useInstance(WindowManagerRenderer)

const handleClose = () => {
  return wm.cdTimerWindow.hide()
}
</script>

<style lang="less" scoped>
.title-bar {
  display: flex;
  height: 20px;
  background-color: #fc82eaa0;
  -webkit-app-region: drag;
}

.title-area {
  display: flex;
  align-items: center;
  height: 100%;
  flex: 1;
  transition: all 0.3s;
  padding: 4px 4px 2px 8px;
  box-sizing: border-box;

  .title {
    font-size: 12px;
    color: #fffd;
  }
}

.traffic {
  height: 100%;
  display: flex;
  justify-content: flex-end;
  transition: all 0.3s ease;

  .traffic-button {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 36px;
    font-size: 12px;
    transition: all 0.3s;
    -webkit-app-region: no-drag;

    &:active {
      filter: brightness(0.8);
    }
  }

  .traffic-button.close {
    &:hover {
      background-color: rgb(194, 0, 0);
      color: #fff;
    }
  }
}
</style>
