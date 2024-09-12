<template>
  <OngoingGame />
  <!-- <ChampionIcon :champion-id="4" /> -->
</template>

<script lang="ts" setup>
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { ref } from 'vue'

import SpectateStatus from '../match-history/widgets/SpectateStatus.vue'
import OngoingGame from '../ongoing-game/OngoingGame.vue'
</script>

<style lang="less" scoped></style>
