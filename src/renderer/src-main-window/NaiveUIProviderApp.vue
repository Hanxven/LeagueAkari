<template>
  <NConfigProvider
    :theme-overrides="themeOverrides"
    :theme="darkTheme"
    :locale="naiveUiLocale.locale"
    :date-locale="naiveUiLocale.dateLocale"
    abstract
    inline-theme-disabled
  >
    <NMessageProvider :container-style="{ top: 'calc(var(--title-bar-height) + 12px)' }">
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
import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
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
import { useI18n } from 'vue-i18n'

import App from './App.vue'

const app = useInstance<AppCommonRenderer>('app-common-renderer')

app.useI18nSync()

const { locale } = useI18n()

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
    color: '#272727'
  },
  Menu: {
    padding: '1px'
  }
}

const NAIVE_UI_LOCALE = {
  'zh-cn': {
    dateLocale: dateZhCN,
    locale: zhCN
  },
  en: {
    dateLocale: dateEnUS,
    locale: enUS
  }
}

const naiveUiLocale = computed(() => {
  return NAIVE_UI_LOCALE[locale.value] || NAIVE_UI_LOCALE['en']
})
</script>
