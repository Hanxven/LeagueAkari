<template>
  <div class="standalone-card-wrapper">
    <div class="meta">
      <StreamerModeMaskedText>
        <template #masked>
          <CopyableText :text="game.gameId">{{
            t('MiscellaneousPanel.gameId', { gameId: '●●●●●●' })
          }}</CopyableText>
        </template>
        <CopyableText :text="game.gameId">{{
          t('MiscellaneousPanel.gameId', { gameId: game.gameId })
        }}</CopyableText>
      </StreamerModeMaskedText>
      <span>{{
        t('MiscellaneousPanel.gameDate', {
          date: dayjs(game.gameCreation).format('YYYY-MM-DD HH:mm:ss')
        })
      }}</span>

      <StreamerModeMaskedText>
        <template #masked>
          <span>{{
            t('MiscellaneousPanel.server', {
              server: '●●●●●●'
            })
          }}</span>
        </template>
        <span>{{
          t('MiscellaneousPanel.server', {
            server: TENCENT_RSO_PLATFORM_NAME[game.platformId]
              ? `${TENCENT_RSO_PLATFORM_NAME[game.platformId]} (${game.platformId}) (TENCENT)`
              : REGION_NAME[game.platformId]
                ? `${REGION_NAME[game.platformId]} (${game.platformId})`
                : game.platformId
          })
        }}</span>
      </StreamerModeMaskedText>
    </div>
    <div v-if="hasBan" class="bans">
      <span style="margin-right: 12px; font-weight: bold; columns: #fff">{{
        t('MiscellaneousPanel.bans')
      }}</span>
      <div v-for="t of game.teams.filter((a) => a.bans.length)" :key="t.teamId" class="team-bans">
        <span>{{ formatTeam(t.teamId) }}</span>
        <LcuImage
          style="height: 20px; width: 20px"
          v-for="b of t.bans"
          :key="b.championId"
          :src="championIconUri(b.championId)"
        />
      </div>
    </div>
    <NDataTable
      virtual-scroll
      striped
      max-height="60vh"
      min-height="30vh"
      :scroll-x="tableWidth"
      :data="tableData"
      :columns="columns"
      size="small"
      :row-key="(row) => row.propKey"
    />
  </div>
</template>

<script setup lang="ts">
import CopyableText from '@renderer-shared/components/CopyableText.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import AugmentDisplay from '@renderer-shared/components/widgets/AugmentDisplay.vue'
import ItemDisplay from '@renderer-shared/components/widgets/ItemDisplay.vue'
import PerkDisplay from '@renderer-shared/components/widgets/PerkDisplay.vue'
import PerkstyleDisplay from '@renderer-shared/components/widgets/PerkstyleDisplay.vue'
import SummonerSpellDisplay from '@renderer-shared/components/widgets/SummonerSpellDisplay.vue'
import { useStreamerModeMaskedText } from '@renderer-shared/compositions/useStreamerModeMaskedText'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import { Game, Participant, Player } from '@shared/types/league-client/match-history'
import { summonerName } from '@shared/utils/name'
import { REGION_NAME, TENCENT_RSO_PLATFORM_NAME } from '@shared/utils/platform-names'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { DataTableColumns, NDataTable } from 'naive-ui'
import { RowData } from 'naive-ui/es/data-table/src/interface'
import { computed, h } from 'vue'

import StreamerModeMaskedText from '../StreamerModeMaskedText.vue'

const props = defineProps<{
  game: Game
}>()

const { t } = useTranslation()

const hasBan = computed(() => {
  return props.game.teams.some((t) => t.bans.length)
})

const lcs = useLeagueClientStore()

const { masked, summonerName: maskedSummonerName } = useStreamerModeMaskedText()

const RESERVED_COLUMN_WIDTH = 120

const tableWidth = computed(() => {
  return props.game.participants.length * RESERVED_COLUMN_WIDTH
})

const championDisplay = (championId: number) => {
  return h('div', { style: { display: 'flex' } }, [
    h(LcuImage, {
      style: { height: '20px', width: '20px' },
      src: championIconUri(championId || -1)
    }),
    h('span', { style: { 'margin-left': '2px' } }, lcs.gameData.champions[championId].name)
  ])
}

const spellsDisplay = (obj: { spell1Id: number; spell2Id: number }) => {
  return h('div', { style: { display: 'flex' } }, [
    h(SummonerSpellDisplay, { size: 20, spellId: obj.spell1Id }),
    h(SummonerSpellDisplay, { size: 20, spellId: obj.spell2Id, style: { 'margin-left': '2px' } })
  ])
}

