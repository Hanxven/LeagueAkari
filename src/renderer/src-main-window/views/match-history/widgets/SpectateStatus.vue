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
  const res = await edsm.sgp.getSpectatorGameflow('d947ea9e-905f-57f0-8fe2-a38eabe070c0')
  console.log(res)
})

const spectatorToken = {
  observerEncryptionKey: 'TEST',
  puuid: 'TEST',
  region: 'TEST'
}
</script>

<style lang="less" scoped></style>
