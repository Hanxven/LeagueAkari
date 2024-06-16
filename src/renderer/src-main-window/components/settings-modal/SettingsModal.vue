<template>
  <NModal
    transform-origin="center"
    size="small"
    preset="card"
    v-model:show="show"
    :class="styles['settings-modal']"
  >
    <template #header><span class="card-header-title">设置</span></template>
    <NTabs type="line" animated size="small">
      <NTabPane name="basic" tab="应用"><AppSettings /></NTabPane>
      <NTabPane name="match-history" tab="通用"><GeneralSettings /></NTabPane>
      <NTabPane name="process" tab="进程"><ProcessSettings /></NTabPane>
      <NTabPane name="debug" tab="调试"><DebugSettings /></NTabPane>
      <NTabPane name="about" tab="关于">
        <div style="display: flex; justify-content: center; vertical-align: bottom; margin: 24px 0">
          <img
            style="height: 108px; width: 108px"
            src="@main-window/assets/logo.png"
            alt="Logo of League Akari"
          />
        </div>
        <div class="about-para">
          <LeagueAkariSpan bold @click="handleDoubleClick" /> (Version {{ app.version }})
          是一个免费、开源的、基于 Electron
          的应用程序，专注于提供一些额外的功能，以辅助英雄联盟的游戏体验，其所有实现都依赖
          <a target="_blank" href="https://riot-api-libraries.readthedocs.io/en/latest/lcu.html"
            >League Client Update (LCU)</a
          >。
        </div>
        <div class="about-para">
          项目参考：<a
            target="_blank"
            href="https://github.com/Hanxven/LeagueAkari?tab=readme-ov-file#8-%E5%8F%82%E8%80%83"
            >参考</a
          >.
        </div>
        <div class="about-para">
          检查更新：<span
            style="color: rgb(131, 193, 204); text-decoration: underline; cursor: pointer"
            @click="() => am.checkUpdate()"
            >{{ app.updates.isCheckingUpdates ? '正在检查' : '检查更新' }}</span
          >
        </div>
        <div class="about-para-2">
          <span>Github：</span>
          <a
            target="_blank"
            href="https://github.com/Hanxven/LeagueAkari"
            style="text-indent: 0; margin-right: 8px"
            >League Akari</a
          >
          <a target="_blank" href="https://github.com/Hanxven/LeagueAkari">
            <img
              alt="GitHub Repo stars"
              src="https://img.shields.io/github/stars/Hanxven/LeagueAkari"
          /></a>
        </div>
        <div class="about-para copyright">© 2024 Hanxven. 本软件是开源软件，遵循 MIT 许可证。</div>
      </NTabPane>
    </NTabs>
  </NModal>
</template>

<script setup lang="ts">
import LeagueAkariSpan from '@shared/renderer/components/LeagueAkariSpan.vue'
import { appRendererModule as am } from '@shared/renderer/modules/app-new'
import { useAppStore } from '@shared/renderer/modules/app-new/store'
import { NModal, NTabPane, NTabs, useMessage } from 'naive-ui'
import { h, useCssModule } from 'vue'

import AppSettings from './AppSettings.vue'
import DebugSettings from './DebugSettings.vue'
import GeneralSettings from './GeneralSettings.vue'
import ProcessSettings from './ProcessSettings.vue'

const app = useAppStore()
const styles = useCssModule()
const show = defineModel<boolean>('show', { default: false })

const message = useMessage()

const handleDoubleClick = () => {
  message.create(() => h(LeagueAkariSpan, { bold: true }), {
    type: 'success',
    keepAliveOnHover: true
  })
}
</script>

<style lang="less" scoped>
.about-para {
  text-indent: 2em;
  font-size: 13px;
}

.about-para-2 {
  display: flex;
  align-items: center;
  margin-top: 4px;
  text-indent: 2em;
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
</style>

<style lang="less" module>
.settings-modal {
  width: 90%;
  max-width: 768px;
}
</style>
