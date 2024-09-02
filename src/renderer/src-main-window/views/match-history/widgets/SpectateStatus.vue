<template>
  <div>1</div>
</template>

<script setup lang="ts">
import { SpectatorData } from '@shared/data-sources/sgp/types'
import { externalDataSourceRendererModule as edsm } from '@renderer-shared/modules/external-data-source'
import { watchEffect } from 'vue'

const props = defineProps<{
  data?: SpectatorData
}>()

watchEffect(async () => {
  const res = await edsm.sgp.getSpectatorGameflow('9d0e0220-dab2-5c36-8994-29ec82c7fd42')
  console.log(res)
})

const spectatorToken = {
  observerEncryptionKey: 'TEST',
  puuid: 'TEST',
  region: 'TEST'
}
</script>

<style lang="less" scoped></style>
