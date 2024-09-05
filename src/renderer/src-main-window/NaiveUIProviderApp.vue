<template>
  <NConfigProvider
    :theme-overrides="themeOverrides"
    :theme="darkTheme"
    :locale="zhCN"
    :date-locale="dateZhCN"
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
import {
  GlobalThemeOverrides,
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  NNotificationProvider,
  darkTheme,
  dateZhCN,
  zhCN
} from 'naive-ui'

import App from './App.vue'

const themeOverrides: GlobalThemeOverrides = {
  Notification: { padding: '12px', color: '#313131fa' },
  Popover: {
    color: '#1f1f1ffa'
  },
  Message: {
    color: '#272727'
  },
  Menu: {
    padding: '1px'
  }
}
</script>
