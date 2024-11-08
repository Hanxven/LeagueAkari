<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper" ref="el">
      <div class="inner-wrapper">
        <NCard size="small" >
          <template #header><span class="card-header-title">游戏流</span></template>
          <ControlItem
            class="control-item-margin"
            label="自动接受对局开启"
            label-description="当匹配到玩家时，自动确认"
            :label-width="200"
          >
            <NSwitch
              :value="store.settings.autoAcceptEnabled"
              @update:value="(val) => shard.setAutoAcceptEnabled(val)"
              size="small"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            label="自动接受对局延时 (s)"
            label-description="在可接受时延迟执行接受操作的时间，单位为秒"
            :label-width="200"
          >
            <NInputNumber
              style="width: 80px"
              :value="store.settings.autoAcceptDelaySeconds"
              @update:value="(value) => shard.setAutoAcceptDelaySeconds(value || 0)"
              placeholder="秒"
              :min="0"
              :max="10"
              size="small"
            />
          </ControlItem>
          <div class="divider"></div>
          <ControlItem
            class="control-item-margin"
            label="自动点赞开启"
            label-description="在游戏结束时，自动点赞。外部工具无法跳过点赞阶段，因此将会尝试用尽票数以完成点赞阶段"
            :label-width="200"
          >
            <NSwitch
              :value="store.settings.autoHonorEnabled"
              @update:value="(val) => shard.setAutoHonorEnabled(val)"
              size="small"
            />
          </ControlItem>
          <ControlItem
            v-if="false"
            class="control-item-margin"
            label="点赞选择策略"
            label-description="这将决定具体给哪位玩家点赞"
            :label-width="200"
          >
            <NRadioGroup
              size="small"
              name="radio-group"
              :value="store.settings.autoHonorStrategy"
              @update:value="(val) => shard.setAutoHonorStrategy(val)"
            >
              <NFlex :size="4">
                <NRadio
                  value="prefer-lobby-member"
                  title="优先选择房间内的人员，若有剩余票数，则选择其他队友"
                  >优先预组队成员</NRadio
                >
                <NRadio value="only-lobby-member" title="只选择房间内的人员">仅预组队成员</NRadio>
                <NRadio value="all-member" title="考虑所有队友">所有队友</NRadio>
                <NRadio value="all-member-including-opponent" title="考虑本局游戏所有玩家"
                  >所有玩家</NRadio
                >
                <NRadio value="opt-out" title="将直接跳过此阶段">跳过</NRadio>
              </NFlex>
            </NRadioGroup>
          </ControlItem>
          <div class="divider"></div>
          <ControlItem class="control-item-margin" label="自动回到房间" :label-width="200">
            <template #labelDescription>
              对局结束时回到房间。可能需要先启用
              <span
                style="font-weight: bold; cursor: pointer"
                @click="() => shard.setAutoHonorEnabled(true)"
                >自动点赞</span
              >
              以完成点赞投票阶段
            </template>
            <NSwitch
              :value="store.settings.playAgainEnabled"
              @update:value="(val) => shard.setPlayAgainEnabled(val)"
              size="small"
            />
          </ControlItem>
          <div class="divider"></div>
          <ControlItem
            class="control-item-margin"
            label="自动匹配对局"
            label-description="在可匹配对局时，将自动开始匹配对局"
            :label-width="200"
          >
            <NSwitch
              :value="store.settings.autoMatchmakingEnabled"
              @update:value="(val) => shard.setAutoMatchmakingEnabled(val)"
              size="small"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            label="最低人数"
            :label-description="`自动开始匹配需满足人数达到 ${store.settings.autoMatchmakingMinimumMembers} 人`"
            :label-width="200"
          >
            <NInputNumber
              :value="store.settings.autoMatchmakingMinimumMembers"
              @update:value="(val) => shard.setAutoMatchmakingMinimumMembers(val || 1)"
              :min="1"
              :max="99"
              size="small"
              style="width: 80px"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            label="匹配前等待时间 (s)"
            label-description="在可匹配对局时，预留的等待时间，单位为秒"
            :label-width="200"
          >
            <NInputNumber
              style="width: 80px"
              :value="store.settings.autoMatchmakingDelaySeconds"
              @update:value="(value) => shard.setAutoMatchmakingDelaySeconds(value || 0)"
              placeholder="秒"
              :min="0"
              size="small"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            label="等待邀请中成员"
            label-description="自动开启匹配将等待所有被邀请的玩家做出回应"
            :label-width="200"
          >
            <NSwitch
              :value="store.settings.autoMatchmakingWaitForInvitees"
              @update:value="(val) => shard.setAutoMatchmakingWaitForInvitees(val)"
              size="small"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            label="停止匹配策略"
            label-description="在某些情况下，自动停止匹配状态。当自动匹配开启时，将会重新开始匹配"
            :label-width="200"
          >
            <NRadioGroup
              :value="store.settings.autoMatchmakingRematchStrategy"
              @update:value="(s) => shard.setAutoMatchmakingRematchStrategy(s)"
              size="small"
            >
              <NFlex>
                <NRadio value="never" title="永远不停止">永不</NRadio>
                <NRadio value="fixed-duration" title="超过指定时间后立即停止">固定时间</NRadio>
                <NRadio value="estimated-duration" title="超过系统队列预估时间后立即停止"
                  >超过队列预估时间</NRadio
                >
              </NFlex>
            </NRadioGroup>
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            label="退出匹配时间 (s)"
            :label-description="
              store.settings.autoMatchmakingRematchStrategy !== 'fixed-duration'
                ? `该选项仅当停止匹配策略为固定时间时生效`
                : `在超过该时间后，将停止匹配，单位为秒`
            "
            :disabled="store.settings.autoMatchmakingRematchStrategy !== 'fixed-duration'"
            :label-width="200"
          >
            <NInputNumber
              :disabled="store.settings.autoMatchmakingRematchStrategy !== 'fixed-duration'"
              style="width: 80px"
              :value="store.settings.autoMatchmakingRematchFixedDuration"
              @update:value="(value) => shard.setAutoMatchmakingRematchFixedDuration(value || 2)"
              placeholder="秒"
              :min="1"
              size="small"
            />
          </ControlItem>
          <div class="divider"></div>
          <ControlItem
            class="control-item-margin"
            label="自动重新连接"
            label-description="当位于可重新连接状态时，尝试重新连接"
            :label-width="200"
          >
            <NSwitch
              :value="store.settings.autoReconnectEnabled"
              @update:value="(val) => shard.setAutoReconnectEnabled(val)"
              size="small"
            />
          </ControlItem>
          <div class="divider"></div>
          <ControlItem
            class="control-item-margin"
            label="自动处理房间邀请"
            label-description="按照设定的策略处理房间邀请"
            :label-width="200"
          >
            <NSwitch
              :value="store.settings.autoHandleInvitationsEnabled"
              @update:value="(val) => shard.setAutoHandleInvitationsEnabled(val)"
              size="small"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            label="房间邀请接受策略"
            label-description="当收到房间邀请时，将根据不同的队列模式进行处理"
            :label-width="200"
          >
            <NFlex vertical align="flex-start">
              <table>
                <tbody>
                  <tr v-for="s of invitationStrategiesArray" :key="s.queueType">
                    <td
                      style="
                        font-size: 13px;
                        font-weight: bold;
                        text-overflow: ellipsis;
                        overflow: hidden;
                        white-space: nowrap;
                        padding: 4px 16px 4px 0;
                      "
                    >
                      {{ QUEUE_TYPES[s.queueType]?.label || s.queueType }}
                    </td>
                    <td>
                      <NRadioGroup
                        :value="s.strategy"
                        @update:value="(val) => handleChangeInvitationStrategy(s.queueType, val)"
                      >
                        <NRadio value="accept">接受</NRadio>
                        <NRadio value="decline">拒绝</NRadio>
                        <NRadio value="ignore">不处理</NRadio>
                      </NRadioGroup>
                    </td>
                  </tr>
                </tbody>
              </table>
              <NPopselect
                :options="queueTypeOptions"
                multiple
                :value="invitationStrategiesPopselectArray"
                @update:value="handleChangeInvitationStrategies"
              >
                <NButton size="tiny" type="primary">配置</NButton>
              </NPopselect>
            </NFlex>
          </ControlItem>
        </NCard>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { AutoGameflowRenderer } from '@renderer-shared/shards/auto-gameflow'
