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
  const res = await edsm.sgp.getSpectatorGameflow('58d32d08-aede-5bcf-adf3-c218c3025f62')
  console.log(res)
})

const spectatorToken = {
  observerEncryptionKey: 'TEST',
  puuid: 'TEST',
  region: 'TEST'
}
</script>

<style lang="less" scoped></style>
