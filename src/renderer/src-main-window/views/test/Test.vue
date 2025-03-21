<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div style="margin-bottom: 12px">
        This page is reserved for testing scenarios. Shows in DEV or .rabi versions only.
      </div>
      <NButton tertiary type="primary" @click="stubGetHomeHub"
        >恶魔手契成为三体人 (请先过新手教程)</NButton
      >
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { duration } from 'dayjs'
import { NButton, NScrollbar, useMessage } from 'naive-ui'
import { h } from 'vue'

import { initialState } from './boba-minigame'

const lc = useInstance(LeagueClientRenderer)

const message = useMessage()

const stubGetHomeHub = async () => {
  const { data } = await lc._http.request({
    method: 'GET',
    url: '/lol-settings/v2/account/LCUPreferences/lol-home-hubs'
  })

  const prevState = data?.data?.['boba-minigame']

  if (prevState) {
    await lc._http.request({
      method: 'PATCH',
      url: '/lol-settings/v2/account/LCUPreferences/lol-home-hubs',
      data: {
        data: {
          'boba-minigame': {
            ...prevState,
            hp: 100,
            currency: 114514,
            runBonusStats: {
              BonusBaseCardDamage: 999999999,
              BonusCritChance: 0,
              BonusMaxHp: 0
            }
          }
        },
        schemaVersion: 1
      }
    })
  } else {
    await lc._http.request({
      method: 'PATCH',
      url: '/lol-settings/v2/account/LCUPreferences/lol-home-hubs',
      data: {
        data: {
          'boba-minigame': {
            ...initialState,
            hp: 100,
            currency: 114514,
            runBonusStats: {
              BonusBaseCardDamage: 999999999,
              BonusCritChance: 0,
              BonusMaxHp: 0
            }
          }
        },
        schemaVersion: 1
      }
    })
  }

  message.success(
    () =>
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }
        },
        [
          h('span', '修改成功。请重启游戏客户端以生效'),
          h(
            NButton,
            { type: 'primary', size: 'tiny', onClick: () => lc.api.riotclient.restartUx() },
            '-> 重启 UX'
          )
        ]
      ),
    { duration: 10000, closable: true }
  )
}
</script>

<style lang="less" scoped>
.single-root {
  height: 100%;
}
</style>
