<template>
  <div class="opgg-champion-tier-wrapper">
    <div class="meta">
      <CopyableText :text="game.gameId">对局 ID: {{ game.gameId }}</CopyableText>
      <span>对局时间: {{ dayjs(game.gameCreation).format('YYYY-MM-DD HH:mm:ss') }}</span>
      <span
        >区服:
        {{
          rsoPlatformText[game.platformId]
            ? `${rsoPlatformText[game.platformId]} (${game.platformId}) (TENCENT)`
            : regionText[game.platformId]
              ? `${regionText[game.platformId]} (${game.platformId})`
              : game.platformId
        }}</span
      >
    </div>
    <div v-if="hasBan" class="bans">
      <span style="margin-right: 12px; font-weight: bold; columns: #fff">禁用：</span>
      <div v-for="t of game.teams.filter((a) => a.bans.length)" :key="t.teamId" class="team-bans">
        <span>{{ formatTeam(t.teamId) }}</span>
        <LcuImage
          style="height: 20px; width: 20px"
          v-for="b of t.bans"
          :key="b.championId"
          :src="championIcon(b.championId)"
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
import CopyableText from '@shared/renderer/components/CopyableText.vue'
import LcuImage from '@shared/renderer/components/LcuImage.vue'
import AugmentDisplay from '@shared/renderer/components/widgets/AugmentDisplay.vue'
import ItemDisplay from '@shared/renderer/components/widgets/ItemDisplay.vue'
import PerkDisplay from '@shared/renderer/components/widgets/PerkDisplay.vue'
import PerkstyleDisplay from '@shared/renderer/components/widgets/PerkstyleDisplay.vue'
import SummonerSpellDisplay from '@shared/renderer/components/widgets/SummonerSpellDisplay.vue'
import { championIcon } from '@shared/renderer/modules/game-data'
import { useGameDataStore } from '@shared/renderer/modules/lcu-state-sync/game-data'
import { Game, Participant, Player } from '@shared/types/lcu/match-history'
import { summonerName } from '@shared/utils/name'
import { regionText, rsoPlatformText } from '@shared/utils/rso-platforms'
import dayjs from 'dayjs'
import { DataTableColumns, NDataTable } from 'naive-ui'
import { RowData } from 'naive-ui/es/data-table/src/interface'
import { computed, h } from 'vue'

const props = defineProps<{
  game: Game
}>()

const hasBan = computed(() => {
  return props.game.teams.some((t) => t.bans.length)
})

const gameData = useGameDataStore()

const RESERVED_COLUMN_WIDTH = 120

const tableWidth = computed(() => {
  return props.game.participants.length * RESERVED_COLUMN_WIDTH
})

