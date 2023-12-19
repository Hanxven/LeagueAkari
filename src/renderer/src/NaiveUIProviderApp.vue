<template>
  <NConfigProvider
    :theme="darkTheme"
    :locale="zhCN"
    :date-locale="dateZhCN"
    id="naive-ui-config-provider"
  >
    <!-- 这嵌套看的我头大 -->
    <!-- 需要给一个相对于 Title Bar 的偏移量 -->
    <NMessageProvider :container-style="{ top: 'calc(var(--app-title-bar-height) + 12px)' }">
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
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  NNotificationProvider,
  darkTheme,
  dateZhCN,
  zhCN
} from 'naive-ui'

import App from './App.vue'
</script>
