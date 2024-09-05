t
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
    </template>
    <template v-else><span style="font-size: 12px">加载中...</span></template>
    <div style="margin-top: 12px">
      <NInput
        v-model:value="text"
        :placeholder="`填写对 ${summonerName(summonerInfo?.gameName || summonerInfo?.displayName, summonerInfo?.tagLine, props.puuid)} 的标记内容`"
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 4 }"
        ref="input"
      ></NInput>
    </div>
    <div style="margin-top: 12px; display: flex; justify-content: flex-end; gap: 4px">
      <NButton size="small" @click="show = false">取消</NButton>
      <NButton size="small" type="primary" @click="() => handleSaveTag()">保存</NButton>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { getSummonerByPuuid } from '@renderer-shared/http-api/summoner'
import { coreFunctionalityRendererModule as cfm } from '@renderer-shared/modules/core-functionality'
import { SavedPlayerInfo } from '@renderer-shared/modules/core-functionality/store'
import { useLcuConnectionStore } from '@renderer-shared/modules/lcu-connection/store'
import { useSummonerStore } from '@renderer-shared/modules/lcu-state-sync/summoner'
import { storageRendererModule as sm } from '@renderer-shared/modules/storage'
import { laNotification } from '@renderer-shared/notification'
import { SummonerInfo } from '@shared/types/lcu/summoner'
import { summonerName } from '@shared/utils/name'
import { NButton, NInput, NModal } from 'naive-ui'
import { nextTick, ref, shallowRef, useTemplateRef, watch } from 'vue'

const show = defineModel<boolean>('show', { default: false })

const summonerInfo = shallowRef<SummonerInfo | null>(null)
const savedInfo = shallowRef<SavedPlayerInfo | null>(null)

const lc = useLcuConnectionStore()

const inputEl = useTemplateRef('input')

const emits = defineEmits<{
  (e: 'edited', puuid: string): void
}>()

const props = defineProps<{
  puuid?: string
}>()

watch([() => show.value, () => props.puuid], async ([sh, puuid]) => {
  if (!puuid || !lc.auth || !summoner.me) {
    summonerInfo.value = null
    return
  }

  if ((!summonerInfo.value || summonerInfo.value.puuid !== props.puuid) && sh) {
    try {
      const s = (await getSummonerByPuuid(puuid)).data
      summonerInfo.value = s

      const p = await sm.querySavedPlayerWithGames({
        selfPuuid: summoner.me.puuid,
        puuid: props.puuid,
        region: lc.auth.region,
        rsoPlatformId: lc.auth.rsoPlatformId
      })

      if (p) {
        savedInfo.value = p
        text.value = p.tag
      }
    } catch (error) {
      laNotification.warn('无法加载', `无法加载召唤师 ${puuid}`, error)
    }
  }
})

watch([() => show.value, () => summonerInfo.value], ([s, u]) => {
  if (s) {
    if (s && u) {
      nextTick(() => inputEl.value?.focus())
    }
  }
})

const summoner = useSummonerStore()
const text = ref('')

const handleSaveTag = async () => {
  if (!lc.auth || !summoner.me || !props.puuid) {
    return
  }

  try {
    await cfm.saveSavedPlayer({
      selfPuuid: summoner.me.puuid,
      puuid: props.puuid,
      region: lc.auth.region,
      rsoPlatformId: lc.auth.rsoPlatformId,
      tag: text.value || null
    })

    if (text.value) {
      laNotification.success('玩家标记', '已更新玩家标记')
    } else {
      laNotification.success('玩家标记', '已清除玩家标记')
    }

    emits('edited', props.puuid)
    show.value = false
  } catch (error) {
    laNotification.warn('玩家标记', '无法更新玩家标记', error)
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
    font-weight: bold;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
