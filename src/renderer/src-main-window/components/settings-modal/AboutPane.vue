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
          style="height: 160px; width: 160px"
          src="@renderer-shared/assets/logo-hollow.svg"
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
    </NScrollbar>
    <div class="about-para copyright">
      {{ t('AboutPane.copyright') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LEAGUE_AKARI_GITHUB } from '@shared/constants/common'
import { useTranslation } from 'i18next-vue'
import { NScrollbar, useMessage } from 'naive-ui'
import { h } from 'vue'

const { t } = useTranslation()

const as = useAppCommonStore()

const message = useMessage()

const handleClickEasterEgg = () => {
  message.create(() => h(LeagueAkariSpan, { bold: true }), {
    type: 'success',
    keepAliveOnHover: true
  })
}
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
</style>
