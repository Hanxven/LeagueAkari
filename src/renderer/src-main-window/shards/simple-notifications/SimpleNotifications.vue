<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'

import { SimpleNotificationsRenderer } from '.'

const n = useInstance(SimpleNotificationsRenderer)
n.setupSimpleNotifications()
</script>

<template></template>
