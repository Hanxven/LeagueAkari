<template>
  <NCard
    size="small"
    hoverable
    class="card"
    v-if="typeof summoner === 'object'"
    @click="handleToSummoner"
  >
    <template #header>
      <span class="search-condition">
        <template v-if="condition === 'name'">名称为 </template>
        <template v-else-if="condition === 'id'">ID 为 </template>
        <template v-else-if="condition === 'puuid'">PUUID 为 </template>
        <span class="highlight">{{ searchText }}</span
        ><span class="privacy-private" v-if="summoner.privacy === 'PRIVATE'">
          (隐藏生涯)</span
        ></span
      >
    </template>
    <div class="summoner-info">
      <LcuImage
        class="image"
        :src="`/lol-game-data/assets/v1/profile-icons/${summoner.profileIconId}.jpg`"
      />
      <CopyableText
        class="name"
        :text="summonerName(summoner.gameName || summoner.displayName, summoner.tagLine)"
      />
    </div>
  </NCard>
  <NCard size="small" hoverable class="card" v-else>
    <template #header>
      <span class="search-condition">
        <span class="highlight">{{ selfData?.internalName || summoner }}</span
        ><span class="privacy-private" v-if="selfData?.privacy === 'PRIVATE'">
          (隐藏生涯)</span
        ></span
      >
    </template>
    <div class="summoner-info">
      <LcuImage
        class="image"
        :src="
          selfData?.profileIconId
            ? `/lol-game-data/assets/v1/profile-icons/${selfData.profileIconId}.jpg`
            : undefined
        "
      />
      <CopyableText
        class="name"
        :text="summonerName(selfData?.gameName || selfData?.displayName, selfData?.tagLine)"
      />
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { EMPTY_PUUID } from '@shared/constants'
import CopyableText from '@shared/renderer/components/CopyableText.vue'
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import { getSummonerByPuuid } from '@shared/renderer/http-api/summoner'
import { laNotification } from '@shared/renderer/notification'
import { SummonerInfo } from '@shared/types/lcu/summoner'
import { summonerName } from '@shared/utils/name'
import { NCard } from 'naive-ui'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 内部组件
const props = defineProps<{
  condition?: 'name' | 'id' | 'puuid'
  searchText?: string

  // 如果提供 ID，那么就加载
  // 或者直接提供现成的数据
  summoner: SummonerInfo | string
}>()

const selfData = ref<SummonerInfo>()

const route = useRoute()
const router = useRouter()

onMounted(async () => {
  if (typeof props.summoner === 'string') {
    try {
      selfData.value = (await getSummonerByPuuid(props.summoner)).data
    } catch (error) {
      laNotification.warn('卡片组件', '加载召唤师信息时失败', error)
    }
  }
})

const handleToSummoner = () => {
  const id = typeof props.summoner === 'object' ? props.summoner.puuid : props.summoner

  if (!id || id === EMPTY_PUUID) {
    return
  }

  router.replace(`/match-history/${id}`)
}
</script>

<style lang="less" scoped>
.card {
  cursor: pointer;
  background-color: rgb(22, 22, 22);
}
.search-condition {
  font-size: 13px;
  color: #5e5e5e;

  .highlight {
    color: #fff;
    font-weight: 700;
  }

  .privacy-private {
    font-size: 13px;
    color: rgb(227, 55, 55);
  }
}

.summoner-info {
  display: flex;
  align-items: center;
}

.image {
  height: 48px;
  width: 48px;
  border-radius: 50%;
}

.name {
  margin-left: 8px;
  font-size: 14px;
  font-weight: 700;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
