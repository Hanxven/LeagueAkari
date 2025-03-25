<template>
  <div class="panel">
    <div class="left-side-content">
      <Sidebar />
    </div>
    <div class="right-side-content">
      <RouterView v-slot="{ Component }">
        <Transition name="fade">
          <KeepAlive>
            <component :is="Component" />
          </KeepAlive>
        </Transition>
      </RouterView>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from '@main-window/components/sidebar/Sidebar.vue'
</script>

<style lang="less" scoped>
.panel {
  display: flex;
  width: 100%;
  height: 100%;

  .padding-zone {
    flex: 1;
  }

  .fixed-buttons {
    height: 96px;
    background-color: rgba(167, 37, 37, 0.518);
  }

  .right-side-content {
    flex: 1;
    width: 0;
  }
}

[data-theme='dark'] {
  .panel {
    .fixed-buttons {
      background-color: rgba(167, 37, 37, 0.518);
    }

    .left-side-content {
      border-right: 1px solid rgba(255, 255, 255, 0.1);
    }
  }
}

[data-theme='light'] {
  .panel {
    .fixed-buttons {
      background-color: rgba(167, 37, 37, 0.518);
    }

    .left-side-content {
      border-right: 1px solid rgba(0, 0, 0, 0.1);
    }
  }
}

.client {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 24px;
  transition: 0.3s all ease;
  cursor: pointer;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.03);
  width: 160px;
  overflow: hidden;

  &:hover:not(.connected) {
    background-color: rgba(255, 255, 255, 0.15);
  }

  &:active:not(.connected) {
    background-color: rgba(255, 255, 255, 0.2);
  }

  &:not(:last-child) {
    margin-bottom: 4px;
  }

  .region {
    font-size: 14px;
    color: #fff;
  }

  .rso {
    font-size: 14px;
    font-weight: bold;
    margin-left: 8px;
  }

  .pid {
    position: absolute;
    bottom: 0px;
    right: 6px;
    font-size: 12px;
    color: #6a6a6ae3;
    margin-left: 8px;
  }

  .connected-indicator {
    display: block;
    position: absolute;
    width: 4px;
    height: 100%;
    background-color: #8ede7c;
    left: 0px;
  }

  .left-widget {
    margin-right: 6px;
    font-size: 16px;
  }

  &.connected {
    :is(.rso, .region) {
      color: #696969;
    }
  }
}
</style>
