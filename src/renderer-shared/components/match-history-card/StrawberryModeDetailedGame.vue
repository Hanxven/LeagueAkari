<template>
  <div class="detailed-game-card">
    <DefineDetailedTable v-slot="{ participants }">
      <table
        class="team"
        :class="{
          win: participants[0].stats.win,
          lose: !participants[0].stats.win
        }"
      >
        <thead class="team-header">
          <tr>
            <th class="header-info">
              {{ participants[0].stats.win ? t('DetailedGame.win') : t('DetailedGame.lose') }}
            </th>
            <th class="header-kda">{{ t('DetailedGame.header.kda') }}</th>
            <th class="header-augments">{{ t('DetailedGame.header.augment') }}</th>
            <th class="header-damage">{{ t('DetailedGame.header.dmg') }}</th>
            <th class="header-gold">{{ t('DetailedGame.header.gold') }}</th>
            <th class="header-items">{{ t('DetailedGame.header.item') }}</th>
          </tr>
        </thead>
        <tbody class="participants">
          <tr
            class="participant"
            :class="{ self: p.isSelf }"
            v-for="p of participants"
            :key="p.identity.player.puuid"
          >
            <td style="min-width: 100px">
              <div class="info">
                <div class="champion">
                  <LcuImage class="champion-icon" :src="championIconUri(p.championId)" />
                  <div class="champion-level">{{ p.stats.champLevel }}</div>
                </div>
                <div class="name-and-rank">
                  <div
                    :title="
                      masked(
                        summonerName(
                          p.identity.player.gameName || p.identity.player.summonerName,
                          p.identity.player.tagLine
                        ),
                        name(p.championId)
                      )
                    "
                    class="name"
                    @click="() => emits('toSummoner', p.identity.player.puuid)"
                    @mouseup.prevent="(event) => handleMouseUp(event, p.identity.player.puuid)"
                    @mousedown="handleMouseDown"
                  >
                    {{ p.identity.player.puuid === EMPTY_PUUID ? `(${t('DetailedGame.bot')}) ` : ''
                    }}{{
                      masked(
                        summonerName(
                          p.identity.player.gameName || p.identity.player.summonerName,
                          p.identity.player.tagLine
                        ),
                        name(p.championId)
                      )
                    }}
                  </div>
                </div>
              </div>
            </td>
            <td style="width: 64px">
              <div class="kda">{{ p.stats.kills }}/{{ p.stats.deaths }}/{{ p.stats.assists }}</div>
            </td>
            <td style="width: 128px">
              <div class="augments">
                <AugmentDisplay :size="18" :augment-id="p.stats.playerAugment1" />
                <AugmentDisplay :size="18" :augment-id="p.stats.playerAugment2" />
                <AugmentDisplay :size="18" :augment-id="p.stats.playerAugment3" />
                <AugmentDisplay :size="18" :augment-id="p.stats.playerAugment4" />
                <AugmentDisplay :size="18" :augment-id="p.stats.playerAugment5" />
                <AugmentDisplay :size="18" :augment-id="p.stats.playerAugment6" />
              </div>
            </td>
            <td style="width: 124px">
              <div class="damage">
                <DamageMetricsBar
                  :baseline-damage="match.recordStats.maxTotalDamageDealt"
                  :total-damage="p.stats.totalDamageDealt"
                  :magic-damage="p.stats.magicDamageDealt"
                  :physical-damage="p.stats.physicalDamageDealt"
                  :true-damage="p.stats.trueDamageDealt"
                />
                <DamageMetricsBar
                  :baseline-damage="match.recordStats.maxTotalDamageTaken"
                  :total-damage="p.stats.totalDamageTaken"
                  :magic-damage="p.stats.magicalDamageTaken"
                  :physical-damage="p.stats.physicalDamageTaken"
                  :true-damage="p.stats.trueDamageTaken"
                />
              </div>
            </td>
            <td class="cell-gold" style="width: 72px">
              <div class="gold" :title="p.stats.goldEarned.toLocaleString()">
                {{ p.stats.goldEarned }} G
              </div>
            </td>
            <td style="width: 162px">
              <div class="items">
                <ItemDisplay :size="20" :item-id="p.stats.item0" />
                <ItemDisplay :size="20" :item-id="p.stats.item1" />
                <ItemDisplay :size="20" :item-id="p.stats.item2" />
                <ItemDisplay :size="20" :item-id="p.stats.item3" />
                <ItemDisplay :size="20" :item-id="p.stats.item4" />
                <ItemDisplay :size="20" :item-id="p.stats.item5" />
                <ItemDisplay :size="20" is-trinket :item-id="p.stats.item6" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </DefineDetailedTable>
    <DetailedTable :index="0" :participants="match.team" />
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import AugmentDisplay from '@renderer-shared/components/widgets/AugmentDisplay.vue'
import ItemDisplay from '@renderer-shared/components/widgets/ItemDisplay.vue'
import { useChampionInfo } from '@renderer-shared/compositions/useChampionInfo'
import { useStreamerModeMaskedText } from '@renderer-shared/compositions/useStreamerModeMaskedText'
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import { EMPTY_PUUID } from '@shared/constants/common'
import { Game, Participant, ParticipantIdentity } from '@shared/types/league-client/match-history'
import { summonerName } from '@shared/utils/name'
import { createReusableTemplate } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