const championDisplay = (championId: number) => {
  return h('div', { style: { display: 'flex' } }, [
    h(LcuImage, { style: { height: '20px', width: '20px' }, src: championIcon(championId || -1) }),
    h('span', { style: { 'margin-left': '2px' } }, gameData.champions[championId].name)
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

const platformDisplay = (platformId: string) => rsoPlatformText[platformId] || platformId

const formatTeam = (id: number) => {
  if (id === 100) {
    return '蓝色方'
  } else if (id === 200) {
    return '红色方'
  } else {
    return id.toString()
  }
}

const renderTeam = (teamId: number) => {
  return h('span', formatTeam(teamId))
}

const statsConfigMap = {
  championId: { name: '英雄', render: championDisplay },
  spells: { name: '召唤师技能', render: spellsDisplay },
  teams: { name: '阵营', render: renderTeam },
  assists: { name: '助攻' },
  causedEarlySurrender: { name: '是重开发起者' },
  champLevel: { name: '英雄等级' },
  combatPlayerScore: { name: '战斗玩家得分' },
  damageDealtToObjectives: { name: '对战略点造成的伤害' },
  damageDealtToTurrets: { name: '对防御塔造成的伤害' },
  damageSelfMitigated: { name: '自我缓和的伤害' },
  deaths: { name: '死亡' },
  doubleKills: { name: '双杀' },
  earlySurrenderAccomplice: { name: '重开支持者' },
  firstBloodAssist: { name: '一血助攻' },
  firstBloodKill: { name: '一血' },
  firstInhibitorAssist: { name: '首个水晶助攻' },
  firstInhibitorKill: { name: '首个水晶摧毁' },
  firstTowerAssist: { name: '首座防御塔助攻' },
  firstTowerKill: { name: '首座防御塔摧毁' },
  gameEndedInEarlySurrender: { name: '重开局' },
  gameEndedInSurrender: { name: '游戏以一方投降结束' },
  goldEarned: { name: '获得金币' },
  goldSpent: { name: '花费金币' },
  inhibitorKills: { name: '水晶摧毁' },
  item0: { name: '装备0', render: itemDisplay },
  item1: { name: '装备1', render: itemDisplay },
  item2: { name: '装备2', render: itemDisplay },
  item3: { name: '装备3', render: itemDisplay },
  item4: { name: '装备4', render: itemDisplay },
  item5: { name: '装备5', render: itemDisplay },
  item6: { name: '装备6', render: itemDisplay },
  killingSprees: { name: 'Killing Sprees' },
  kills: { name: '击杀' },
  largestCriticalStrike: { name: '最大暴击伤害' },
  largestKillingSpree: { name: '最大连杀' },
  largestMultiKill: { name: '最大多杀' },
  longestTimeSpentLiving: { name: '最长存活时间' },
  magicDamageDealt: { name: '造成的魔法伤害' },
  magicDamageDealtToChampions: { name: '对英雄造成的魔法伤害' },
  magicalDamageTaken: { name: '承受的魔法伤害' },
  neutralMinionsKilled: { name: '击杀中立单位' },
  neutralMinionsKilledEnemyJungle: { name: '击杀敌方野区中立单位' },
  neutralMinionsKilledTeamJungle: { name: '击杀己方野区中立单位' },
  objectivePlayerScore: { name: '目标玩家得分' },
  participantId: { name: '参与者 ID' },
  pentaKills: { name: '五杀' },
  // 天赋梦路!
  perk0: { name: '天赋0', render: perkDisplay },
  perk0Var1: { name: '天赋0变量1' },
  perk0Var2: { name: '天赋0变量2' },
  perk0Var3: { name: '天赋0变量3' },
  perk1: { name: '天赋1', render: perkDisplay },
  perk1Var1: { name: '天赋1变量1' },
  perk1Var2: { name: '天赋1变量2' },
  perk1Var3: { name: '天赋1变量3' },
  perk2: { name: '天赋2', render: perkDisplay },
  perk2Var1: { name: '天赋2变量1' },
  perk2Var2: { name: '天赋2变量2' },
  perk2Var3: { name: '天赋2变量3' },
  perk3: { name: '天赋3', render: perkDisplay },
  perk3Var1: { name: '天赋3变量1' },
  perk3Var2: { name: '天赋3变量2' },
  perk3Var3: { name: '天赋3变量3' },
  perk4: { name: '天赋4', render: perkDisplay },
  perk4Var1: { name: '天赋4变量1' },
  perk4Var2: { name: '天赋4变量2' },
  perk4Var3: { name: '天赋4变量3' },
  perk5: { name: '天赋5', render: perkDisplay },
  perk5Var1: { name: '天赋5变量1' },
  perk5Var2: { name: '天赋5变量2' },
  perk5Var3: { name: '天赋5变量3' },
  perkPrimaryStyle: { name: '主要天赋风格', render: perkstyleDisplay },
  perkSubStyle: { name: '次要天赋风格', render: perkstyleDisplay },
  physicalDamageDealt: { name: '造成的物理伤害' },
  physicalDamageDealtToChampions: { name: '对英雄造成的物理伤害' },
  physicalDamageTaken: { name: '承受的物理伤害' },
  playerAugment1: { name: '强化1', render: augmentDisplay },
  playerAugment2: { name: '强化2', render: augmentDisplay },
  playerAugment3: { name: '强化3', render: augmentDisplay },
  playerAugment4: { name: '强化4', render: augmentDisplay },
  playerAugment5: { name: '强化5', render: augmentDisplay },
  playerAugment6: { name: '强化6', render: augmentDisplay },
  playerScore0: { name: '玩家得分0' },
  playerScore1: { name: '玩家得分1' },
  playerScore2: { name: '玩家得分2' },
  playerScore3: { name: '玩家得分3' },
  playerScore4: { name: '玩家得分4' },
  playerScore5: { name: '玩家得分5' },
  playerScore6: { name: '玩家得分6' },
  playerScore7: { name: '玩家得分7' },
  playerScore8: { name: '玩家得分8' },
  playerScore9: { name: '玩家得分9' },
  playerSubteamId: { name: '子队阵营' },
  quadraKills: { name: '四杀' },
  sightWardsBoughtInGame: { name: '视野守卫' },
  subteamPlacement: { name: '子队位次' },
  teamEarlySurrendered: { name: '团队重开' },
  timeCCingOthers: { name: '控制时间' },
  totalDamageDealt: { name: '造成的总伤害' },
  totalDamageDealtToChampions: { name: '对英雄造成的总伤害' },
  totalDamageTaken: { name: '承受的总伤害' },
  totalHeal: { name: '总治疗量' },
  totalMinionsKilled: { name: '击杀的小兵总数' },
  totalPlayerScore: { name: '总玩家得分' },
  totalScoreRank: { name: '总分排名' },
  totalTimeCrowdControlDealt: { name: '总控制时间' },
  totalUnitsHealed: { name: '治疗单位总数' },
  tripleKills: { name: '三杀' },
  trueDamageDealt: { name: '造成的真实伤害' },
  trueDamageDealtToChampions: { name: '对英雄造成的真实伤害' },
  trueDamageTaken: { name: '承受的真实伤害' },
  turretKills: { name: '防御塔摧毁' },
  unrealKills: { name: '虚幻击杀' },
  visionScore: { name: '视野得分' },
  visionWardsBoughtInGame: { name: '控制守卫' },
  wardsKilled: { name: '破坏的守卫' },
  wardsPlaced: { name: '放置的守卫' },
  win: { name: '胜利' },
  currentPlatformId: { name: '当前区服', render: platformDisplay },
  platformId: { name: '区服', render: platformDisplay }
}

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

  props.game.participants.forEach((p) => {
    c.push({
      key: p.participantId,
      maxWidth: RESERVED_COLUMN_WIDTH,

      title: () => {
        return h('div', { style: { display: 'flex' } }, [
          h(LcuImage, {
            style: { height: '20px', width: '20px' },
            src: championIcon(p.championId || -1)
          }),
          h(
            'span',
            { style: { 'margin-left': '2px' } },
            summonerName(
              participantInfoMap.value[p.participantId].gameName ||
                participantInfoMap.value[p.participantId].summonerName,
              participantInfoMap.value[p.participantId].tagLine
            )
          )
        ])
      },
      render: (data) => {
        const propKey = data.propKey as string

        const renderer =
          statsConfigMap[propKey]?.render ||
          ((content: any) => {
            if (typeof content === 'boolean') {
              return content ? '是' : '否'
            } else if (typeof content === 'number') {
              return content.toLocaleString()
            } else if (typeof content === 'string') {
              return content
            }

            return 'N/A'
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

  const champions: RowData = { propName: statsConfigMap['championId']?.name }
  props.game.participants.forEach((p) => {
    champions[p.participantId] = p.championId
    champions['propKey'] = 'championId'
  })

  const spells: RowData = { propName: statsConfigMap['spells']?.name }
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

  const pi: RowData = { propName: statsConfigMap['platformId']?.name }
  props.game.participants.forEach((p) => {
    pi[p.participantId] = participantInfoMap.value[p.participantId].platformId
    pi['propKey'] = 'platformId'
  })

  const teams: RowData = { propName: statsConfigMap['teams']?.name }
  props.game.participants.forEach((p) => {
    teams[p.participantId] = p.teamId
    teams['propKey'] = 'teams'
  })

  data.push(champions, spells, teams, cp, pi)

  const statsNames = Object.keys(props.game.participants[0].stats)

  statsNames.forEach((n) => {
    const row: RowData = {}

    row['propName'] = statsConfigMap[n]?.name || n
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
.opgg-champion-tier-wrapper {
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
