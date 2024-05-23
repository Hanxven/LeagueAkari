<template>
  <NConfigProvider
    :theme-overrides="themeOverrides"
    :theme="darkTheme"
    :locale="zhCN"
    :date-locale="dateZhCN"
    id="naive-ui-config-provider"
  >
    <!-- 需要给一个相对于 Title Bar 的偏移量 -->
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
  Notification: { padding: '12px', color: '#272727' },
  Popover: {
    color: '#272727fa'
  },
  Message: {
    color: '#272727'
  }
}
</script>

<style>
#g {
  color: #1a253f;
}
</style>
