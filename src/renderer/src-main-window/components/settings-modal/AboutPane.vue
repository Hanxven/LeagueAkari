<template>
  <NScrollbar style="max-height: 65vh" trigger="none">
    <div style="padding: 16px 16px 8px">
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
        <LeagueAkariSpan bold @click="() => handleClickEasterEgg()" /> (联盟阿卡林，Version
        {{ as.version }})
        是开源软件，专注于提供一些额外的功能，以辅助英雄联盟的游戏体验，其几乎所有实现都依赖
        <a target="_blank" href="https://riot-api-libraries.readthedocs.io/en/latest/lcu.html"
          >League Client Update (LCU)</a
        >。
        <a target="_blank" :href="`${LEAGUE_AKARI_GITHUB}?tab=readme-ov-file#4-%E5%8F%82%E8%80%83`"
          >项目参考</a
        >.
      </div>

      <div class="about-para-2">
        <span>GitHub：</span>
        <a target="_blank" :href="LEAGUE_AKARI_GITHUB" style="text-indent: 0; margin-right: 8px"
          >League Akari</a
        >
        <a target="_blank" :href="LEAGUE_AKARI_GITHUB">
          <img
            alt="GitHub Repo stars"
            src="https://img.shields.io/github/stars/Hanxven/LeagueAkari"
        /></a>
      </div>
      <div class="divider" />
      <NCard size="small">
        <ControlItem
          class="control-item-margin"
          label="检查更新"
          :label-description="`从下载源中 (${UPDATE_SOURCE_MAP[sus.settings.downloadSource]}) 中检查更新`"
          :label-width="180"
        >
          <NFlex align="center">
            <NButton
              size="small"
              :loading="sus.isCheckingUpdates"
              secondary
              type="primary"
              @click="() => handleCheckUpdates()"
              >检查更新</NButton
            >
            <NButton
              size="small"
              v-if="sus.newUpdates"
              secondary
              @click="() => handleShowUpdateModal()"
              >新版本内容</NButton
            >
            <span v-if="sus.lastCheckAt" style="font-size: 12px"
              >最近检查 {{ dayjs(sus.lastCheckAt).locale('zh-cn').fromNow() }}</span
            >
          </NFlex>
        </ControlItem>
        <ControlItem
          v-if="sus.updateProgressInfo"
          class="control-item-margin"
          label="更新流程"
          label-description="正在进行的更新流程"
          :label-width="180"
        >
          <NSteps
            size="small"
            horizontal
            :current="processStatus.current"
            :status="processStatus.status"
          >
            <NStep>
              <template #title><span class="step-title">下载更新包</span></template>
              <div class="step-description">
                已完成 {{ (sus.updateProgressInfo.downloadingProgress * 100).toFixed() }} %
              </div>
              <div class="step-description" v-if="sus.updateProgressInfo.phase === 'downloading'">
                剩余 {{ formatTime(sus.updateProgressInfo.downloadTimeLeft) }}
              </div>
              <div
                class="step-description"
                v-if="sus.updateProgressInfo.phase === 'download-failed'"
              >
                下载出错
              </div>
            </NStep>
            <NStep>
              <template #title><span class="step-title">解压更新包</span></template>
              <div class="step-description">
                已完成 {{ (sus.updateProgressInfo.unpackingProgress * 100).toFixed() }} %
              </div>
              <div class="step-description" v-if="sus.updateProgressInfo.phase === 'unpack-failed'">
                解压出错
              </div>
            </NStep>
            <NStep>
              <template #title><span class="step-title">等待重新启动</span></template>
              <div class="step-description">关闭应用后将进行自动更新流程</div>
            </NStep>
          </NSteps>
        </ControlItem>
        <ControlItem
          class="control-item-margin"
          label="更新文件夹"
          label-description="当前更新已下载的位置，若无法执行完整的自动更新流程，则需要手动更新"
          :label-width="180"
          v-if="
            processStatus.current >= 2 ||
            (processStatus.current === 1 && processStatus.status !== 'error')
          "
        >
          <NButton size="small" secondary @click="() => su.openNewUpdatesDir()">打开目录</NButton>
        </ControlItem>
      </NCard>
      <div class="about-para copyright">
        © 2024 Hanxven. 本软件是开源软件，遵循 GPL-3.0 许可证。
      </div>
    </div>
  </NScrollbar>
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
import { NButton, NCard, NFlex, NScrollbar, NStep, NSteps, useMessage } from 'naive-ui'
import { computed, h, inject } from 'vue'

const UPDATE_SOURCE_MAP = {
  github: 'GitHub',
  gitee: 'Gitee'
}

const as = useAppCommonStore()
const sus = useSelfUpdateStore()
const su = useInstance<SelfUpdateRenderer>('self-update-renderer')

const message = useMessage()

const handleClickEasterEgg = () => {
  message.create(() => h(LeagueAkariSpan, { bold: true }), {
    type: 'success',
    keepAliveOnHover: true
  })
}

const handleCheckUpdates = async () => {
  const result = await su.checkUpdates()
  switch (result) {
    case 'no-updates':
      message.success('当前已是最新版本')
      break
    case 'new-updates':
      message.success('发现新版本')
      break
    case 'failed':
      message.warning('检查更新失败')
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

.card-header-title {
  font-weight: bold;
  font-size: 18px;
}

.divider {
  height: 1px;
  background-color: rgb(54, 54, 54);
  margin: 12px 0px;
}

.control-item-margin {
  &:not(:last-child) {
    margin-bottom: 12px;
  }
}

.step-title {
  font-size: 12px;
}

.step-description {
  font-size: 11px;
}
</style>
