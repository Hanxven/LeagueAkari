<template>
  <div class="opgg-champion-wrapper">
    <!-- 真的想不出一点容易组织的结构, 就这样复制粘贴吧 -->
    <NSpin description="Loading ..." v-if="loading" class="spin-mask"></NSpin>
    <NScrollbar>
      <div class="card-area" v-if="info">
        <div class="card-content">
          <div class="first-line" :title="info.id === 893 ? t('OpggChampion.adorableRabi') : ''">
            <ChampionIcon ring round class="image" :champion-id="info.id" />
            <div class="name-tier">
              <div class="name">
                {{ lcs.gameData.champions[info.id]?.name || info.id }}
              </div>
              <div class="tier" :class="[[`tier-${info.tier}`]]">
                {{ tierText }}
              </div>
              <div class="position" v-if="props.position && props.position !== 'none'">
                {{ t(`Opgg.positions.${props.position}`) || props.position }}
              </div>
            </div>
            <div class="prop-groups">
              <div class="prop-field" v-if="info.total_place && info.play">
                <div class="prop">{{ t('OpggChampion.avgPlace') }}</div>
                <div class="value">{{ (info.total_place / (info.play || 1)).toFixed(2) }}</div>
              </div>
              <div class="prop-field" v-if="info.first_place && info.play">
                <div class="prop">{{ t('OpggChampion.1st') }}</div>
                <div class="value">
                  {{ ((info.first_place / (info.play || 1)) * 100).toFixed(2) }}%
                </div>
              </div>
              <div class="prop-field" v-if="info.win_rate">
                <div class="prop">{{ t('OpggChampion.winRate') }}</div>
                <div class="value">{{ (info.win_rate * 100).toFixed(2) }}%</div>
              </div>
              <div class="prop-field" v-if="info.play && info.win">
                <div class="prop">{{ t('OpggChampion.winRate') }}</div>
                <div class="value">{{ ((info.win / (info.play || 1)) * 100).toFixed(2) }}%</div>
              </div>
              <div class="prop-field" v-if="info.pick_rate">
                <div class="prop">{{ t('OpggChampion.pickRate') }}</div>
                <div class="value">{{ (info.pick_rate * 100).toFixed(2) }}%</div>
              </div>
              <div class="prop-field" v-if="info.ban_rate">
                <div class="prop">{{ t('OpggChampion.banRate') }}</div>
                <div class="value">{{ (info.ban_rate * 100).toFixed(2) }}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        class="card-area"
        v-if="
          (info && info.position && info.position.counters?.length) ||
          (data && data.data.counters && data.data.counters.length)
        "
      >
        <div class="card-title">
          {{ isCountersExpanded ? t('OpggChampion.allCounters') : t('OpggChampion.counter') }}
          <NSwitch
            size="small"
            v-model:value="isCountersExpanded"
            :round="false"
            style="margin-right: 8px; /* a little adjustment for a better looking */"
            :rail-style="
              ({ checked }) => ({
                backgroundColor: checked ? '#2a947d' : '#d75a5a'
              })
            "
          >
            <template #checked>{{ t('OpggChampion.allC') }}</template>
            <template #unchecked>{{ t('OpggChampion.counterC') }}</template>
          </NSwitch>
        </div>
        <div class="card-content" v-if="!isCountersExpanded">
          <div class="counters" v-if="info && info.position">
            <div
              class="counter"
              v-for="c of info.position.counters"
              :key="c.champion_id"
              @click="() => emits('showChampion', c.champion_id)"
            >
              <LcuImage class="image" :src="championIconUri(c.champion_id)" />
              <div class="win-rate" :title="t('OpggChampion.winRate')">
                {{ ((c.win / (c.play || 1)) * 100).toFixed(2) }}%
              </div>
              <div class="play">
                {{
                  t('OpggChampion.times', {
                    times: c.play.toLocaleString()
                  })
                }}
              </div>
            </div>
          </div>
          <div class="counter-empty" v-else>{{ t('OpggChampion.empty') }}</div>
        </div>
        <div class="card-content" v-if="isCountersExpanded">
          <div class="counters" v-if="data && data.data.counters && data.data.counters.length">
            <div
              class="counter"
              @click="() => emits('showChampion', c.champion_id)"
              v-for="c of data.data.counters.toSorted(
                (a: any, b: any) => b.win / (b.play || 1) - a.win / (a.play || 1)
              )"
              :key="c.champion_id"
            >
              <LcuImage class="image" :src="championIconUri(c.champion_id)" />
              <div
                class="win-rate"
                :title="t('OpggChampion.winRate')"
                :class="{ win: c.win / (c.play || 1) > 0.5 }"
              >
                {{ ((c.win / (c.play || 1)) * 100).toFixed(2) }}%
              </div>
              <div class="play">
                {{
                  t('OpggChampion.times', {
                    times: c.play.toLocaleString()
                  })
                }}
              </div>
            </div>
          </div>
          <div class="counter-empty" v-else>{{ t('OpggChampion.empty') }}</div>
        </div>
      </div>
      <div
        class="card-area"
        v-if="data && data.data.summoner_spells && data.data.summoner_spells.length"
      >
        <div class="card-title">
          {{ t('OpggChampion.spells') }}
          <NCheckbox size="small" v-model:checked="isSummonerSpellsExpanded">
            {{ t('OpggChampion.showAll') }}</NCheckbox
          >
        </div>
        <div class="card-content">
          <div
            class="summoner-spells-group"
            v-for="(s, i) of data.data.summoner_spells.slice(
              0,
              isSummonerSpellsExpanded ? Infinity : 2
            )"
          >
            <div class="index">#{{ i + 1 }}</div>
            <div class="spells">
              <SummonerSpellDisplay :size="28" :spell-id="spell" v-for="spell of s.ids" />
            </div>
            <div class="desc">
              <div class="pick">
                <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                  >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                >
                <span class="pick-play" :title="t('OpggChampion.plays')">
                  {{
                    t('OpggChampion.times', {
                      times: s.play.toLocaleString()
                    })
                  }}</span
                >
              </div>
              <div class="win-rate" :title="t('OpggChampion.winRate')">
                {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
              </div>
              <div class="buttons">
                <NButton
                  @click="() => emits('setSummonerSpells', s.ids)"
                  size="tiny"
                  type="primary"
                  secondary
                  :disabled="lcs.gameflow.phase !== 'ChampSelect'"
                >
                  {{ t('OpggChampion.apply') }}</NButton
                >
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-area" v-if="data && data.data.runes && data.data.runes.length">
        <div class="card-title">
          {{ t('OpggChampion.runes')
          }}<NCheckbox size="small" v-model:checked="isRunesExpanded">
            {{ t('OpggChampion.showAll') }}</NCheckbox
          >
        </div>
        <div class="card-content">
          <div
            class="runes-group"
            v-for="(r, i) of data.data.runes.slice(0, isRunesExpanded ? Infinity : 2)"
          >
            <div class="index">#{{ i + 1 }}</div>
            <div>
              <div class="primary">
                <PerkstyleDisplay
                  style="margin-right: 4px"
                  :size="24"
                  :perkstyle-id="r.primary_page_id"
                />
                <PerkDisplay
                  :max-width="280"
                  :size="18"
                  v-for="p of r.primary_rune_ids"
                  :perk-id="p"
                />
              </div>
              <div class="secondary">
                <PerkstyleDisplay
                  style="margin-right: 4px"
                  class="secondary-style"
                  :size="24"
                  :perkstyle-id="r.secondary_page_id"
                />
                <PerkDisplay
                  :max-width="280"
                  :size="18"
                  v-for="p of r.secondary_rune_ids"
                  :perk-id="p"
                />
                <div class="gap"></div>
                <PerkDisplay :max-width="280" :size="18" v-for="p of r.stat_mod_ids" :perk-id="p" />
              </div>
            </div>
            <div class="desc">
              <div class="pick">
                <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                  >{{ (r.pick_rate * 100).toFixed(2) }}%</span
                >
                <span class="pick-play" :title="t('OpggChampion.plays')">
                  {{
                    t('OpggChampion.times', {
                      times: r.play.toLocaleString()
                    })
                  }}</span
                >
              </div>
              <div class="win-rate" :title="t('OpggChampion.winRate')">
                {{ ((r.win / (r.play || 1)) * 100).toFixed(2) }}%
              </div>
              <div class="buttons">
                <NButton
                  @click="() => emits('setRunes', r)"
                  size="tiny"
                  type="primary"
                  :disabled="lcs.connectionState !== 'connected'"
                  secondary
                  >{{ t('OpggChampion.apply') }}</NButton
                >
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-area" v-if="data && data.data.synergies && data.data.synergies.length">
        <div class="card-title">
          {{ t('OpggChampion.synergies')
          }}<NCheckbox size="small" v-model:checked="isSynergiesExpanded">{{
            t('OpggChampion.showAll')
          }}</NCheckbox>
        </div>
        <div class="card-content">
          <div
            class="synergies-group"
            v-for="(s, i) of data.data.synergies.slice(0, isSynergiesExpanded ? Infinity : 4)"
          >
            <div class="index" style="margin-right: 4px">#{{ i + 1 }}</div>
            <div class="image-name" @click="() => emits('showChampion', s.champion_id)">
              <LcuImage class="image" :src="championIconUri(s.champion_id)" />
              <span>{{ lcs.gameData.champions[s.champion_id]?.name || s.champion_id }}</span>
            </div>
            <div class="desc">
              <div class="value-text">
                <span class="value">{{ (s.total_place / (s.play || 1)).toFixed(2) }}</span>
                <span class="text">{{ t('OpggChampion.avgPlace') }} </span>
              </div>
              <div class="value-text">
                <span class="value">{{ ((s.first_place / (s.play || 1)) * 100).toFixed(2) }}%</span>
                <span class="text">{{ t('OpggChampion.1st') }}</span>
              </div>
              <div class="value-text">
                <span class="value" :title="t('OpggChampion.pickRate')"
                  >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                >
                <span class="text" :title="t('OpggChampion.plays')">
                  {{
                    t('OpggChampion.times', {
                      times: s.play.toLocaleString()
                    })
                  }}</span
                >
              </div>
              <div class="value-text">
                <span class="value" :title="t('OpggChampion.winRate')"
                  >{{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%</span
                >
                <span class="text" :title="t('OpggChampion.winRate')">{{
                  t('OpggChampion.winRate')
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-area" v-if="augments && Object.keys(augments).length">
        <NTabs v-model:value="augmentTab" size="small" :animated="false">
          <template #suffix>
            <NCheckbox size="small" v-model:checked="isAugmentsExpanded">{{
              t('OpggChampion.showAll')
            }}</NCheckbox>
          </template>
          <NTabPane name="silver" v-if="augments && augments[1]">
            <template #tab>
              <span class="augments-tab-title">{{ t('OpggChampion.augmentSilver') }}</span>
            </template>
            <div
              class="augments-group"
              v-for="(a, i) of augments[1].augments.slice(0, isAugmentsExpanded ? Infinity : 4)"
            >
              <div class="index">#{{ i + 1 }}</div>
              <div class="image-name">
                <AugmentDisplay :size="24" :augment-id="a.id" style="margin-right: 4px" />
                <span class="name">{{ lcs.gameData.augments[a.id]?.nameTRA || a.id }}</span>
              </div>
              <div class="desc">
                <div class="pick">
                  <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                    >{{ (a.pick_rate * 100).toFixed(2) }}%</span
                  >
                  <span class="pick-play" :title="t('OpggChampion.plays')">
                    {{
                      t('OpggChampion.times', {
                        times: a.play.toLocaleString()
                      })
                    }}</span
                  >
                </div>
                <div class="win-rate" :title="t('OpggChampion.winRate')">
                  {{ ((a.win / (a.play || 1)) * 100).toFixed(2) }}%
                </div>
              </div>
            </div>
          </NTabPane>
          <NTabPane name="gold" v-if="augments && augments[4]">
            <template #tab>
              <span class="augments-tab-title">{{ t('OpggChampion.augmentGold') }}</span>
            </template>
            <div
              class="augments-group"
              v-for="(a, i) of augments[4].augments.slice(0, isAugmentsExpanded ? Infinity : 4)"
            >
              <div class="index">#{{ i + 1 }}</div>
              <div class="image-name">
                <AugmentDisplay :size="24" :augment-id="a.id" style="margin-right: 4px" />
                <span class="name">{{ lcs.gameData.augments[a.id]?.nameTRA || a.id }}</span>
              </div>
              <div class="desc">
                <div class="pick">
                  <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                    >{{ (a.pick_rate * 100).toFixed(2) }}%</span
                  >
                  <span class="pick-play" :title="t('OpggChampion.plays')">
                    {{
                      t('OpggChampion.times', {
                        times: a.play.toLocaleString()
                      })
                    }}</span
                  >
                </div>
                <div class="win-rate" :title="t('OpggChampion.winRate')">
                  {{ ((a.win / (a.play || 1)) * 100).toFixed(2) }}%
                </div>
              </div>
            </div>
          </NTabPane>
          <NTabPane name="prism" v-if="augments && augments[8]">
            <template #tab>
              <span class="augments-tab-title">{{ t('OpggChampion.augmentPrism') }}</span>
            </template>

            <div
              class="augments-group"
              v-for="(a, i) of augments[8].augments.slice(0, isAugmentsExpanded ? Infinity : 4)"
            >
              <div class="index">#{{ i + 1 }}</div>
              <div class="image-name">
                <AugmentDisplay :size="24" :augment-id="a.id" style="margin-right: 4px" />
                <span class="name">{{ lcs.gameData.augments[a.id]?.nameTRA || a.id }}</span>
              </div>
              <div class="desc">
                <div class="pick">
                  <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                    >{{ (a.pick_rate * 100).toFixed(2) }}%</span
                  >
                  <span class="pick-play" :title="t('OpggChampion.plays')">
                    {{
                      t('OpggChampion.times', {
                        times: a.play.toLocaleString()
                      })
                    }}</span
                  >
                </div>
                <div class="win-rate" :title="t('OpggChampion.winRate')">
                  {{ ((a.win / (a.play || 1)) * 100).toFixed(2) }}%
                </div>
              </div>
            </div>
          </NTabPane>
        </NTabs>
      </div>
      <div
        class="card-area"
        v-if="data && data.data.skill_masteries && data.data.skill_masteries.length"
      >
        <div class="card-title">
          {{ t('OpggChampion.abilityBuild')
          }}<NCheckbox
            v-if="data.data.skill_masteries.length > 2"
            size="small"
            v-model:checked="isSkillMasteriesExpanded"
            >{{ t('OpggChampion.showAll') }}</NCheckbox
          >
        </div>
        <div class="card-content">
          <div
            class="skills-group"
            v-for="(m, i) of data.data.skill_masteries.slice(
              0,
              isSkillMasteriesExpanded ? Infinity : 2
            )"
          >
            <div class="index" style="margin-right: 4px">#{{ i + 1 }}</div>
            <div>
              <div class="skill-route">
                <template v-for="(s, i) of m.ids">
                  <div
                    class="skill"
                    :class="{
                      w: s.startsWith('W'),
                      q: s.startsWith('Q'),
                      e: s.startsWith('E'),
                      r: s.startsWith('R')
                    }"
                  >
                    {{ s }}
                  </div>
                  <NIcon v-if="i < m.ids.length - 1" class="separator">
                    <ArrowForwardIosOutlinedIcon />
                  </NIcon>
                </template>
              </div>
              <div class="skill-details">
                <!-- display only one group of it -->
                <div
                  class="skill"
                  :class="{
                    w: s.startsWith('W'),
                    q: s.startsWith('Q'),
                    e: s.startsWith('E'),
                    r: s.startsWith('R')
                  }"
                  v-for="s of m.builds[0].order"
                >
                  {{ s }}
                </div>
              </div>
            </div>
            <div class="desc">
              <div class="pick">
                <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                  >{{ (m.pick_rate * 100).toFixed(2) }}%</span
                >
                <span class="pick-play" :title="t('OpggChampion.plays')">
                  {{
                    t('OpggChampion.times', {
                      times: m.play.toLocaleString()
                    })
                  }}</span
                >
              </div>
              <div class="win-rate" :title="t('OpggChampion.winRate')">
                {{ ((m.win / (m.play || 1)) * 100).toFixed(2) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- inline styled :( -->
      <div class="card-area" v-if="isAbleToAddToItemSet">
        <div class="card-title">{{ t('OpggChampion.applyRunesText') }}</div>
        <div class="card-content">
          <div
            style="display: flex; align-items: center; justify-content: space-between; height: 38px"
          >
            <span style="font-size: 13px">{{ t('OpggChampion.applyRunes') }}</span>
            <div style="min-width: 76px; display: flex; justify-content: center">
              <NButton
                size="tiny"
                type="primary"
                secondary
                @click="emits('addToItemSet')"
                :disabled="lcs.connectionState !== 'connected'"
                >{{ t('OpggChampion.apply') }}</NButton
              >
            </div>
          </div>
        </div>
      </div>
      <div
        class="card-area"
        v-if="data && data.data.starter_items && data.data.starter_items.length"
      >
        <div class="card-title">
          {{ t('OpggChampion.starterItemText')
          }}<NCheckbox
            v-if="data.data.starter_items.length > 4"
            size="small"
            v-model:checked="isStarterItemsExpanded"
            >{{ t('OpggChampion.showAll') }}</NCheckbox
          >
        </div>
        <div class="card-content">
          <div
            class="items-group"
            v-for="(s, i) of data.data.starter_items.slice(
              0,
              isStarterItemsExpanded ? Infinity : 4
            )"
          >
            <div class="index">#{{ i + 1 }}</div>
            <template v-for="(ss, i) of s.ids">
              <ItemDisplay :size="24" :item-id="ss" :max-width="300" />
              <NIcon v-if="i < s.ids.length - 1" class="separator">
                <ArrowForwardIosOutlinedIcon />
              </NIcon>
            </template>
            <div class="desc">
              <div class="pick">
                <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                  >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                >
                <span class="pick-play" :title="t('OpggChampion.plays')">
                  {{
                    t('OpggChampion.times', {
                      times: s.play.toLocaleString()
                    })
                  }}</span
                >
              </div>
              <div class="win-rate" :title="t('OpggChampion.winRate')">
                {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-area" v-if="data && data.data.starter_items && data.data.boots.length">
        <div class="card-title">
          鞋子<NCheckbox
            v-if="data.data.boots.length > 4"
            size="small"
            v-model:checked="isBootsExpanded"
            >{{ t('OpggChampion.showAll') }}</NCheckbox
          >
        </div>
        <div class="card-content">
          <div class="double-columns">
            <div
              class="items-group"
              v-for="(s, i) of data.data.boots.slice(0, isBootsExpanded ? Infinity : 4)"
            >
              <div class="index">#{{ i + 1 }}</div>
              <template v-for="(ss, i) of s.ids">
                <ItemDisplay :size="24" :item-id="ss" :max-width="300" />
                <NIcon v-if="i < s.ids.length - 1" class="separator">
                  <ArrowForwardIosOutlinedIcon />
                </NIcon>
              </template>
              <div class="desc">
                <div class="pick">
                  <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                    >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                  >
                  <span class="pick-play" :title="t('OpggChampion.plays')">
                    {{
                      t('OpggChampion.times', {
                        times: s.play.toLocaleString()
                      })
                    }}
                  </span>
                </div>
                <div class="win-rate" :title="t('OpggChampion.winRate')">
                  {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-area" v-if="data && data.data.prism_items && data.data.prism_items.length">
        <div class="card-title">
          {{ t('OpggChampion.prismItemText')
          }}<NCheckbox
            v-if="data.data.prism_items.length > 4"
            size="small"
            v-model:checked="isPrismItemsExpanded"
            >{{ t('OpggChampion.showAll') }}</NCheckbox
          >
        </div>
        <div class="card-content">
          <div class="double-columns">
            <div
              class="items-group"
              v-for="(s, i) of data.data.prism_items.slice(0, isPrismItemsExpanded ? Infinity : 4)"
            >
              <div class="index">#{{ i + 1 }}</div>
              <template v-for="(ss, i) of s.ids">
                <ItemDisplay :size="24" :item-id="ss" :max-width="300" />
                <NIcon v-if="i < s.ids.length - 1" class="separator">
                  <ArrowForwardIosOutlinedIcon />
                </NIcon>
              </template>
              <div class="desc">
                <div class="pick">
                  <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                    >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                  >
                  <span class="pick-play" :title="t('OpggChampion.plays')">
                    {{
                      t('OpggChampion.times', {
                        times: s.play.toLocaleString()
                      })
                    }}</span
                  >
                </div>
                <div class="win-rate" :title="t('OpggChampion.winRate')">
                  {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-area" v-if="data && data.data.starter_items && data.data.core_items.length">
        <div class="card-title">
          {{ t('OpggChampion.coreItemText')
          }}<NCheckbox
            v-if="data.data.core_items.length > 4"
            size="small"
            v-model:checked="isCoreItemsExpanded"
            >{{ t('OpggChampion.showAll') }}</NCheckbox
          >
        </div>
        <div class="card-content">
          <div
            class="items-group"
            v-for="(s, i) of data.data.core_items.slice(0, isCoreItemsExpanded ? Infinity : 4)"
          >
            <div class="index">#{{ i + 1 }}</div>
            <template v-for="(ss, i) of s.ids">
              <ItemDisplay :size="24" :item-id="ss" :max-width="300" />
              <NIcon v-if="i < s.ids.length - 1" class="separator">
                <ArrowForwardIosOutlinedIcon />
              </NIcon>
            </template>
            <div class="desc">
              <div class="pick">
                <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                  >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                >
                <span class="pick-play" :title="t('OpggChampion.plays')">{{
                  t('OpggChampion.times', {
                    times: s.play.toLocaleString()
                  })
                }}</span>
              </div>
              <div class="win-rate" :title="t('OpggChampion.winRate')">
                {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-area" v-if="data && data.data.starter_items && data.data.last_items.length">
        <div class="card-title">
          {{ t('OpggChampion.itemText')
          }}<NCheckbox
            v-if="data.data.last_items.length > 8"
            size="small"
            v-model:checked="isLastItemsExpanded"
            >{{ t('OpggChampion.showAll') }}</NCheckbox
          >
        </div>
        <div class="card-content">
          <div class="double-columns">
            <div
              class="items-group"
              v-for="(s, i) of data.data.last_items.slice(0, isLastItemsExpanded ? Infinity : 8)"
            >
              <div class="index">#{{ i + 1 }}</div>
              <template v-for="(ss, i) of s.ids">
                <ItemDisplay :size="24" :item-id="ss" :max-width="300" />
                <NIcon v-if="i < s.ids.length - 1" class="separator">
                  <ArrowForwardIosOutlinedIcon />
                </NIcon>
              </template>
              <div class="desc">
                <div class="pick">
                  <span class="pick-rate" :title="t('OpggChampion.pickRate')"
                    >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                  >
                  <span class="pick-play" :title="t('OpggChampion.plays')"
                    >{{
                      t('OpggChampion.times', {
                        times: s.play.toLocaleString()
                      })
                    }}
                  </span>
                </div>
                <div class="win-rate" :title="t('OpggChampion.winRate')">
                  {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import AugmentDisplay from '@renderer-shared/components/widgets/AugmentDisplay.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import ItemDisplay from '@renderer-shared/components/widgets/ItemDisplay.vue'
import PerkDisplay from '@renderer-shared/components/widgets/PerkDisplay.vue'
import PerkstyleDisplay from '@renderer-shared/components/widgets/PerkstyleDisplay.vue'
import SummonerSpellDisplay from '@renderer-shared/components/widgets/SummonerSpellDisplay.vue'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { ArrowForwardIosOutlined as ArrowForwardIosOutlinedIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NCheckbox,
  NIcon,
  NScrollbar,
  NSpin,
  NSwitch,
  NTabPane,
  NTabs,
  useMessage
} from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'

const props = defineProps<{
  region?: string
  tier?: string
  mode?: string
  position?: string
  version?: string
  loading?: boolean
  champion?: any
  data?: any
  isAbleToAddToItemSet?: boolean
}>()

const emits = defineEmits<{
  showChampion: [championId: number]
  setSummonerSpells: [ids: number[]]
  setRunes: [
    runes: {
      primary_page_id: number
      secondary_page_id: number
      primary_rune_ids: number[]
      secondary_rune_ids: number[]
      stat_mod_ids: number[]
    }
  ]
  addToItemSet: []
}>()

const { t } = useTranslation()

const lcs = useLeagueClientStore()

const info = computed(() => {
  if (!props.champion) {
    return null
  }

  if (props.mode === 'ranked') {
    const position = props.champion.positions?.find(
      (p: any) => p.name.toUpperCase() === props.position?.toUpperCase()
    )

    return {
      id: props.champion.id,
      pick_rate: position?.stats?.pick_rate,
      win_rate: position?.stats?.win_rate,
      ban_rate: position?.stats?.ban_rate,
      tier: position?.stats?.tier_data?.tier,
      position: position
    }
  }

  return {
    id: props.champion.id,
    pick_rate: props.champion.average_stats?.pick_rate,
    win_rate: props.champion.average_stats?.win_rate,
    ban_rate: props.champion.average_stats?.ban_rate,
    tier: props.champion.average_stats?.tier,
    first_place: props.champion.average_stats?.first_place,
    total_place: props.champion.average_stats?.total_place,
    play: props.champion.average_stats?.play,
    win: props.champion.average_stats?.win
  }
})

// OP.GG 使用 rarity 来表示三种不同的 augment 等级
// 1 - silver, 4 - gold, 8 - prism
const augments = computed(() => {
  if (!props.data) {
    return null
  }

  if (!props.data.data.augment_group) {
    return null
  }

  return props.data.data.augment_group.reduce((acc: any, cur: any) => {
    acc[cur.rarity] = cur
    return acc
  }, {})
})

const augmentTab = ref<string | undefined>('silver')
watchEffect(() => {
  if (!augments.value) {
    augmentTab.value = undefined
    return
  }

  if (augments.value[1]) {
    augmentTab.value = 'silver'
  } else if (augments.value[4]) {
    augmentTab.value = 'gold'
  } else if (augments.value[8]) {
    augmentTab.value = 'prism'
  } else {
    augmentTab.value = undefined
  }
})

const isSummonerSpellsExpanded = ref(false)
const isCountersExpanded = ref(false)
const isRunesExpanded = ref(false)
const isSynergiesExpanded = ref(false)
const isAugmentsExpanded = ref(false)
const isSkillMasteriesExpanded = ref(false)
const isStarterItemsExpanded = ref(false)
const isBootsExpanded = ref(false)
const isPrismItemsExpanded = ref(false)
const isCoreItemsExpanded = ref(false)
const isLastItemsExpanded = ref(false)

watchEffect(() => {
  if (!props.data) {
    isSummonerSpellsExpanded.value = false
    isRunesExpanded.value = false
    isSynergiesExpanded.value = false
    isAugmentsExpanded.value = false
    isSkillMasteriesExpanded.value = false
    isStarterItemsExpanded.value = false
    isBootsExpanded.value = false
    isPrismItemsExpanded.value = false
    isCoreItemsExpanded.value = false
    isLastItemsExpanded.value = false
    isCountersExpanded.value = false
  }
})

const tierText = computed(() => {
  if (!info.value) {
    return '-'
  }

  if (info.value.tier === undefined) {
    return '-'
  }

  if (info.value.tier === 0) {
    return 'OP'
  }

  return t('OpggChampion.tierText', {
    tier: info.value.tier
  })
})

if (import.meta.env.DEV) {
  watchEffect(() => {
    console.debug('OPGG Component: ', props.data, props.champion, info.value)
  })

  watchEffect(() => {
    console.debug('OPGG Component: Info', info.value)
  })
}
</script>

<style lang="less" scoped>
.opgg-champion-wrapper {
  position: relative;
  height: 100%;

  .spin-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10;
    background-color: rgba(0, 0, 0, 0.5);
  }
}

.card-area {
  border-radius: 2px;
  border: 1px solid #37373c;
  padding: 8px 8px;

  .card-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    font-weight: bold;
    margin-bottom: 8px;
  }

  &:not(:last-child) {
    margin-bottom: 4px;
  }

  &.toggle-to-current {
    background-color: #1b4e71;
    cursor: pointer;
  }
}

.skill-route {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
  align-items: center;
  flex-wrap: wrap;

  .skill {
    position: relative;
    padding: 0 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    min-width: 24px;
    height: 24px;
    border-radius: 4px;
    box-sizing: border-box;
  }

  .separator {
    font-size: 10px;
    color: #909090;
  }
}

.skill-details {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;

  .skill {
    position: relative;
    display: flex;
    padding: 0 2px;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    font-size: 10px;
    border-radius: 2px;
    box-sizing: border-box;
  }
}

.skill.w {
  color: #00d7b0;
  background-color: #3f3f46;
}

.skill.q {
  color: #01a8fb;
  background-color: #3f3f46;
}

.skill.e {
  color: #ff8200;
  background-color: #3f3f46;
}

.skill.r {
  color: white;
  background-color: #5f32e6;
}

.first-line {
  display: flex;
  align-items: center;
  gap: 8px;

  .image {
    width: 78px;
    height: 78px;
  }

  .prop-groups {
    display: flex;
    flex-wrap: wrap;
    align-self: flex-end;
    gap: 8px;
    justify-content: flex-end;
    width: 172px;
  }

  .name-tier {
    margin-right: auto;
  }

  .name {
    font-size: 18px;
    font-weight: bold;
  }

  .position {
    font-size: 13px;
    color: #c9c9c9;
  }

  .prop-field {
    width: 50px;
  }

  .tier {
    font-size: 14px;
    color: #c9c9c9;
  }

  .prop {
    color: #b2b2b2;
    font-size: 11px;
  }

  .value {
    font-size: 13px;
    font-weight: bold;
  }
}

.summoner-spells-group {
  display: flex;
  gap: 4px;
  align-items: center;

  &:not(:last-child) {
    margin-bottom: 4px;
  }

  .spells {
    display: flex;
    gap: 4px;
  }

  .desc {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex: 1;
  }

  .pick {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 76px;

    .pick-rate {
      font-size: 12px;
      color: #ebebeb;
      font-weight: bold;
    }

    .pick-play {
      font-size: 12px;
      color: #bebebe;
      text-align: center;
    }
  }

  .win-rate {
    min-width: 76px;
    font-size: 12px;
    color: #a0c6f8;
    font-weight: bold;
    text-align: center;
  }

  .buttons {
    display: flex;
    min-width: 76px;
    justify-content: center;
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

.card-content {
  .counter-empty {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 20px;
    font-size: 12px;
    color: #a4a4a4;
  }
}

.counters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .counter {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 46px;
    cursor: pointer;
    transition: filter 0.2s;

    &:hover {
      filter: brightness(1.2);
    }

    .image {
      width: 32px;
      height: 32px;
      margin-bottom: 4px;
    }

    .win-rate {
      font-size: 11px;
      font-weight: bold;
      color: #d75a5a;
    }

    .win-rate.win {
      color: #a0c6f8;
    }

    .play {
      font-size: 10px;
      color: #a4a4a4;
      text-align: center;
    }
  }
}

.skills-group {
  display: flex;
  align-items: center;
  min-height: 56px;

  &:not(:last-child) {
    margin-bottom: 8px;
  }

  .desc {
    display: flex;
    align-items: center;
    margin-left: auto;

    .pick {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 76px;

      .pick-rate {
        font-size: 12px;
        color: #ebebeb;
        font-weight: bold;
      }

      .pick-play {
        font-size: 12px;
        color: #bebebe;
        text-align: center;
      }
    }

    .win-rate {
      min-width: 76px;
      font-size: 12px;
      color: #a0c6f8;
      font-weight: bold;
      text-align: center;
    }
  }
}

.runes-group {
  display: flex;
  align-items: center;
  gap: 4px;

  .primary {
    display: flex;
    gap: 2px;
    align-items: flex-end;
    margin-bottom: 4px;
  }

  .secondary {
    display: flex;
    gap: 2px;
    align-items: flex-end;
  }

  &:not(:last-child) {
    margin-bottom: 12px;
  }

  .gap {
    width: 24px;
  }

  .desc {
    display: flex;
    align-items: center;
    margin-left: auto;

    .pick {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 76px;

      .pick-rate {
        font-size: 12px;
        color: #ebebeb;
        font-weight: bold;
      }

      .pick-play {
        font-size: 12px;
        color: #bebebe;
        text-align: center;
      }
    }

    .win-rate {
      min-width: 76px;
      font-size: 12px;
      color: #a0c6f8;
      font-weight: bold;
      text-align: center;
    }

    .buttons {
      display: flex;
      min-width: 76px;
      justify-content: center;
    }
  }
}

.items-group {
  gap: 4px;
  display: flex;
  align-items: center;
  margin-bottom: 4px;

  .separator {
    font-size: 10px;
    color: #909090;
  }

  .desc {
    display: flex;
    align-items: center;
    margin-left: auto;

    .pick {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 76px;

      .pick-rate {
        font-size: 12px;
        color: #ebebeb;
        font-weight: bold;
      }

      .pick-play {
        font-size: 12px;
        color: #bebebe;
        text-align: center;
      }
    }

    .win-rate {
      min-width: 76px;
      font-size: 12px;
      color: #a0c6f8;
      font-weight: bold;
      text-align: center;
    }
  }
}

.synergies-group {
  display: flex;
  align-items: center;
  gap: 4px;

  &:not(:last-child) {
    margin-bottom: 4px;
  }

  .image-name {
    display: flex;
    align-items: center;
    font-size: 12px;
    gap: 4px;
    cursor: pointer;
    transition: filter 0.2s;

    &:hover {
      filter: brightness(1.2);
    }

    .image {
      width: 24px;
      height: 24px;
    }
  }

  .desc {
    display: flex;
    align-items: center;
    margin-left: auto;

    .value-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 76px;

      .value {
        font-size: 12px;
        color: #ebebeb;
        font-weight: bold;
      }

      .text {
        font-size: 12px;
        color: #bebebe;
      }
    }
  }
}

.double-columns {
  display: grid;
  column-gap: 12px;
  grid-template-columns: 1fr 1fr;
}

.index {
  min-width: 16px;
  font-size: 10px;
  color: #b2b2b2;
}

.augments-tab-title {
  font-size: 12px;
  font-weight: bold;
}

.augments-group {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  gap: 4px;

  .image-name {
    display: flex;
    align-items: center;
    gap: 4px;

    .name {
      font-size: 12px;
    }
  }

  .desc {
    display: flex;
    align-items: center;
    margin-left: auto;

    .pick {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 76px;

      .pick-rate {
        font-size: 12px;
        color: #ebebeb;
        font-weight: bold;
      }

      .pick-play {
        font-size: 12px;
        color: #bebebe;
        text-align: center;
      }
    }

    .win-rate {
      min-width: 76px;
      font-size: 12px;
      color: #a0c6f8;
      font-weight: bold;
      text-align: center;
    }
  }
}
</style>
