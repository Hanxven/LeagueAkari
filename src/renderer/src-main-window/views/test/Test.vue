<template>
  <!-- <OngoingGameNew /> -->
  <!-- <ChampionIcon :champion-id="4" /> -->
  <SpectateStatus />
</template>

<script lang="ts" setup>
import ChampionIcon from '@shared/renderer/components/widgets/ChampionIcon.vue'
import { ref } from 'vue'

import SpectateStatus from '../match-history/widgets/SpectateStatus.vue'
import OngoingGameNew from '../ongoing-game/OngoingGameNew.vue'
</script>

<style lang="less" scoped></style>