const itemDisplay = (itemId: number) =>
  h(ItemDisplay, {
    itemId,
    size: 20
  })

const perkDisplay = (perkId: number) => h(PerkDisplay, { size: 20, perkId })

const perkstyleDisplay = (perkstyleId: number) => h(PerkstyleDisplay, { size: 20, perkstyleId })

const augmentDisplay = (augmentId: number) => h(AugmentDisplay, { size: 20, augmentId })

const platformDisplay = (platformId: string) => {
  return masked(TENCENT_RSO_PLATFORM_NAME[platformId] || platformId, '●●●●●●')
}

const maskedTextDisplay = (text: string) => {
  return masked(text, '●●●●●●')
}

const formatTeam = (id: number) => {
  if (id === 100) {
    return t('common.teams.100')
  } else if (id === 200) {
    return t('common.teams.200')
  } else {
    return id.toString()
  }
}

const renderTeam = (teamId: number) => {
  return h('span', formatTeam(teamId))
}

const statsConfigMap = computed(() => {
  return {
    championId: { name: t('MiscellaneousPanel.stats.championId'), render: championDisplay },
    spells: { name: t('MiscellaneousPanel.stats.spells'), render: spellsDisplay },
    teams: { name: t('MiscellaneousPanel.stats.teams'), render: renderTeam },
    assists: { name: t('MiscellaneousPanel.stats.assists') },
    causedEarlySurrender: { name: t('MiscellaneousPanel.stats.causedEarlySurrender') },
    champLevel: { name: t('MiscellaneousPanel.stats.champLevel') },
    combatPlayerScore: { name: t('MiscellaneousPanel.stats.combatPlayerScore') },
    damageDealtToObjectives: { name: t('MiscellaneousPanel.stats.damageDealtToObjectives') },
    damageDealtToTurrets: { name: t('MiscellaneousPanel.stats.damageDealtToTurrets') },
    damageSelfMitigated: { name: t('MiscellaneousPanel.stats.damageSelfMitigated') },
    deaths: { name: t('MiscellaneousPanel.stats.deaths') },
    doubleKills: { name: t('MiscellaneousPanel.stats.doubleKills') },
    earlySurrenderAccomplice: { name: t('MiscellaneousPanel.stats.earlySurrenderAccomplice') },
    firstBloodAssist: { name: t('MiscellaneousPanel.stats.firstBloodAssist') },
    firstBloodKill: { name: t('MiscellaneousPanel.stats.firstBloodKill') },
    firstInhibitorAssist: { name: t('MiscellaneousPanel.stats.firstInhibitorAssist') },
    firstInhibitorKill: { name: t('MiscellaneousPanel.stats.firstInhibitorKill') },
    firstTowerAssist: { name: t('MiscellaneousPanel.stats.firstTowerAssist') },
    firstTowerKill: { name: t('MiscellaneousPanel.stats.firstTowerKill') },
    gameEndedInEarlySurrender: { name: t('MiscellaneousPanel.stats.gameEndedInEarlySurrender') },
    gameEndedInSurrender: { name: t('MiscellaneousPanel.stats.gameEndedInSurrender') },
    goldEarned: { name: t('MiscellaneousPanel.stats.goldEarned') },
    goldSpent: { name: t('MiscellaneousPanel.stats.goldSpent') },
    inhibitorKills: { name: t('MiscellaneousPanel.stats.inhibitorKills') },
    item0: { name: t('MiscellaneousPanel.stats.item0'), render: itemDisplay },
    item1: { name: t('MiscellaneousPanel.stats.item1'), render: itemDisplay },
    item2: { name: t('MiscellaneousPanel.stats.item2'), render: itemDisplay },
    item3: { name: t('MiscellaneousPanel.stats.item3'), render: itemDisplay },
    item4: { name: t('MiscellaneousPanel.stats.item4'), render: itemDisplay },
    item5: { name: t('MiscellaneousPanel.stats.item5'), render: itemDisplay },
    item6: { name: t('MiscellaneousPanel.stats.item6'), render: itemDisplay },
    killingSprees: { name: t('MiscellaneousPanel.stats.killingSprees') },
    kills: { name: t('MiscellaneousPanel.stats.kills') },
    largestCriticalStrike: { name: t('MiscellaneousPanel.stats.largestCriticalStrike') },
    largestKillingSpree: { name: t('MiscellaneousPanel.stats.largestKillingSpree') },
    largestMultiKill: { name: t('MiscellaneousPanel.stats.largestMultiKill') },
    longestTimeSpentLiving: { name: t('MiscellaneousPanel.stats.longestTimeSpentLiving') },
    magicDamageDealt: { name: t('MiscellaneousPanel.stats.magicDamageDealt') },
    magicDamageDealtToChampions: {
      name: t('MiscellaneousPanel.stats.magicDamageDealtToChampions')
    },
    magicalDamageTaken: { name: t('MiscellaneousPanel.stats.magicalDamageTaken') },
    neutralMinionsKilled: { name: t('MiscellaneousPanel.stats.neutralMinionsKilled') },
    neutralMinionsKilledEnemyJungle: {
      name: t('MiscellaneousPanel.stats.neutralMinionsKilledEnemyJungle')
    },
    neutralMinionsKilledTeamJungle: {
      name: t('MiscellaneousPanel.stats.neutralMinionsKilledTeamJungle')
    },
    objectivePlayerScore: { name: t('MiscellaneousPanel.stats.objectivePlayerScore') },
    participantId: { name: t('MiscellaneousPanel.stats.participantId') },
    pentaKills: { name: t('MiscellaneousPanel.stats.pentaKills') },
    perk0: { name: t('MiscellaneousPanel.stats.perk0'), render: perkDisplay },
    perk0Var1: { name: t('MiscellaneousPanel.stats.perk0Var1') },
    perk0Var2: { name: t('MiscellaneousPanel.stats.perk0Var2') },
    perk0Var3: { name: t('MiscellaneousPanel.stats.perk0Var3') },
    perk1: { name: t('MiscellaneousPanel.stats.perk1'), render: perkDisplay },
    perk1Var1: { name: t('MiscellaneousPanel.stats.perk1Var1') },
    perk1Var2: { name: t('MiscellaneousPanel.stats.perk1Var2') },
    perk1Var3: { name: t('MiscellaneousPanel.stats.perk1Var3') },
    perk2: { name: t('MiscellaneousPanel.stats.perk2'), render: perkDisplay },
    perk2Var1: { name: t('MiscellaneousPanel.stats.perk2Var1') },
    perk2Var2: { name: t('MiscellaneousPanel.stats.perk2Var2') },
    perk2Var3: { name: t('MiscellaneousPanel.stats.perk2Var3') },
    perk3: { name: t('MiscellaneousPanel.stats.perk3'), render: perkDisplay },
    perk3Var1: { name: t('MiscellaneousPanel.stats.perk3Var1') },
    perk3Var2: { name: t('MiscellaneousPanel.stats.perk3Var2') },
    perk3Var3: { name: t('MiscellaneousPanel.stats.perk3Var3') },
    perk4: { name: t('MiscellaneousPanel.stats.perk4'), render: perkDisplay },
    perk4Var1: { name: t('MiscellaneousPanel.stats.perk4Var1') },
    perk4Var2: { name: t('MiscellaneousPanel.stats.perk4Var2') },
    perk4Var3: { name: t('MiscellaneousPanel.stats.perk4Var3') },
    perk5: { name: t('MiscellaneousPanel.stats.perk5'), render: perkDisplay },
    perk5Var1: { name: t('MiscellaneousPanel.stats.perk5Var1') },
    perk5Var2: { name: t('MiscellaneousPanel.stats.perk5Var2') },
    perk5Var3: { name: t('MiscellaneousPanel.stats.perk5Var3') },
    perkPrimaryStyle: {
      name: t('MiscellaneousPanel.stats.perkPrimaryStyle'),
      render: perkstyleDisplay
    },
    perkSubStyle: { name: t('MiscellaneousPanel.stats.perkSubStyle'), render: perkstyleDisplay },
    physicalDamageDealt: { name: t('MiscellaneousPanel.stats.physicalDamageDealt') },
    physicalDamageDealtToChampions: {
      name: t('MiscellaneousPanel.stats.physicalDamageDealtToChampions')
    },
    physicalDamageTaken: { name: t('MiscellaneousPanel.stats.physicalDamageTaken') },
    playerAugment1: { name: t('MiscellaneousPanel.stats.playerAugment1'), render: augmentDisplay },
    playerAugment2: { name: t('MiscellaneousPanel.stats.playerAugment2'), render: augmentDisplay },
    playerAugment3: { name: t('MiscellaneousPanel.stats.playerAugment3'), render: augmentDisplay },
    playerAugment4: { name: t('MiscellaneousPanel.stats.playerAugment4'), render: augmentDisplay },
    playerAugment5: { name: t('MiscellaneousPanel.stats.playerAugment5'), render: augmentDisplay },
    playerAugment6: { name: t('MiscellaneousPanel.stats.playerAugment6'), render: augmentDisplay },
    playerScore0: { name: t('MiscellaneousPanel.stats.playerScore0') },
    playerScore1: { name: t('MiscellaneousPanel.stats.playerScore1') },
    playerScore2: { name: t('MiscellaneousPanel.stats.playerScore2') },
    playerScore3: { name: t('MiscellaneousPanel.stats.playerScore3') },
    playerScore4: { name: t('MiscellaneousPanel.stats.playerScore4') },
    playerScore5: { name: t('MiscellaneousPanel.stats.playerScore5') },
    playerScore6: { name: t('MiscellaneousPanel.stats.playerScore6') },
    playerScore7: { name: t('MiscellaneousPanel.stats.playerScore7') },
    playerScore8: { name: t('MiscellaneousPanel.stats.playerScore8') },
    playerScore9: { name: t('MiscellaneousPanel.stats.playerScore9') },
    playerSubteamId: { name: t('MiscellaneousPanel.stats.playerSubteamId') },
    quadraKills: { name: t('MiscellaneousPanel.stats.quadraKills') },
    sightWardsBoughtInGame: { name: t('MiscellaneousPanel.stats.sightWardsBoughtInGame') },
    subteamPlacement: { name: t('MiscellaneousPanel.stats.subteamPlacement') },
    teamEarlySurrendered: { name: t('MiscellaneousPanel.stats.teamEarlySurrendered') },
    timeCCingOthers: { name: t('MiscellaneousPanel.stats.timeCCingOthers') },
    totalDamageDealt: { name: t('MiscellaneousPanel.stats.totalDamageDealt') },
    totalDamageDealtToChampions: {
      name: t('MiscellaneousPanel.stats.totalDamageDealtToChampions')
    },
    totalDamageTaken: { name: t('MiscellaneousPanel.stats.totalDamageTaken') },
    totalHeal: { name: t('MiscellaneousPanel.stats.totalHeal') },
    totalMinionsKilled: { name: t('MiscellaneousPanel.stats.totalMinionsKilled') },
    totalPlayerScore: { name: t('MiscellaneousPanel.stats.totalPlayerScore') },
    totalScoreRank: { name: t('MiscellaneousPanel.stats.totalScoreRank') },
    totalTimeCrowdControlDealt: { name: t('MiscellaneousPanel.stats.totalTimeCrowdControlDealt') },
    totalUnitsHealed: { name: t('MiscellaneousPanel.stats.totalUnitsHealed') },
    tripleKills: { name: t('MiscellaneousPanel.stats.tripleKills') },
    trueDamageDealt: { name: t('MiscellaneousPanel.stats.trueDamageDealt') },
    trueDamageDealtToChampions: { name: t('MiscellaneousPanel.stats.trueDamageDealtToChampions') },
    trueDamageTaken: { name: t('MiscellaneousPanel.stats.trueDamageTaken') },
    turretKills: { name: t('MiscellaneousPanel.stats.turretKills') },
    unrealKills: { name: t('MiscellaneousPanel.stats.unrealKills') },
    visionScore: { name: t('MiscellaneousPanel.stats.visionScore') },
    visionWardsBoughtInGame: { name: t('MiscellaneousPanel.stats.visionWardsBoughtInGame') },
    wardsKilled: { name: t('MiscellaneousPanel.stats.wardsKilled') },
    wardsPlaced: { name: t('MiscellaneousPanel.stats.wardsPlaced') },
    win: { name: t('MiscellaneousPanel.stats.win') },
    currentPlatformId: {
      name: t('MiscellaneousPanel.stats.currentPlatformId'),
      render: platformDisplay
    },
    platformId: { name: t('MiscellaneousPanel.stats.platformId'), render: platformDisplay },
    puuid: { render: maskedTextDisplay },
    riotIdGameName: { render: maskedTextDisplay },
    riotIdTagline: { render: maskedTextDisplay },
    summonerId: { render: maskedTextDisplay },
    summonerName: { render: maskedTextDisplay }
  }
})

