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
      <CopyableText class="name" :text="summoner.displayName" />
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
      <CopyableText class="name" :text="selfData?.displayName" />
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { NCard } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import CopyableText from '@renderer/components/CopyableText.vue'
import LcuImage from '@renderer/components/LcuImage.vue'
import { notify } from '@renderer/events/notifications'
import { getSummoner } from '@renderer/http-api/summoner'
import { SummonerInfo } from '@renderer/types/summoner'

const id = 'comp:search-summoner'

// 内部组件
const props = defineProps<{
  condition?: 'name' | 'id' | 'puuid'
  searchText?: string

  // 如果提供 ID，那么就加载
  // 或者直接提供现成的数据
  summoner: SummonerInfo | number
}>()

const selfData = ref<SummonerInfo>()

const route = useRoute()
const router = useRouter()

const isCurrentRoute = computed(() => {
  if (route.name === 'match-history' && route.params.summonerId) {
    const id = Number(route.params.summonerId)
    return (
      (typeof props.summoner === 'number' && props.summoner === id) ||
      (typeof props.summoner === 'object' && props.summoner.summonerId === id)
    )
  }

  return false
})

onMounted(async () => {
  if (typeof props.summoner === 'number') {
    try {
      selfData.value = (await getSummoner(props.summoner)).data
    } catch (err) {
      console.error(err)
      notify.emit({
        id,
        type: 'warning',
        content: '加载召唤师信息时失败',
        silent: true,
        extra: { error: err }
      })
    }
  }
})

const handleToSummoner = () => {
  // if (isCurrentRoute.value) {
  //   return
  // }

  const id = typeof props.summoner === 'object' ? props.summoner.summonerId : props.summoner

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
