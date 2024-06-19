<template>
  <NCard size="small">
    <template #header><span class="card-header-title">生涯旗帜</span></template>
    <ControlItem class="control-item-margin" label="切换为上赛季旗帜">
      <NButton
        :disabled="lc.state !== 'connected'"
        @click="handleUpdatePr"
        size="tiny"
        type="primary"
        >执行</NButton
      >
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import { updatePlayerPreferences } from '@shared/renderer/http-api/challenges'
import { useLcuConnectionStore } from '@shared/renderer/modules/lcu-connection/store'
import { NButton, NCard, useMessage } from 'naive-ui'
import { ref } from 'vue'

const lc = useLcuConnectionStore()

const message = useMessage()

const BANNER_ACCENT_A = '2'

const isLoading = ref(false)
const handleUpdatePr = async () => {
  if (isLoading.value) {
    return
  }

  try {
    isLoading.value = true
    await updatePlayerPreferences({ bannerAccent: BANNER_ACCENT_A })
    message.success('请求成功')
  } catch (error) {
    message.warning('无法执行')
    console.warn(error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style lang="less" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.control-item-margin {
  &:not(:last-child) {
    margin-bottom: 12px;
  }
}

.card-header-title {
  font-weight: bold;
  font-size: 18px;
}
</style>