// 暂未使用
// const timelineNameMap = {
//   creepsPerMinDeltas: '每分钟补兵增量',
//   csDiffPerMinDeltas: '每分钟补兵差异量',
//   damageTakenDiffPerMinDeltas: '每分钟承受的伤害差异增量',
//   damageTakenPerMinDeltas: '每分钟承受的伤害增量',
//   goldPerMinDeltas: '每分钟金币增量',
//   lane: '路线',
//   participantId: '参与者 ID',
//   role: '位置', // DUO_SUPPORT
//   xpDiffPerMinDeltas: '每分钟经验差异增量',
//   xpPerMinDeltas: '每分钟经验增量'
// }

const participantInfoMap = computed(() => {
  return props.game.participantIdentities.reduce(
    (o, c) => {
      o[c.participantId] = c.player
      return o
    },
    {} as Record<string, Player>
  )
})

const participantStatsMap = computed(() => {
  return props.game.participants.reduce(
    (o, c) => {
      o[c.participantId] = c
      return o
    },
    {} as Record<string, Participant>
  )
})

const columns = computed(() => {
  const c: DataTableColumns = []

  c.push({
    key: 'propName',
    minWidth: 100,
    fixed: 'left',
    render: (data) => h('span', { style: { 'font-weight': '700' } }, data.propName as string)
  })

  props.game.participants.forEach((p, index) => {
    c.push({
      key: p.participantId,
      maxWidth: RESERVED_COLUMN_WIDTH,

      title: () => {
        return h('div', { style: { display: 'flex' } }, [
          h(LcuImage, {
            style: { height: '20px', width: '20px' },
            src: championIconUri(p.championId || -1)
          }),
          h(
            'span',
            { style: { 'margin-left': '2px' } },

            masked(
              summonerName(
                participantInfoMap.value[p.participantId].gameName ||
                  participantInfoMap.value[p.participantId].summonerName,
                participantInfoMap.value[p.participantId].tagLine
              ),
              maskedSummonerName(participantInfoMap.value[p.participantId].puuid, index)
            )
          )
        ])
      },
      render: (data) => {
        const propKey = data.propKey as string

        const renderer =
          statsConfigMap.value[propKey]?.render ||
          ((content: any) => {
            if (typeof content === 'boolean') {
              return content ? t('common.yes') : t('common.no')
            } else if (typeof content === 'number') {
              return content.toLocaleString()
            } else if (typeof content === 'string') {
              return content
            }

            return t('common.na')
          })
        return renderer(data[p.participantId], participantStatsMap.value[p.participantId])
      }
    })
  })

  return c
})

