<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div class="inner-wrapper">
        <RewardClaimTool />
        <MissionClaimTool style="margin-top: 8px" />
        <!-- 和 Rewards 里面重叠, 因此只需要一个就行了 -->
        <EventHubClaimTool style="margin-top: 8px" v-if="as.settings.isInKyokoMode" />
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { NScrollbar } from 'naive-ui'

import EventHubClaimTool from './EventHubClaimTool.vue'
import MissionClaimTool from './MissionClaimTool.vue'
import RewardClaimTool from './RewardClaimTool.vue'

const as = useAppCommonStore()
</script>

<style lang="less" scoped>
@import '../toolkit-styles.less';
</style>
