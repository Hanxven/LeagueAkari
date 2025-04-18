<template>
  <div
    style="
      height: 65vh;
      padding: 16px 16px 8px;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    "
  >
    <NScrollbar style="flex-grow: 1">
      <div
        style="display: flex; justify-content: center; vertical-align: bottom; margin-bottom: 16px"
      >
        <img
          style="height: 108px; width: 108px"
          src="@main-window/assets/logo.png"
          alt="Logo of League Akari"
        />
      </div>
      <div class="about-para">
        <LeagueAkariSpan bold @click="() => handleClickEasterEgg()" />{{
          t('AboutPane.line1', { version: as.version })
        }}
        <a target="_blank" href="https://riot-api-libraries.readthedocs.io/en/latest/lcu.html"
          >League Client Update (LCU)</a
        >.
        <a
          target="_blank"
          :href="`${LEAGUE_AKARI_GITHUB}?tab=readme-ov-file#4-%E5%8F%82%E8%80%83`"
          >{{ t('AboutPane.line2') }}</a
        >.
      </div>
      <div class="about-para-2">
        <span style="margin-right: 4px">GitHub: </span>
        <a target="_blank" :href="LEAGUE_AKARI_GITHUB" style="text-indent: 0; margin-right: 8px"
          >League Akari</a
        >
        <a target="_blank" :href="LEAGUE_AKARI_GITHUB">
          <img
            alt="GitHub Repo stars"
            src="https://img.shields.io/github/stars/Hanxven/LeagueAkari"
        /></a>
      </div>
      <NCard size="small" style="margin-top: 16px">
        <ControlItem
          class="control-item-margin"
          :label="t('AboutPane.checkUpdates')"
          :label-description="
            t('AboutPane.checkFrom', { source: UPDATE_SOURCE_MAP[sus.settings.downloadSource] })
          "
          :label-width="180"
        >
          <NFlex align="center">
            <NButton
              size="small"
              :loading="sus.isCheckingUpdates"
              secondary
              type="primary"
              @click="() => handleCheckUpdates()"
              >{{ t('AboutPane.checkUpdates') }}</NButton
            >
            <NButton
              size="small"
              v-if="sus.currentRelease"
              secondary
              @click="() => handleShowUpdateModal()"
            >
              <template v-if="sus.currentRelease.isNew">
                {{ t('AboutPane.newRelease') }}
              </template>
              <template v-else>
                {{ t('AboutPane.currentRelease') }}
              </template>
            </NButton>
            <span v-if="sus.lastCheckAt" style="font-size: 12px"
              >{{ t('AboutPane.lastCheckAt') }}
              {{ dayjs(sus.lastCheckAt).locale(as.settings.locale.toLowerCase()).fromNow() }}</span
            >
          </NFlex>
        </ControlItem>
        <ControlItem
          v-if="sus.updateProgressInfo"
          class="control-item-margin"
          :label="t('AboutPane.updateProgress.label')"
          :label-description="t('AboutPane.updateProgress.description')"
          :label-width="180"
        >
          <NSteps
            size="small"
            horizontal
            :current="processStatus.current"
            :status="processStatus.status"
          >
            <NStep>
              <template #title>
                <span class="step-title">{{ t('AboutPane.updateProgress.downloading') }}</span>
              </template>
              <div class="step-description">
                {{
                  t('AboutPane.updateProgress.finished', {
                    progress: (sus.updateProgressInfo.downloadingProgress * 100).toFixed()
                  })
                }}
              </div>
              <div class="step-description" v-if="sus.updateProgressInfo.phase === 'downloading'">
                {{
                  t('AboutPane.updateProgress.remain', {
                    time: formatTime(sus.updateProgressInfo.downloadTimeLeft)
                  })
                }}
              </div>
              <div
                class="step-description"
                v-if="sus.updateProgressInfo.phase === 'download-failed'"
              >
                {{ t('AboutPane.updateProgress.downloadFailed') }}
              </div>
            </NStep>
            <NStep>
              <template #title>
                <span class="step-title">{{ t('AboutPane.updateProgress.unpacking') }}</span>
              </template>
              <div class="step-description">
                {{
                  t('AboutPane.updateProgress.finished', {
                    progress: (sus.updateProgressInfo.unpackingProgress * 100).toFixed()
                  })
                }}
              </div>
              <div class="step-description" v-if="sus.updateProgressInfo.phase === 'unpack-failed'">
                {{ t('AboutPane.updateProgress.unpackFailed') }}
              </div>
            </NStep>
            <NStep>
              <template #title>
                <span class="step-title">{{
                  t('AboutPane.updateProgress.waitingForRestart')
                }}</span>
              </template>
              <div class="step-description">
                {{ t('AboutPane.updateProgress.waitingForRestartDescription') }}
              </div>
            </NStep>
          </NSteps>
        </ControlItem>
        <ControlItem
          class="control-item-margin"
          :label="t('AboutPane.updateDir.label')"
          :label-description="t('AboutPane.updateDir.description')"
          :label-width="180"
          v-if="
            processStatus.current >= 2 ||
            (processStatus.current === 1 && processStatus.status !== 'error')
          "
        >
          <NButton size="small" secondary @click="() => su.openNewUpdatesDir()">{{
            t('AboutPane.updateDir.open')
          }}</NButton>
        </ControlItem>
      </NCard>
    </NScrollbar>
    <div class="about-para copyright">
      {{ t('AboutPane.copyright') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { SelfUpdateRenderer } from '@renderer-shared/shards/self-update'
import { useSelfUpdateStore } from '@renderer-shared/shards/self-update/store'
import { LEAGUE_AKARI_GITHUB } from '@shared/constants/common'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NFlex, NScrollbar, NStep, NSteps, useMessage } from 'naive-ui'
import { computed, h, inject } from 'vue'

const UPDATE_SOURCE_MAP = {
  github: 'GitHub',
  gitee: 'Gitee'
}

const { t } = useTranslation()

const as = useAppCommonStore()
const sus = useSelfUpdateStore()
const su = useInstance(SelfUpdateRenderer)

const message = useMessage()

const handleClickEasterEgg = () => {
  message.create(() => h(LeagueAkariSpan, { bold: true }), {
    type: 'success',
    keepAliveOnHover: true
  })
}

const handleCheckUpdates = async () => {
  const { result, reason } = await su.checkUpdates()
  switch (result) {
    case 'no-updates':
      message.success(() => t('AboutPane.checkUpdatesResult.no-updates'))
      break
    case 'new-updates':
      message.success(() => t('AboutPane.checkUpdatesResult.new-updates'))
      break
    case 'failed':
      message.warning(() => t('AboutPane.checkUpdatesResult.failed', { reason }))
      break
  }
}

const appInject = inject('app') as any

const handleShowUpdateModal = async () => {
  appInject.openUpdateModal()
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 99) {
    return '99+ h'
  }

  if (hours > 0) {
    return `${hours.toFixed()} h`
  } else if (minutes > 0) {
    return `${minutes.toFixed()} m`
  } else {
    return `${secs.toFixed()} s`
  }
}

