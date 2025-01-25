<template>
  <div class="standalone-card-wrapper">
    <NInput
      v-model:value="filterText"
      :placeholder="t('OpggTier.searchPlaceholder')"
      size="small"
      style="font-size: 12px; margin-bottom: 4px"
      clearable
    />
    <NDataTable
      class="tier-table"
      flex-height
      :data="data"
      :columns="combinedColumns"
      :row-key="(item) => item.id"
      virtual-scroll
      :row-props="rowProps"
      :loading="loading"
      size="small"
    />
  </div>
</template>

<script lang="ts" setup>
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useExtraAssetsStore } from '@renderer-shared/shards/extra-assets/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import { isChampionNameMatch, isChampionNameMatchKeywords } from '@shared/utils/string-match'
import { useMediaQuery } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import {
  DataTableColumn,
  DataTableColumns,
  DataTableCreateRowProps,
  NDataTable,
  NInput
} from 'naive-ui'
import { computed, h, ref, useCssModule } from 'vue'

const props = defineProps<{
  championId?: number
  region?: string
  tier?: string
  mode?: string
  position?: string
  version?: string
  loading?: boolean
  data?: any // 类型较复杂，此处不做类型检查
}>()

const emits = defineEmits<{
  (e: 'toChampion', championId: number): void
}>()

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const eas = useExtraAssetsStore()

const styles = useCssModule()

const rowProps: DataTableCreateRowProps<any> = (row) => {
  return {
    onClick: () => {
      emits('toChampion', row.id)
    },
    style: {
      cursor: 'pointer'
    }
  }
}

const columns: DataTableColumns<any> = [
  {
    title: '#',
    key: 'rank',
    align: 'center',
    className: styles['column-title'],
    width: 46,
    render: (row, index) => {
      if (props.mode === 'ranked' && props.position !== 'none') {
        const position = row.positions?.find(
          (p: any) => p.name.toUpperCase() === props.position?.toUpperCase()
        )
        return position?.stats?.tier_data?.rank || index + 1
      }

      return row.average_stats?.rank || index + 1
    }
  },
  {
    title: () => t('OpggTier.columns.champion'),
    key: 'name',
    align: 'center',
    className: styles['column-title'],
    sorter: (a, b) => {
      const aName = lcs.gameData.champions[a.id]?.name
      const bName = lcs.gameData.champions[b.id]?.name

      if (aName && bName) {
        return aName.localeCompare(bName)
      }

      return a.id - b.id
    },
    render: (row) => {
      return h(
        'div',
        {
          class: [styles['image-name']]
        },
        [
          h(LcuImage, {
            class: [styles.image],
            src: championIconUri(row.id)
          }),
          h(
            'div',
            {
              class: [styles.name]
            },
            lcs.gameData.champions[row.id]?.name || row.id
          )
        ]
      )
    }
  },
  {
    title: () => t('OpggTier.columns.tier'),
    key: 'tier',
    align: 'center',
    width: 76,
    className: styles['column-title'],
    sorter: (a, b) => {
      const aTier = a.average_stats?.tier || Infinity
      const bTier = b.average_stats?.tier || Infinity

      return bTier - aTier
    },
    render: (row) => {
      if (props.mode === 'ranked' && props.position !== 'none') {
        const position = row.positions?.find(
          (p: any) => p.name.toUpperCase() === props.position?.toUpperCase()
        )

        let tierText: string
        if (position === undefined || position === null) {
          tierText = '-'
        } else if (position.stats?.tier_data?.tier === 0) {
          tierText = 'OP'
        } else if (position.stats?.tier_data?.tier) {
          tierText = position.stats?.tier_data?.tier.toString()
        } else {
          tierText = '-'
        }

        return h(
          'span',
          {
            class: [[styles.tier], [styles[`tier-${position.stats?.tier_data?.tier ?? 'none'}`]]]
          },
          tierText
        )
      }

      let tierText: string
      if (!row.average_stats) {
        tierText = '-'
      } else if (row.average_stats.tier === 0) {
        tierText = 'OP'
      } else if (row.average_stats.tier) {
        tierText = row.average_stats.tier.toString()
      } else {
        tierText = '-'
      }

      return h(
        'span',
        {
          class: [[styles.tier], [styles[`tier-${row.average_stats?.tier ?? 'none'}`]]]
        },
        tierText
      )
    }
  },
  {
    title: () => t('OpggTier.columns.winRate'),
    key: 'winRate',
    align: 'center',
    width: 76,
    className: styles['column-title'],
    sorter: (a, b) => {
      if (props.mode === 'ranked') {
        const aPosition = a.positions?.find(
          (p: any) => p.name.toUpperCase() === props.position?.toUpperCase()
        )
        const bPosition = b.positions?.find(
          (p: any) => p.name.toUpperCase() === props.position?.toUpperCase()
        )

        const aWinRate = aPosition?.stats?.win_rate || 0
        const bWinRate = bPosition?.stats?.win_rate || 0

        return aWinRate - bWinRate
      }

      if (props.mode === 'arena') {
        const aWinRate = a.average_stats?.win / a.average_stats?.play || 0
        const bWinRate = b.average_stats?.win / b.average_stats?.play || 0

        return aWinRate - bWinRate
      } else {
        const aWinRate = a.average_stats?.win_rate || 0
        const bWinRate = b.average_stats?.win_rate || 0

        return aWinRate - bWinRate
      }
    },
    render: (row) => {
      if (props.mode === 'ranked' && props.position !== 'none') {
        const position = row.positions?.find(
          (p: any) => p.name.toUpperCase() === props.position?.toUpperCase()
        )

        if (!position) {
          return '-'
        }

        return `${(position.stats?.win_rate * 100 || 0).toFixed(2)} %`
      }

      if (!row.average_stats) {
        return '-'
      }

      if (row.average_stats.win_rate) {
        return `${(row.average_stats.win_rate * 100).toFixed(2)} %`
      }

      if (props.mode === 'arena' && row.average_stats.win && row.average_stats.play) {
        return `${((row.average_stats.win / row.average_stats.play) * 100).toFixed(2)} %`
      }

      return '-'
    }
  },
  {
    title: () => t('OpggTier.columns.pickRate'),
    key: 'pickRate',
    align: 'center',
    width: 86,
    sorter: (a, b) => {
      if (props.mode === 'ranked' && props.position !== 'none') {
        const aPosition = a.positions?.find(
          (p: any) => p.name.toUpperCase() === props.position?.toUpperCase()
        )
        const bPosition = b.positions?.find(
          (p: any) => p.name.toUpperCase() === props.position?.toUpperCase()
        )

        const aPickRate = aPosition?.stats.pick_rate || 0
        const bPickRate = bPosition?.stats.pick_rate || 0

        return aPickRate - bPickRate
      }

      const aPickRate = a.average_stats?.pick_rate || 0
      const bPickRate = b.average_stats?.pick_rate || 0

      return aPickRate - bPickRate
    },
    className: styles['column-title'],
    render: (row) => {
      if (props.mode === 'ranked' && props.position !== 'none') {
        const position = row.positions?.find(
          (p: any) => p.name.toUpperCase() === props.position?.toUpperCase()
        )

        if (!position) {
          return '-'
        }

        return `${(position.stats?.pick_rate * 100 || 0).toFixed(2)} %`
      }

      if (!row.average_stats) {
        return '-'
      }

      return `${(row.average_stats.pick_rate * 100).toFixed(2)} %`
    }
  }
]

