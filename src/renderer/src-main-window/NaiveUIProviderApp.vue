<template>
  <NConfigProvider
    :theme-overrides="themeOverrides"
    :theme="darkTheme"
    :locale="naiveUiLocale.locale"
    :date-locale="naiveUiLocale.dateLocale"
    abstract
    inline-theme-disabled
  >
    <NMessageProvider
      :container-style="{ top: 'calc(var(--title-bar-height) + 12px)' }"
      placement="top-right"
    >
      <NNotificationProvider placement="bottom-right">
        <NDialogProvider>
          <App />
        </NDialogProvider>
      </NNotificationProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
// @ts-ignore
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useTranslation } from 'i18next-vue'
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
  Notification: { padding: '12px', color: '#313131fa' },
  Popover: {
    color: '#1f1f1ffa',
    fontSize: '12px'
  },
  Card: {
    colorModal: '#232329'
  },
  Message: {
    colorInfo: 'rgba(45, 45, 55, 1)',
    colorSuccess: 'rgba(45, 45, 55, 1)',
    colorWarning: 'rgba(45, 45, 55, 1)',
    colorError: 'rgba(45, 45, 55, 1)'
  },
  Menu: {
    padding: '1px'
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
