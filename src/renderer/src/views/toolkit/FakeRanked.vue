<template>
  <NCard size="small">
    <template #header><span class="card-header-title">聊天卡片段位修改</span></template>
    <div class="control-line">
      <span class="label">设置</span>
      <NButton size="tiny" type="primary" @click="() => handleSet()">生效</NButton>
    </div>
    <div class="control-line">
      <span class="label">队列</span>
      <NSelect
        :options="queueOptions"
        style="max-width: 180px"
        v-model:value="state.queue"
        size="tiny"
      ></NSelect>
    </div>
    <div class="control-line">
      <span class="label">段位</span>
      <NSelect
        :options="tierOptions"
        style="max-width: 180px"
        v-model:value="state.tier"
        size="tiny"
      ></NSelect>
    </div>
    <div class="control-line">
      <span class="label">分级</span>
      <NSelect
        :options="divisionOptions"
        :disabled="
          state.tier === 'MASTER' || state.tier === 'GRANDMASTER' || state.tier === 'CHALLENGER'
        "
        style="max-width: 180px"
        v-model:value="state.division"
        size="tiny"
      ></NSelect>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { NButton, NCard, NSelect, useMessage } from 'naive-ui'
import { reactive } from 'vue'

import { notify } from '@renderer/events/notifications'
import { changeRanked } from '@renderer/http-api/chat'

const id = 'view:toolkit:fake-ranked'

const state = reactive({
  queue: 'RANKED_SOLO_5x5',
  tier: 'CHALLENGER',
  division: 'I'
})

const message = useMessage()

const handleSet = async () => {
  try {
    await changeRanked(
      state.queue,
      state.tier,
      state.tier === 'MASTER' || state.tier === 'GRANDMASTER' || state.tier === 'CHALLENGER'
        ? undefined
        : state.division
    )
    message.success('成功', { duration: 1000 })
  } catch (err) {
    notify.emit({ id, type: 'warning', content: '尝试提交数据时失败', extra: { error: err } })
  }
}

const tierOptions = [
  {
    label: '坚韧黑铁',
    value: 'IRON'
  },
  {
    label: '英勇黄铜',
    value: 'BRONZE'
  },
  {
    label: '不屈白银',
    value: 'SILVER'
  },
  {
    label: '荣耀黄金',
    value: 'GOLD'
  },
  {
    label: '华贵铂金',
    value: 'PLATINUM'
  },
  {
    label: '流光翡翠',
    value: 'EMERALD'
  },
  {
    label: '璀璨钻石',
    value: 'DIAMOND'
  },
  {
    label: '超凡大师',
    value: 'MASTER'
  },
  {
    label: '傲世宗师',
    value: 'GRANDMASTER'
  },
  {
    label: '最强王者',
    value: 'CHALLENGER'
  }
]

const divisionOptions = [
  {
    label: 'I',
    value: 'I'
  },
  {
    label: 'II',
    value: 'II'
  },
  {
    label: 'III',
    value: 'III'
  },
  {
    label: 'IV',
    value: 'IV'
  }
]

const queueOptions = [
  {
    label: '单排 / 双排',
    value: 'RANKED_SOLO_5x5'
  },
  {
    label: '灵活组排',
    value: 'RANKED_FLEX_SR'
  },
  {
    label: '云顶之弈',
    value: 'RANKED_TFT'
  },
  {
    label: '灵活组排 3x3',
    value: 'RANKED_FLEX_TT'
  },
  {
    label: '竞技场',
    value: 'CHERRY'
  },
  {
    label: '云顶之弈 狂暴模式',
    value: 'RANKED_TFT_TURBO'
  },
  {
    label: '云顶之弈 双人作战',
    value: 'RANKED_TFT_DOUBLE_UP'
  }
]
</script>

<style lang="less" scoped>
@import './style.less';

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
