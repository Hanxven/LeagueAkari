import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

export function useSgpTagOptions() {
  const { t } = useTranslation()
  const lcs = useLeagueClientStore()

  return computed(() => {
    return [
      {
        label: t('common.sgpMatchHistoryTags.all'),
        value: 'all'
      },
      {
        label: lcs.gameData.queues[420]?.name || t('common.sgpMatchHistoryTags.q_420', 'q_420'),
        value: `q_420`
      },
      {
        label: lcs.gameData.queues[430]?.name || t('common.sgpMatchHistoryTags.q_430', 'q_430'),
        value: `q_430`
      },
      {
        label: lcs.gameData.queues[440]?.name || t('common.sgpMatchHistoryTags.q_440', 'q_440'),
        value: `q_440`
      },
      {
        label: lcs.gameData.queues[450]?.name || t('common.sgpMatchHistoryTags.q_450', 'q_450'),
        value: `q_450`
      },
      {
        label: lcs.gameData.queues[480]?.name || t('common.sgpMatchHistoryTags.q_480', 'q_480'),
        value: `q_480`
      },
      {
        label: lcs.gameData.queues[1700]?.name || t('common.sgpMatchHistoryTags.q_1700', 'q_1700'),
        value: 'q_1700'
      },
      {
        label: lcs.gameData.queues[490]?.name || t('common.sgpMatchHistoryTags.q_490', 'q_490'),
        value: `q_490`
      },
      {
        label: lcs.gameData.queues[1900]?.name || t('common.sgpMatchHistoryTags.q_1900', 'q_1900'),
        value: `q_1900`
      },
      {
        label: lcs.gameData.queues[900]?.name || t('common.sgpMatchHistoryTags.q_900', 'q_900'),
        value: `q_900`
      },
      {
        label: lcs.gameData.queues[2300]?.name || t('common.sgpMatchHistoryTags.q_2300', 'q_2300'),
        value: `q_2300`
      }
    ]
  })
}
