<template>
  <NConfigProvider
    :theme-overrides="themeOverrides"
    :theme="darkTheme"
    :locale="naiveUiLocale"
    abstract
    inline-theme-disabled
    :date-locale="dateZhCN"
  >
    <NMessageProvider placement="bottom">
      <NNotificationProvider>
        <NDialogProvider>
          <App />
        </NDialogProvider>
      </NNotificationProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import {
  GlobalThemeOverrides,
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  NNotificationProvider,
  darkTheme,
  dateEnUS,
  dateZhCN,
  enUS,
  zhCN
} from 'naive-ui'
import { computed } from 'vue'

import App from './App.vue'

const as = useAppCommonStore()

const themeOverrides: GlobalThemeOverrides = {
  Notification: { padding: '12px' },
  Card: {
    color: '#0000',
    paddingSmall: '4px 12px'
  },
  Message: {
    padding: '4px 8px',
    fontSize: '12px',
    iconSize: '16px',
    iconMargin: '0 4px 0 0'
  },
  Popover: {
    color: '#1f1f1ffa'
  }
}

const NAIVE_UI_LOCALE = {
  'zh-CN': {
    dateLocale: dateZhCN,
    locale: zhCN
  },
  en: {
    dateLocale: dateEnUS,
    locale: enUS
  }
}

const naiveUiLocale = computed(() => {
  return NAIVE_UI_LOCALE[as.settings.locale] || NAIVE_UI_LOCALE['en']
})
</script>

<style></style>