const processStatus = computed(() => {
  if (!sus.updateProgressInfo) {
    return {
      current: 0,
      status: 'wait' as any // utilize 'any' to suppress type error
    }
  }

  switch (sus.updateProgressInfo.phase) {
    case 'downloading':
      return {
        current: 1,
        status: 'process'
      }
    case 'download-failed':
      return {
        current: 1,
        status: 'error'
      }
    case 'unpacking':
      return {
        current: 2,
        status: 'process'
      }
    case 'unpack-failed':
      return {
        current: 2,
        status: 'error'
      }
    case 'waiting-for-restart':
      return {
        current: 3,
        status: 'process'
      }
    default:
      return {
        current: 0,
        status: 'wait'
      }
  }
})
</script>

<style lang="less" scoped>
.about-para {
  font-size: 13px;
}

.about-para-2 {
  display: flex;
  align-items: center;
  margin-top: 4px;
  font-size: 13px;

  img {
    display: block;
  }
}

.copyright {
  margin-top: 8px;
  font-size: 12px;
  color: rgb(87, 87, 87);
}

.divider {
  height: 1px;
  background-color: rgb(54, 54, 54);
  margin: 12px 0px;
}

[data-theme='dark'] {
  .divider {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

[data-theme='light'] {
  .divider {
    background-color: rgba(0, 0, 0, 0.1);
  }
}

.step-title {
  font-size: 12px;
}

.step-description {
  font-size: 11px;
}
</style>