import DamageMetricsBar from './widgets/DamageMetricsBar.vue'

const { t } = useTranslation()

const [DefineDetailedTable, DetailedTable] = createReusableTemplate<{
  participants: ParticipantWithIdentity[]
  index: number
}>({ inheritAttrs: false })

const props = defineProps<{
  game: Game
  selfPuuid?: string
}>()

const emits = defineEmits<{
  toSummoner: [puuid: string, setCurrent?: boolean]
}>()

type ParticipantWithIdentity = Participant & { isSelf: boolean; identity: ParticipantIdentity }

const match = computed(() => {
  const identities: Record<string, ParticipantIdentity> = {}
  props.game.participantIdentities.forEach((identity) => {
    identities[identity.participantId] = identity
  })

  const all: ParticipantWithIdentity[] = props.game.participants.map((participant) => ({
    ...participant,
    isSelf: identities[participant.participantId].player.puuid === props.selfPuuid,
    identity: identities[participant.participantId]
  }))

  const recordStats = {
    maxTotalDamageDealt: 0,
    maxTotalDamageTaken: 0
  }

  all.forEach((p) => {
    recordStats.maxTotalDamageDealt = Math.max(
      recordStats.maxTotalDamageDealt,
      p.stats.totalDamageDealt
    )
    recordStats.maxTotalDamageTaken = Math.max(
      recordStats.maxTotalDamageTaken,
      p.stats.totalDamageTaken
    )
  })

  return {
    team: all,
    recordStats
  }
})

const handleMouseDown = (event: MouseEvent) => {
  if (event.button === 1) {
    event.preventDefault()
  }
}

const handleMouseUp = (event: MouseEvent, puuid: string) => {
  if (event.button === 1) {
    emits('toSummoner', puuid, false)
  }
}

const { masked } = useStreamerModeMaskedText()
const { name } = useChampionInfo()
</script>

<style lang="less" scoped>
.detailed-game-card {
  border-radius: 4px;
  width: 740px;
  overflow: hidden;
}

table,
th,
td {
  border: none;
}

td:first-child {
  padding-left: 8px;
}

td:last-child {
  padding-right: 8px;
}

table {
  border-spacing: 0;
}

.team-header {
  font-size: 11px;
  height: 30px;

  th {
    font-weight: normal;
  }

  .header-info {
    text-align: left;
    padding-left: 24px;
  }
}

.info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.champion {
  position: relative;
  height: 32px;
  width: 32px;
}

.champion-icon {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.champion-level {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  font-size: 10px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.621);
}

.summoner-spells {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 34px;
  width: 16px;
  gap: 2px;
}

.items {
  display: flex;
  justify-content: center;
  gap: 2px;
}

.cs,
.wards {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.name-and-rank {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 4px;
  flex-grow: 1;
  width: 0;

  .name {
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    transition: color 0.3s ease;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;

    &:hover {
      color: #63e2b7;
    }
  }

  .rank {
    font-size: 10px;
    color: rgb(159, 159, 159);
  }
}

.augments {
  display: flex;
  gap: 2px;
  justify-content: center;

  .augment {
    height: 20px;
    width: 20px;
    box-sizing: border-box;
    background-color: rgb(34, 34, 34);
    border-radius: 2px;
  }

  .augment.prismatic {
    border: 1px solid rgb(175, 141, 255);
  }

  .augment.gold {
    border: 1px solid rgb(255, 183, 0);
  }

  .augment.silver {
    border: 1px solid rgb(247, 247, 247);
  }

  .augment-empty {
    height: 20px;
    width: 20px;
    border-radius: 2px;
    background-color: rgb(34, 34, 34);
  }
}

.kda {
  color: rgb(214, 214, 214);
  font-size: 11px;
  text-align: center;
}

.damage {
  display: flex;
  gap: 8px;
  justify-content: center;
  color: rgb(214, 214, 214);
  font-size: 11px;
}

.gold {
  text-align: center;
  font-size: 11px;
}

.team {
  width: 100%;

  &.win {
    background-color: rgba(30, 39, 58, 0.9);
  }

  &.lose {
    background-color: rgba(65, 39, 43, 0.9);
  }
}

.participant {
  height: 40px;

  .win &.self {
    background-color: rgb(44, 57, 86);
  }

  .lose &.self {
    background-color: rgb(90, 53, 59);
  }
}

.divider {
  background-color: rgb(76, 76, 76);
  height: 1px;
  margin: 4px 0px;
}
</style>
