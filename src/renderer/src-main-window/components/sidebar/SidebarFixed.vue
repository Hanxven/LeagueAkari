<template>
  <div class="sidebar-fixed">
    <NPopover placement="right" v-if="rts.settings.enabled && rts.info.isDead">
      <template #trigger>
        <div class="menu-item">
          <div class="menu-item-inner">
            <NProgress
              type="circle"
              :gap-offset-degree="180"
              :stroke-width="4"
              :percentage="(rts.info.timeLeft / rts.info.totalTime) * 100"
              status="success"
            >
              <span class="respawn-timer-countdown">{{ formattedCountdown }}</span>
            </NProgress>
            <NIcon class="respawn-timer-hourglass"><HourglassIcon /></NIcon>
          </div>
        </div>
      </template>
      <div>
        {{ t('SideBarFixed.respawnTimer.timeLeft', { seconds: rts.info.timeLeft.toFixed(0) }) }} ({{
          rts.info.totalTime.toFixed(0)
        }} s)
      </div>
    </NPopover>
    <NPopover placement="right">
      <template #trigger>
        <div class="menu-item">
          <div class="menu-item-inner">
            <NProgress
              v-if="lcs.summoner.me"
              @click="handleSummonerClick(lcs.summoner.me)"
              type="circle"
              :stroke-width="4"
              :percentage="
                (lcs.summoner.me.xpSinceLastLevel / lcs.summoner.me.xpUntilNextLevel) * 100
              "
              :gap-degree="45"
            >
              <LcuImage
                class="summoner-profile-icon"
                :src="profileIconUri(lcs.summoner.me.profileIconId)"
              />
            </NProgress>
            <NBadge v-else dot processing :show="lcs.isDisconnected && clients.others.length > 0">
              <NIcon class="menu-item-icon"><BareMetalServerIcon /></NIcon>
            </NBadge>
          </div>
        </div>
      </template>
      <span class="menu-item-popover">
        <div class="summoner-name" v-if="lcs.summoner.me">
          <span class="game-name-line">{{ lcs.summoner.me.gameName }}</span>
          <span class="tag-line">#{{ lcs.summoner.me.tagLine }}</span>
        </div>
        <template v-if="clients.current">
          <div class="separator" v-if="lcs.summoner.me"></div>
          <div class="title-label">
            <NIcon class="icon"><BareMetalServerIcon /></NIcon>
            <span>{{ t('SideBarFixed.currentConnected') }}</span>
          </div>
          <div class="client">
            <div class="region-name">
              {{ REGION_NAME[clients.current.region] || clients.current.region }}
            </div>
            <div class="rso-name" v-if="clients.current.rsoPlatformId">
              {{
                TENCENT_RSO_PLATFORM_NAME[clients.current.rsoPlatformId] ||
                clients.current.rsoPlatformId
              }}
            </div>
            <div class="pid">(PID: {{ clients.current.pid }})</div>
          </div>
        </template>
        <template v-if="clients.others.length !== 0">
          <div class="separator"></div>
          <div class="launched-clients">
            <div class="title-label">
              <NIcon class="icon"><BareMetalServerIcon /></NIcon>
              <span>{{ t('SideBarFixed.launchedClients') }}</span>
            </div>
            <NScrollbar style="max-height: 180px">
              <div
                v-for="client of clients.others"
                class="client"
                :class="{
                  connectable: !client.isConnecting
                }"
                @click="handleConnectToLeagueClient(client)"
              >
                <div class="region-name">
                  {{ REGION_NAME[client.region] || client.region }}
                </div>
                <div class="rso-name" v-if="!client.rsoPlatformId">
                  {{ TENCENT_RSO_PLATFORM_NAME[client.rsoPlatformId] || client.rsoPlatformId }}
                </div>
                <div class="pid">(PID: {{ client.pid }})</div>
                <NSpin v-if="client.isConnecting" class="loading" :size="12" />
              </div>
            </NScrollbar>
          </div>
        </template>
        <template v-if="!clients.current && clients.others.length === 0">
          <div class="title-label">
            <NIcon class="icon"><PlugDisconnected24FilledIcon /></NIcon>
            <span>{{ t('SideBarFixed.noClientTitle') }}</span>
          </div>
          <div class="no-client">{{ t('SideBarFixed.noClient') }}</div>
        </template>
      </span>
    </NPopover>
    <NTooltip placement="right">
      <template #trigger>
        <div class="menu-item" @click="handleOpenSettingsModal">
          <div class="menu-item-inner">
            <NIcon class="menu-item-icon"><SettingsIcon /></NIcon>
          </div>
        </div>
      </template>
      <span class="simple-popover">
        <div class="title">{{ t('SideBarFixed.settings') }}</div>
      </span>
    </NTooltip>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientUxStore } from '@renderer-shared/shards/league-client-ux/store'
