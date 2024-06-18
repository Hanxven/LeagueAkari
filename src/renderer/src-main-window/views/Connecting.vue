<template>
  <div class="waiting-screen">
    <div class="border"></div>
    <div class="inner-content">
      <LeagueAkariSpan class="akari-text" bold />
      <template v-if="lc.state === 'disconnected' || lc.state === 'connecting'">
        <div v-if="lc.launchedClients.length" class="text-line-1">
          <div class="servers-available">已启动的客户端</div>
          <NScrollbar style="max-height: 45vh" trigger="none">
            <div
              v-for="a of lc.launchedClients"
              :key="a.pid"
              class="client"
              :style="{
                cursor:
                  lc.connectingClient && lc.connectingClient.pid !== a.pid
                    ? 'not-allowed'
                    : 'cursor'
              }"
              @click="() => handleConnect(a)"
            >
              <span class="region" title="地区"
                ><NSpin
                  v-if="lc.connectingClient?.pid === a.pid"
                  :size="12"
                  class="left-widget"
                /><NIcon v-else class="left-widget" style="vertical-align: text-bottom"
                  ><CubeSharp
                /></NIcon>
                {{ regionText[a.region] || a.region }}</span
              >
              <span class="rso" title="区服">{{
                rsoPlatformText[a.rsoPlatformId] || a.rsoPlatformId
              }}</span>
              <span class="pid" title="Process ID">{{ a.pid }}</span>
            </div>
          </NScrollbar>
        </div>
        <div v-else class="text-line-1">
          <template v-if="!app.isAdministrator && app.settings.useWmic"
            >基于 WMIC 的连接方式需要管理员权限</template
          >
          <template v-else>等待游戏客户端启动</template>
        </div>
      </template>
      <div v-else class="connected-text">已连接，加载中</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LeagueAkariSpan from '@shared/renderer/components/LeagueAkariSpan.vue'
import { useAppStore } from '@shared/renderer/modules/app/store'
import { lcuConnectionRendererModule as lcm } from '@shared/renderer/modules/lcu-connection'
import { LcuAuth, useLcuConnectionStore } from '@shared/renderer/modules/lcu-connection/store'
import { regionText, rsoPlatformText } from '@shared/utils/rso-platforms'
import { CubeSharp } from '@vicons/ionicons5'
import { NIcon, NScrollbar, NSpin } from 'naive-ui'
import { useRouter } from 'vue-router'

const router = useRouter()

const app = useAppStore()
const lc = useLcuConnectionStore()

const handleConnect = (auth: LcuAuth) => {
  lcm.lcuConnect(auth)
}
</script>

<style scoped lang="less">
.waiting-screen {
  position: relative;
  height: 100%;
  background-color: var(--background-color-primary);
  box-sizing: border-box;
}

.border {
  position: absolute;
  inset: 0;
  border: 1px rgb(73, 73, 73) solid;
  border-radius: 4px;
  margin: 18px;
}

.akari-text {
  font-size: 22px;
  margin-bottom: 12px;
}

.inner-content {
  display: flex;
  position: relative;
  top: calc(var(--title-bar-height) * -0.5);
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100%;
}

.text-line-1 {
  color: rgb(174, 174, 174);
  font-size: 14px;
  font-weight: 700;
}

.text-line-1:not(:last-child) {
  margin-bottom: 12px;
}

.admin-hint {
  text-align: center;
  color: rgb(127, 127, 127);
  font-size: 12px;
  margin-bottom: 12px;

  .em {
    color: rgb(180, 180, 180);
    font-weight: 700;
  }
}

.error-hint {
  text-align: center;
  color: rgb(185, 135, 135);
  font-size: 12px;
}

.client {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 24px;
  transition: 0.3s all ease;
  cursor: pointer;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.03);
  width: 240px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }

  &:active {
    background-color: rgba(255, 255, 255, 0.2);
  }

  &:not(:last-child) {
    margin-bottom: 4px;
  }

  .region {
    font-size: 14px;
    color: #fff;
  }

  .rso {
    font-size: 14px;
    font-weight: 700;
    margin-left: 8px;
  }

  .pid {
    font-size: 12px;
    color: #5d5c5c;
    margin-left: 8px;
  }

  .left-widget {
    margin-right: 8px;
    font-size: 16px;
  }
}

.servers-available {
  font-size: 16px;
  font-weight: 700;
  padding: 0 24px;
  margin-bottom: 12px;
  color: #fff;
  text-align: center;
}

.connected-text {
  font-size: 16px;
  font-weight: 700;
  padding: 0 24px;
  color: #fff;
  text-align: center;
}
</style>