const tableData = computed(() => {
  const data: RowData[] = []

  if (props.game.participants.length === 0) {
    return []
  }

  const champions: RowData = { propName: statsConfigMap.value['championId']?.name }
  props.game.participants.forEach((p) => {
    champions[p.participantId] = p.championId
    champions['propKey'] = 'championId'
  })

  const spells: RowData = { propName: statsConfigMap.value['spells']?.name }
  props.game.participants.forEach((p) => {
    spells[p.participantId] = {
      spell1Id: p.spell1Id,
      spell2Id: p.spell2Id
    }
    spells['propKey'] = 'spells'
  })

  const cp: RowData = { propName: statsConfigMap['currentPlatformId']?.name }
  props.game.participants.forEach((p) => {
    cp[p.participantId] = participantInfoMap.value[p.participantId].currentPlatformId
    cp['propKey'] = 'currentPlatformId'
  })

  const pi: RowData = { propName: statsConfigMap.value['platformId']?.name }
  props.game.participants.forEach((p) => {
    pi[p.participantId] = participantInfoMap.value[p.participantId].platformId
    pi['propKey'] = 'platformId'
  })

  const teams: RowData = { propName: statsConfigMap.value['teams']?.name }
  props.game.participants.forEach((p) => {
    teams[p.participantId] = p.teamId
    teams['propKey'] = 'teams'
  })

  data.push(champions, spells, teams, cp, pi)

  const statsNames = Object.keys(props.game.participants[0].stats)

  statsNames.forEach((n) => {
    const row: RowData = {}

    row['propName'] = statsConfigMap.value[n]?.name || n
    row['propKey'] = n

    props.game.participants.forEach((p) => {
      row[p.participantId] = p.stats[n]
    })

    data.push(row)
  })

  return data
})
</script>

<style lang="less" scoped>
.standalone-card-wrapper {
  padding: 12px;
  max-height: 85vh;
  max-width: 80vw;
  min-width: 640px;
  position: relative;
  top: calc(var(--title-bar-height) / 2);

  :deep(.n-data-table) {
    font-size: 12px;
  }
}

.meta {
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 4px;
  display: flex;
  gap: 8px;
}

.bans {
  display: flex;
  border-radius: 4px;
  background-color: rgba(57, 57, 62, 1);
  margin-bottom: 4px;
  padding: 4px 8px;
  font-size: 12px;
}

.team-bans {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-right: 12px;
}
</style>
