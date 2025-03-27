<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'

import { MainWindowNotificationsRenderer } from '.'

const n = useInstance(MainWindowNotificationsRenderer)
n.setupMainWindowNotifications()
</script>

<template></template>
