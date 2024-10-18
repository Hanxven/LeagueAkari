<template>
  <NCard size="small">
    <NFlex align="center" class="control-item">
      <span class="label" style="flex: 1"
        >自动接受 ({{
          isCustomGame ? '模式不适用' : formatDelayText(agfs.settings.autoAcceptDelaySeconds)
        }})</span
      >
      <NSwitch
        size="small"
        :value="agfs.settings.autoAcceptEnabled"
        @update:value="(val) => agf.setAutoAcceptEnabled(val)"
      />
    </NFlex>
    <NPopover :show-arrow="false">
      <template #trigger>
        <NFlex align="center" class="control-item">
          <div style="flex: 1; display: flex; justify-content: flex-start; align-items: center">
            <span class="label"
              >自动匹配 ({{
                isCustomGame
                  ? '模式不适用'
                  : formatDelayText(agfs.settings.autoMatchmakingDelaySeconds)
              }})</span
            >
            <NIcon class="icon">
              <ExpandMoreSharpIcon />
            </NIcon>
          </div>
          <NSwitch
            size="small"
            :value="agfs.settings.autoMatchmakingEnabled"
            @update:value="(val) => agf.setAutoMatchmakingEnabled(val)"
          />
        </NFlex>
      </template>
      <NFlex class="more" vertical>
        <NFlex align="center" class="control-item">
          <span class="label" style="flex: 1">最低人数</span>
          <NInputNumber
            :value="agfs.settings.autoMatchmakingMinimumMembers"
            @update:value="(val) => agf.setAutoMatchmakingMinimumMembers(val || 1)"
            :min="1"
            :max="99"
            size="tiny"
            style="width: 80px"
          />
        </NFlex>
        <NFlex align="center" class="control-item">
          <span class="label" style="flex: 1">匹配前等待时间</span>
          <NInputNumber
            :value="agfs.settings.autoMatchmakingDelaySeconds"
            @update:value="(value) => agf.setAutoMatchmakingDelaySeconds(value || 0)"
            placeholder="秒"
            :min="0"
            size="tiny"
            style="width: 80px"
          />
        </NFlex>
        <NFlex align="center" class="control-item">
          <span class="label" style="flex: 1">等待邀请中成员</span>
          <NSwitch
            :value="agfs.settings.autoMatchmakingWaitForInvitees"
            @update:value="(val) => agf.setAutoMatchmakingWaitForInvitees(val)"
            size="small"
          />
        </NFlex>
      </NFlex>
    </NPopover>
  </NCard>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { AutoGameflowRenderer } from '@renderer-shared/shards/auto-gameflow'
import { useAutoGameflowStore } from '@renderer-shared/shards/auto-gameflow/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { ExpandMoreSharp as ExpandMoreSharpIcon } from '@vicons/material'
import { NCard, NFlex, NIcon, NInputNumber, NPopover, NSwitch } from 'naive-ui'
import { computed } from 'vue'

const agfs = useAutoGameflowStore()
const lcs = useLeagueClientStore()

const agf = useInstance<AutoGameflowRenderer>('auto-gameflow-renderer')

const isCustomGame = computed(() => {
  if (!lcs.gameflow.session) {
    return null
  }

  return lcs.gameflow.session.gameData.isCustomGame
})

const formatDelayText = (d: number) => {
  if (d <= 0.05) {
    return `立即`
  }
  return `${d.toFixed(1)} s`
}
</script>

<style scoped lang="less">
.label {
  font-size: 11px;
  color: rgb(178, 178, 178);
}

.icon {
  font-size: 18px;
  color: rgb(178, 178, 178);
  margin-left: 4px;
}

.more {
  font-size: 11px;
  width: 82vw;
}

.control-item {
  height: 24px;

  &:not(:last-child) {
    margin-bottom: 2px;
  }
}
</style>