const countersColumn: DataTableColumn<any> = {
  title: () => t('OpggTier.columns.counter'),
  key: 'counters',
  align: 'center',
  width: 90,
  className: styles['column-title'],
  render: (row) => {
    if (props.mode === 'ranked' && props.position !== 'none') {
      const position = row.positions?.find(
        (p: any) => p.name.toUpperCase() === props.position?.toUpperCase()
      )

      if (!position || !position.counters || !position.counters.length) {
        return '-'
      }

      return h(
        'div',
        {
          style: {
            display: 'flex',
            'align-items': 'center',
            gap: '2px',
            'justify-content': 'center'
          }
        },
        position.counters.slice(0, 3).map((c: any) => {
          return h(LcuImage, {
            style: { width: '18px', height: '18px' },
            src: championIconUri(c.champion_id)
          })
        })
      )
    }

    return '-'
  }
}

const banRateColumn: DataTableColumn<any> = {
  title: () => t('OpggTier.columns.banRate'),
  key: 'banRate',
  align: 'center',
  width: 86,
  sorter: (a, b) => {
    if (props.mode === 'ranked' && props.position !== 'none') {
      const aPosition = a.positions?.find(
        (p: any) => p.name.toUpperCase() === props.position?.toUpperCase()
      )
      const bPosition = b.positions?.find(
        (p: any) => p.name.toUpperCase() === props.position?.toUpperCase()
      )

      const aBanRate = aPosition?.stats.ban_rate || 0
      const bBanRate = bPosition?.stats.ban_rate || 0

      return aBanRate - bBanRate
    }

    const aBanRate = a.average_stats?.ban_rate || 0
    const bBanRate = b.average_stats?.ban_rate || 0

    return aBanRate - bBanRate
  },
  className: styles['column-title'],
  render: (row) => {
    if (props.mode === 'ranked' && props.position !== 'none') {
      const position = row.positions?.find(
        (p: any) => p.name.toUpperCase() === props.position?.toUpperCase()
      )

      if (!position || !position.stats || position.stats.ban_rate === null) {
        return '-'
      }

      return `${(position.stats?.ban_rate * 100 || 0).toFixed(2)} %`
    }

    if (!row.average_stats || row.average_stats.ban_rate === null) {
      return '-'
    }

    return `${(row.average_stats.ban_rate * 100).toFixed(2)} %`
  }
}

const isLargeEnoughToShow = useMediaQuery('(min-width: 520px)')
const isSuperLargeEnoughToShow = useMediaQuery('(min-width: 600px)')

