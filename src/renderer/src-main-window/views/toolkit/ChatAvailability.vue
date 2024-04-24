<template>
  <NCard size="small">
    <template #header><span class="card-header-title">聊天状态</span></template>
    <ControlItem
      class="control-item-margin"
      label="状态"
      label-description="展示或设置当前聊天状态。部分状态仅在特定情况下可用"
    >
      <NRadioGroup
        size="small"
        :disabled="!chat.me"
        name="radio-group"
        :value="chat.me?.availability"
        @update:value="(a) => handleChangeAvailability(a)"
      >
        <NFlex :size="4">
          <NRadio value="chat">聊天</NRadio>
          <NRadio value="mobile">在线分组</NRadio>
          <NRadio value="away">离开</NRadio>
          <NRadio value="offline" title="离线状态无法被邀请">离线</NRadio>
          <NRadio value="dnd" title="不在游戏进程中时，通常情况下无法手动切换到此状态"
            >游戏中</NRadio
          >
        </NFlex>
      </NRadioGroup>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import { NCard, NFlex, NRadio, NRadioGroup } from 'naive-ui'

import ControlItem from '@main-window/components/ControlItem.vue'
import { useChatStore } from '@main-window/features/lcu-state-sync/chat'
import { AvailabilityType, changeAvailability } from '@shared/renderer-http-api/chat'
import { laNotification } from '@main-window/notification'

const id = 'view:toolkit:chat-availability'
const chat = useChatStore()

const handleChangeAvailability = async (availability: string) => {
  try {
    await changeAvailability(availability as AvailabilityType)
  } catch (error) {
    laNotification.warn('聊天状态', `尝试修改状态失败`, error)
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
