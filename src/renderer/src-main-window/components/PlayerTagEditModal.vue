<template>
  <NModal v-model:show="show" preset="card" style="max-width: 60vw">
    <template #header><span class="card-header-title">编辑玩家标记</span></template>
    <template v-if="summonerInfo">
      <div class="summoner-info">
        <LcuImage
          class="image"
          :src="`/lol-game-data/assets/v1/profile-icons/${summonerInfo.profileIconId}.jpg`"
        />
        <span class="name">{{
          summonerName(summonerInfo.gameName || summonerInfo.displayName, summonerInfo.tagLine)
        }}</span>
      </div>
      <div style="margin-top: 12px">
        <NInput
          v-model:value="text"
          :placeholder="`填写对 ${summonerName(summonerInfo.gameName || summonerInfo.displayName, summonerInfo.tagLine)} 的标记内容`"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 4 }"
          size="tiny"
          ref="el"
        ></NInput>
      </div>
      <div style="margin-top: 12px; display: flex; justify-content: flex-end; gap: 4px">
        <NButton size="tiny" @click="show = false">取消</NButton>
        <NButton size="tiny" type="primary" @click="() => handleSaveTag()">保存</NButton>
      </div>
    </template>
    <template v-else>加载中...</template>
  </NModal>
</template>

<script setup lang="ts">
import { SummonerInfo } from '@shared/types/lcu/summoner'
import { summonerName } from '@shared/utils/name'
import { NButton, NInput, NModal } from 'naive-ui'
import { nextTick, ref, shallowRef, watch } from 'vue'

import { useAppStore } from '@main-window/features/app/store'
import { SavedPlayerInfo } from '@main-window/features/core-functionality/store'
import { useSummonerStore } from '@main-window/features/lcu-state-sync/summoner'
import { getSummoner } from '@shared/renderer-http-api/summoner'
import { laNotification } from '@main-window/notification'
import { mainCall } from '@shared/renderer-utils/ipc'

import LcuImage from './LcuImage.vue'

const show = defineModel<boolean>('show', { default: false })

const summonerInfo = shallowRef<SummonerInfo | null>(null)
const savedInfo = shallowRef<SavedPlayerInfo | null>(null)

const el = ref()

const emits = defineEmits<{
  (e: 'edited', summonerId: number): void
}>()

const props = defineProps<{
  summonerId?: number
}>()

watch([() => show.value, () => props.summonerId], async ([sh, id]) => {
  if (!id || !app.lcuAuth || !summoner.me) {
    summonerInfo.value = null
    return
  }

  if (!summonerInfo.value && sh) {
    try {
      const s = (await getSummoner(id)).data
      summonerInfo.value = s

      const p = await mainCall('storage/saved-player-with-games/query', {
        selfSummonerId: summoner.me.summonerId,
        summonerId: props.summonerId,
        region: app.lcuAuth.region,
        rsoPlatformId: app.lcuAuth.rsoPlatformId
      })

      if (p) {
        savedInfo.value = p
        text.value = p.tag
      }
    } catch (error) {
      laNotification.warn('无法加载', `无法加载召唤师 ${id}`, error)
    }
  }
})

watch([() => show.value, () => summonerInfo.value], ([s, u]) => {
  if (s) {
    if (s && u) {
      nextTick(() => el.value?.focus())
    }
  }
})

const app = useAppStore()
const summoner = useSummonerStore()
const text = ref('')

const handleSaveTag = async () => {
  if (!app.lcuAuth || !summoner.me || !props.summonerId) {
    return
  }

  try {
    await mainCall('core-functionality/saved-player/save', {
      selfSummonerId: summoner.me.summonerId,
      summonerId: props.summonerId,
      region: app.lcuAuth.region,
      rsoPlatformId: app.lcuAuth.rsoPlatformId,
      tag: text.value || null
    })

    if (text.value) {
      laNotification.success('玩家标记', '已更新玩家标记')
    } else {
      laNotification.success('玩家标记', '已清除玩家标记')
    }

    emits('edited', props.summonerId)
    show.value = false
  } catch {
    laNotification.warn('玩家标记', '无法更新玩家标记')
  }
}
</script>

<style lang="less" scoped>
.card-header-title {
  font-weight: bold;
  font-size: 18px;
}

.summoner-info {
  display: flex;
  align-items: center;

  .image {
    width: 24px;
    height: 24px;
    border-radius: 4px;
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
}
</style>
@shared/renderer-utils/ipc