const combinedColumns = computed(() => {
  if (isSuperLargeEnoughToShow.value) {
    return [...columns, banRateColumn, countersColumn]
  }

  if (isLargeEnoughToShow.value) {
    return [...columns, countersColumn]
  }

  return columns
})

const filterText = ref('')

const isNameMatch = (pattern: string, label: string, value?: number) => {
  try {
    if (eas.heroListMap && value !== undefined) {
      const c = eas.heroListMap[value]

      if (c) {
        const keywords = c.keywords.split(',')
        return (
          isChampionNameMatchKeywords(pattern, [label, ...keywords]) ||
          value.toString().includes(pattern)
        )
      }
    }

    return (
      isChampionNameMatch(pattern, label) || Boolean(value && value.toString().includes(pattern))
    )
  } catch {
    return (
      isChampionNameMatch(pattern, label) || Boolean(value && value.toString().includes(pattern))
    )
  }
}

const data = computed(() => {
  if (!props.data) {
    return []
  }

  // 排位数据按照位置的 tier 排序
  if (props.mode === 'ranked' && props.position !== 'none') {
    const arr: any[] = []

    for (const c of props.data.data) {
      if (!c.positions) {
        continue
      }

      for (const p of c.positions) {
        if (p.name.toUpperCase() === props.position?.toUpperCase()) {
          arr.push(c)
          break
        }
      }
    }

    return arr
      .toSorted((a: any, b: any) => {
        const aPosition = a.positions?.find(
          (p: any) => p.name.toUpperCase() === props.position?.toUpperCase()
        )
        const bPosition = b.positions?.find(
          (p: any) => p.name.toUpperCase() === props.position?.toUpperCase()
        )

        const aRank = aPosition?.stats?.tier_data?.rank || Infinity
        const bRank = bPosition?.stats?.tier_data?.rank || Infinity

        return aRank - bRank
      })
      .filter((value) => {
        if (filterText.value === '') {
          return true
        }

        return isNameMatch(filterText.value, lcs.gameData.champions[value.id]?.name, value.id)
      })
  }

  return props.data.data
    .toSorted((a: any, b: any) => {
      const aRank = a.average_stats?.rank || Infinity
      const bRank = b.average_stats?.rank || Infinity

      return aRank - bRank
    })
    .filter((value: any) => {
      if (filterText.value === '') {
        return true
      }

      return isNameMatch(filterText.value, lcs.gameData.champions[value.id]?.name, value.id)
    })
})
</script>

<style lang="less" scoped>
.standalone-card-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;

  .tier-table {
    flex: 1;
  }
}

.champion-item {
  display: flex;
  align-items: center;
  height: 42px;
  border-radius: 4px;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    background-color: #ffffff10;
  }

  .rank {
    width: 48px;
    text-align: center;
    font-size: 12px;
    color: rgb(192, 192, 192);
  }

  .first-line {
    display: flex;
    align-items: center;
    flex: 1;
    overflow: hidden;

    .name {
      margin-left: 8px;
      font-size: 13px;
      color: #c9c9c9;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }
  }

  .image {
    height: 32px;
    width: 32px;
  }

  .tier {
    width: 60px;
    text-align: center;
    font-weight: bold;

    &.tier-1 {
      color: #0093ff;
    }

    &.tier-2 {
      color: #00bba3;
    }

    &.tier-3 {
      color: #ffb900;
    }

    &.tier-4 {
      color: #9aa4af;
    }

    &.tier-5 {
      color: #a88a67;
    }

    &.tier-6 {
      color: rgb(85, 34, 83);
    }
  }

  .win-rate {
    text-align: center;
    width: 86px;
    font-size: 13px;
    color: rgb(192, 192, 192);
  }
}

.inner {
  padding: 8px;
}

.card-area {
  border-radius: 2px;
  background-color: #ffffff10;
  padding: 4px 8px;

  .card-title {
    font-size: 13px;
    font-weight: bold;
    margin-bottom: 4px;
  }

  &:not(:last-child) {
    margin-bottom: 4px;
  }
}

.skill-route {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;

  .skill {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #20618d;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 4px;
  }
}

.skill-details {
  display: flex;
  gap: 2px;

  .skill {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #208d6e;
    color: white;
    width: 16px;
    height: 16px;
    font-size: 10px;
    border-radius: 2px;
  }
}

.filters {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}
</style>

<style lang="less" module>
.column-title {
  font-size: 13px;
  color: #c9c9c9;
}

.image-name {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  .image {
    height: 32px;
    width: 32px;
    flex-shrink: 0;
  }

  .name {
    text-align: left;
    margin-left: 8px;
    font-size: 13px;
    color: #c9c9c9;
    width: 100px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
}

.tier {
  font-weight: bold;
  font-size: 14px;

  &.tier-0 {
    color: #ff7300;
  }

  &.tier-1 {
    color: #0093ff;
  }

  &.tier-2 {
    color: #00bba3;
  }

  &.tier-3 {
    color: #ffb900;
  }

  &.tier-4 {
    color: #9aa4af;
  }

  &.tier-5 {
    color: #a88a67;
  }

  &.tier-6 {
    color: rgb(85, 34, 83);
  }
}
</style>
