<template>
  <NCard size="small">
    <template #header><span class="card-header-title">名称可用性</span></template>
    <ControlItem
      class="control-item-margin"
      label="检查名称可用性"
      label-description="查看当前名称是否可用"
    >
      <div style="display: flex; align-items: center; gap: 8px">
        <NInput
          placeholder="召唤师名称"
          style="width: 180px"
          size="tiny"
          @keyup.enter="handleCheckAvailability"
          v-model:value="availability.summonerName"
        ></NInput>
        <NButton
          :loading="availability.isCheckingSummonerName"
          :disabled="availability.summonerName.length === 0"
          @click="handleCheckAvailability"
          size="tiny"
          >检查</NButton
        >
        <Transition name="fade">
          <span v-if="availability.availability" style="font-size: 12px; color: #7fe7c4">可用</span>
          <span
            v-else-if="availability.availability === false"
            style="font-size: 12px; color: #f1b4a5"
            >不可用</span
          >
        </Transition>
      </div>
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      label="创建新名称"
      label-description="仅在大区召唤师创建时可用，通常用于为新号设置长名称"
    >
      <div style="display: flex; align-items: center; gap: 8px">
        <NInput
          placeholder="召唤师名称"
          style="width: 180px"
          size="tiny"
          @keyup.enter="popconfirmShow = true"
          v-model:value="newName"
        ></NInput>
        <NPopconfirm
          v-model:show="popconfirmShow"
          @positive-click="handleCreateNewSummonerWithName"
          :negative-button-props="{ size: 'tiny' }"
          :positive-button-props="{ size: 'tiny' }"
        >
          <template #trigger>
            <NButton size="tiny">提交</NButton>
          </template>
          <div style="font-size: 13px">
            该功能仅可在召唤师尚未创建 (即在初始玩家名称选择阶段) 时生效。<br />名称的长度仍然存在长度限制，通常为
            3 ~ 16 个中文或半角字符<br />若成功执行，需重启游戏客户端。确定执行吗？
          </div>
        </NPopconfirm>
      </div>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import { quit } from '@shared/renderer/http-api/process-control'
import { checkAvailability, newSummonerName } from '@shared/renderer/http-api/summoner'
import { laNotification } from '@shared/renderer/notification'
import { NButton, NCard, NInput, NPopconfirm, useMessage } from 'naive-ui'
import { h, reactive, ref, watch } from 'vue'

const id = 'view:toolkit:availability-check'

const availability = reactive({
  summonerName: '',
  availability: null as boolean | null,
  isCheckingSummonerName: false
})

const handleCheckAvailability = async () => {
  if (availability.isCheckingSummonerName || availability.summonerName.length === 0) {
    return
  }
  try {
    availability.isCheckingSummonerName = true
    const r = await checkAvailability(availability.summonerName)
    if (r.data) {
      availability.availability = true
    } else {
      availability.availability = false
    }
  } catch (error) {
    laNotification.warn('可用性检查', '尝试检查召唤师可用性失败', error)
  } finally {
    availability.isCheckingSummonerName = false
  }
}

watch(
  () => availability.summonerName,
  () => {
    availability.availability = null
  }
)
const message = useMessage()

const newName = ref('')
const popconfirmShow = ref(false)
const handleCreateNewSummonerWithName = async () => {
  try {
    await newSummonerName(newName.value)
    const messageInstance = message.success(
      () =>
        h('div', { style: { display: 'flex', gap: '4px', 'align-items': 'center' } }, [
          h('span', '提交成功，需要重新启动游戏客户端'),
          h(
            NButton,
            {
              size: 'tiny',
              type: 'warning',
              onClick: () => {
                quit()
                messageInstance.destroy()
              }
            },
            () => '结束游戏客户端'
          )
        ]),
      { duration: 10000 }
    )
  } catch (error) {
    laNotification.warn(
      '可用性检查',
      '尝试创建新的召唤师时失败，名称无法过长或过短，且无法重复创建角色',
      error
    )
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
