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
</style>
