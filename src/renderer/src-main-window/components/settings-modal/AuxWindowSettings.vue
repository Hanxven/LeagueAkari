<template>
  <NScrollbar style="max-height: 65vh" trigger="none">
    <NCard size="small">
      <template #header><span class="card-header-title">小窗口</span></template>
      <ControlItem
        class="control-item-margin"
        label="使用小窗口"
        label-description="在一些游戏流程中使用小窗口来展示状态以及提供额外操作"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="wms.settings.auxWindowEnabled"
          @update:value="(val) => wm.setAuxWindowEnabled(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="自动弹出和关闭"
        label-description="在游戏流程的部分阶段，自动弹出或关闭小窗口"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="wms.settings.auxWindowAutoShow"
          @update:value="(val) => wm.setAuxWindowAutoShow(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="小窗口不透明度"
        label-description="小窗口的半透明状态"
        :label-width="320"
      >
        <NSlider
          size=""
          style="width: 120px"
          :min="0.3"
          :max="1"
          :step="0.01"
          :format-tooltip="(v) => `${(v * 100).toFixed()} %`"
          @update:value="(val) => wm.setAuxWindowOpacity(val)"
          :value="wms.settings.auxWindowOpacity"
        ></NSlider>
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="皮肤设置器"
        label-description="在小窗口展示一个设置皮肤的快捷入口"
        :label-width="320"
      >
        <NSwitch
          size="small"
          :value="wms.settings.auxWindowShowSkinSelector"
          @update:value="(val) => wm.setAuxWindowShowSkinSelector(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="缩放"
        label-description="可以调整小窗口的整体大小"
        :label-width="320"
      >
        <NInputNumber
          style="width: 100px"
          size="small"
          :min="1"
          :max="3"
          step="0.1"
          :value="wms.settings.auxWindowZoomFactor"
          @update:value="(val) => wm.setAuxWindowZoomFactor(val || 1.0)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="重置小窗口位置"
        label-description="重新设置小窗口的位置，还原到默认主屏幕正中心"
        :label-width="320"
      >
        <NButton size="small" type="warning" secondary @click="() => wm.resetAuxWindowPosition()"
          >重设</NButton
        >
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useWindowManagerStore } from '@renderer-shared/shards/window-manager/store'
import { NButton, NCard, NInputNumber, NScrollbar, NSlider, NSwitch } from 'naive-ui'

const wms = useWindowManagerStore()
const wm = useInstance<WindowManagerRenderer>('window-manager-renderer')
</script>

<style lang="less" scoped>
.control-item-margin {
  &:not(:last-child) {
    margin-bottom: 12px;
  }
}

.card-header-title {
  font-weight: bold;
  font-size: 18px;
}

.card-header-title.disabled {
  color: rgba(255, 255, 255, 0.35);
}
</style>