import { UxCommandLine, useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { useRespawnTimerStore } from '@renderer-shared/shards/respawn-timer/store'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import { REGION_NAME, TENCENT_RSO_PLATFORM_NAME } from '@shared/utils/platform-names'
import { BareMetalServer as BareMetalServerIcon, Settings as SettingsIcon } from '@vicons/carbon'
import { PlugDisconnected24Filled as PlugDisconnected24FilledIcon } from '@vicons/fluent'
import { Hourglass as HourglassIcon } from '@vicons/ionicons5'
import { NBadge, NIcon, NPopover, NProgress, NScrollbar, NSpin, NTooltip } from 'naive-ui'
import { computed, inject } from 'vue'
import { useTranslation } from 'i18next-vue'

import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'


const { t } = useTranslation()

const lcs = useLeagueClientStore()
const lcuxs = useLeagueClientUxStore()
const rts = useRespawnTimerStore()

const lc = useInstance<LeagueClientRenderer>('league-client-renderer')
const mh = useInstance<MatchHistoryTabsRenderer>('match-history-tabs-renderer')

const formattedCountdown = computed(() => {
  const seconds = rts.info.timeLeft
  return seconds > 99 ? '99+' : `${seconds.toFixed(0)}`
})

const { navigateToTabByPuuid } = mh.useNavigateToTab()

const handleSummonerClick = (summoner: SummonerInfo) => {
  navigateToTabByPuuid(summoner.puuid)
}

const { openSettingsModal } = inject('app') as any
const handleOpenSettingsModal = () => {
  openSettingsModal()
}

const clients = computed(() => {
  const current = lcs.auth
  const others = lcuxs.launchedClients
    .filter((c) => c.pid !== current?.pid)
    .map((c) => {
      return {
        ...c,
        isConnecting: c.pid === lcs.connectingClient?.pid
      }
    })

  return {
    current,
    others
  }
})

const handleConnectToLeagueClient = (auth: UxCommandLine) => {
  if (lcs.isConnecting) {
    return
  }

  if (lcs.isConnected && lcs.auth?.pid === auth.pid) {
    return
  }

  lc.connect(auth)
}
</script>

<style lang="less" scoped>
.sidebar-fixed {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  position: relative;
  justify-content: center;
  align-items: center;
  height: 52px;
  width: 52px;
  padding: 2px;
  box-sizing: border-box;
  cursor: pointer;

  &:hover {
    .menu-item-icon {
      color: #fff;
    }
  }

  .menu-item-inner {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 72%;
    width: 72%;
    border-radius: 2px;

    .summoner-profile-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
    }
  }

  .menu-item-icon {
    font-size: 24px;
    color: rgba(255, 255, 255, 0.8);
    transition: color 0.2s;
  }

  .menu-item-indicator {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    width: 5px;
    height: 64%;
    border-radius: 4px;
  }
}

.simple-popover {
  .title {
    font-weight: bold;
    font-size: 14px;
  }

  .content {
    margin-top: 8px;
    font-size: 12px;
  }
}

.summoner-name {
  display: flex;
  align-items: flex-end;
  cursor: pointer;

  .game-name-line {
    font-size: 14px;
    font-weight: bold;
  }

  .tag-line {
    margin-left: 4px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }
}

.region {
  display: flex;
  align-items: flex-end;

  .region-name {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
  }

  .rso-name {
    margin-left: 4px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
  }
}

.separator {
  margin: 8px 0;
  width: 100%;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
}

.title-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: bold;
  color: rgba(255, 255, 255, 1);
  margin-bottom: 12px;

  .icon {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.8);
  }
}

.client {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: 0.2s all ease;
  border-radius: 2px;
  background-color: rgba(255, 255, 255, 0.03);
  padding: 4px 16px;

  &.connectable {
    cursor: pointer;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    &:active {
      background-color: rgba(255, 255, 255, 0.08);
    }
  }

  .region-name {
    font-size: 12px;
    color: #fff;
    font-weight: bold;
  }

  .rso-name {
    font-size: 12px;
  }

  .pid {
    font-size: 10px;
    color: #6a6a6ae3;
  }

  &:not(:last-child) {
    margin-bottom: 4px;
  }

  .loading {
    position: absolute;
    right: 0px;
    bottom: 0px;
  }
}

.no-client {
  font-size: 12px;
  color: rgba(255, 255, 255, 1);
}

.respawn-timer-countdown {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.respawn-timer-hourglass {
  color: rgba(255, 255, 255, 0.4);
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 16px;
  transform: translate(25%, 25%);
  animation: hourglass-rotate 6s ease infinite;
}

@keyframes hourglass-rotate {
  0%,
  40% {
    transform: translate(25%, 25%) rotate(0deg); /* 保持静止 */
  }
  50%,
  90% {
    transform: translate(25%, 25%) rotate(180deg); /* 保持静止 */
  }
  100% {
    transform: translate(25%, 25%) rotate(360deg); /* 快速复原 */
  }
}
</style>
