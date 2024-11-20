<template>
  <div class="easy-to-launch-wrapper">
    <div class="launch-item" v-for="l of launchItem" @click="l.launch()">
      <img class="logo" :src="l.imgUrl" />
      <span class="label">{{ l.name }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { ClientInstallationRenderer } from '@renderer-shared/shards/client-installation'
import { useClientInstallationStore } from '@renderer-shared/shards/client-installation/store'
import { useMessage } from 'naive-ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import leagueIco from '@main-window/assets/ico/league.ico'
import riotClient from '@main-window/assets/ico/riotclient.ico'
import weGameIco from '@main-window/assets/ico/wegame.ico'

const { t } = useI18n()

const ci = useInstance<ClientInstallationRenderer>('client-installation-renderer')
const cis = useClientInstallationStore()

const message = useMessage()
const launchIt = async (fn: () => Promise<any>, name: string) => {
  try {
    await fn()
    message.success(t('EasyToLaunch.successMessage', { name }))
  } catch (error) {
    message.error(t('EasyToLaunch.failedMessage', { name, reason: (error as any).message }))
  }
}

const launchItem = computed(() => {
  const arr: {
    name: string
    imgUrl: string
    launch: () => any | Promise<any>
  }[] = []

  if (cis.tencentInstallationPath) {
    arr.push({
      name: t('EasyToLaunch.tcls'),
      imgUrl: leagueIco,
      launch: () => launchIt(ci.launchTencentTcls.bind(ci), t('EasyToLaunch.tcls'))
    })
  }

  if (cis.weGameExecutablePath) {
    arr.push({
      name: t('EasyToLaunch.weGame'),
      imgUrl: weGameIco,
      launch: () => launchIt(ci.launchWeGame.bind(ci), t('EasyToLaunch.weGame'))
    })
  }

  if (cis.officialRiotClientExecutablePath) {
    arr.push({
      name: t('EasyToLaunch.riotClient'),
      imgUrl: riotClient,
      launch: () => launchIt(ci.launchDefaultRiotClient.bind(ci), t('EasyToLaunch.riotClient'))
    })
  }

  return arr
})
</script>

<style lang="less" scoped>
.easy-to-launch-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.launch-item {
  display: flex;
  align-items: center;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.05);
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .logo {
    width: 28px;
    height: 28px;
    margin-right: 16px;
  }

  .label {
    font-weight: bold;
    font-size: 14px;
    width: 96px;
    color: rgba(255, 255, 255, 0.8);
  }
}
</style>