import { useAutoGameflowStore } from '@renderer-shared/shards/auto-gameflow/store'
import {
  NButton,
  NCard,
  NFlex,
  NInputNumber,
  NPopselect,
  NRadio,
  NRadioGroup,
  NScrollbar,
  NSwitch
} from 'naive-ui'
import { computed } from 'vue'

const store = useAutoGameflowStore()
const shard = useInstance<AutoGameflowRenderer>('auto-gameflow-renderer')

const invitationStrategiesPopselectArray = computed(() => {
  return Object.keys(store.settings.invitationHandlingStrategies)
})

const handleChangeInvitationStrategies = (value: string[]) => {
  const newStrategies: Record<string, string> = {}

  for (const strategy of value) {
    if (store.settings.invitationHandlingStrategies[strategy]) {
      newStrategies[strategy] = store.settings.invitationHandlingStrategies[strategy]
    } else {
      newStrategies[strategy] = 'ignore'
    }
  }

  shard.setInvitationHandlingStrategies(newStrategies)
}

const QUEUE_TYPES = {
  '<DEFAULT>': {
    label: '默认处理',
    order: 0
  },
  RANKED_SOLO_5x5: {
    label: '单双排位',
    order: 100
  },
  RANKED_FLEX_SR: {
    label: '灵活排位',
    order: 110
  },
  NORMAL: {
    label: '匹配模式',
    order: 200
  },
  ARAM_UNRANKED_5x5: {
    label: '极地大乱斗',
    order: 300
  },
  CHERRY: {
    label: '斗魂竞技场',
    order: 400
  },
  URF: {
    label: '无限火力 / 无限乱斗',
    order: 500
  },
  NORMAL_TFT: {
    label: '云顶之弈',
    order: 600
  },
  RANKED_TFT: {
    label: '云顶之弈 排位',
    order: 610
  },
  RANKED_TURBO: {
    label: '云顶之弈 狂暴',
    order: 620
  },
  RANKED_TFT_DOUBLE_UP: {
    label: '云顶之弈 双人作战',
    order: 630
  }
} as const

