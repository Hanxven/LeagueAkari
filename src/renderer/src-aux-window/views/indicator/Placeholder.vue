<template>
  <div class="la-placeholder">
    <LeagueAkariSpan />
    <span class="sub" v-if="lcs.gameflow.phase === 'InProgress'">{{
      t('Placeholder.inProgress')
    }}</span>
    <span class="sub" v-else>{{ t('Placeholder.idle') }}</span>
  </div>
</template>

<script setup lang="ts">
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const lcs = useLeagueClientStore()
</script>

<style lang="less" scoped>
.la-placeholder {
  display: flex;
  position: relative;
  flex-direction: column;
  top: calc(var(--title-bar-height) * -0.5);
  color: #8d8d8d;
  font-size: 14px;
  font-weight: bold;
  height: 100%;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.sub {
  font-size: 12px;
  font-weight: normal;
}
</style>
