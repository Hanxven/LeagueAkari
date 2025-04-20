<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div style="margin-bottom: 12px">此页面被用于测试功能，仅在开发环境或 .rabi 版本中可见。</div>
      <NButton tertiary type="primary" @click="stubGetHomeHub"
        >恶魔手契成为三体人 (请先过新手教程)</NButton
      >
      <div class="markdown-text markdown-body" v-html="markdownHtmlText"></div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { markdownIt } from '@renderer-shared/utils/markdown'
import { NButton, NScrollbar, useMessage } from 'naive-ui'
import { computed, h } from 'vue'

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
              BonusCritChance: 100,
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

const textT = `# League Akari

## League Akari

### League Akari

#### League Akari

##### League Akari

###### League Akari

**League Akari** *League Akari*

<div style="color: orange; font-weight: bold;">League Akari</div>

\`League Akari\`

***League Akari***

~~League Akari~~

\`\`\`
fn league_akari(rabi: &str) {
    println!("Hello, {}!", rabi);
}
\`\`\`

1. ✅ League
2. ✅ Akari
    - ✅ League
        - League
        - Akari
    - ✅ Akari
        - League
        - Akari

> League Akari`

const markdownHtmlText = computed(() => {
  return markdownIt.render(textT)
})
</script>

<style lang="less" scoped>
.single-root {
  height: 100%;
}

.markdown-text {
  user-select: text;

  max-width: 800px;
}
</style>
