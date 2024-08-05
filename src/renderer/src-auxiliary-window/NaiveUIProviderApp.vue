<template>
  <NConfigProvider
    :theme-overrides="themeOverrides"
    :theme="darkTheme"
    :locale="zhCN"
    :date-locale="dateZhCN"
    id="naive-ui-config-provider"
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
    color: '#313131fa'
  }
}
</script>

<style></style>