const invitationStrategiesArray = computed(() => {
  return Object.entries(store.settings.invitationHandlingStrategies)
    .map(([queueType, strategy]) => {
      return {
        queueType,
        strategy
      }
    })
    .toSorted((a, b) => {
      const aQueueTypeOrder = QUEUE_TYPES[a.queueType] ? QUEUE_TYPES[a.queueType].order : 0
      const bQueueTypeOrder = QUEUE_TYPES[b.queueType] ? QUEUE_TYPES[b.queueType].order : 0

      return aQueueTypeOrder - bQueueTypeOrder
    })
})

const queueTypeOptions = computed(() => {
  return Object.keys(QUEUE_TYPES)
    .map((key) => {
      return {
        value: key,
        label: QUEUE_TYPES[key].label
      }
    })
    .toSorted((a, b) => {
      return QUEUE_TYPES[a.value].order - QUEUE_TYPES[b.value].order
    })
})

const handleChangeInvitationStrategy = (queueType: string, strategy: string) => {
  const newObj = { ...store.settings.invitationHandlingStrategies }
  newObj[queueType] = strategy
  shard.setInvitationHandlingStrategies(newObj)
}
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

.divider {
  margin-top: 12px;
  margin-bottom: 12px;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.084);
}

.outer-wrapper {
  position: relative;
  height: 100%;
  max-width: 100%;
}

.inner-wrapper {
  padding: 16px;
  margin: 0 auto;
  max-width: 800px;

  :deep(.n-card) {
    background-color: transparent;
  }
}

.single-root {
  height: 100%;
}
</style>
