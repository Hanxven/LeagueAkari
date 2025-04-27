<template></template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'

import { SetupInAppScopeRenderer } from '.'

const inst = useInstance(SetupInAppScopeRenderer)

inst.setup()
</script>
