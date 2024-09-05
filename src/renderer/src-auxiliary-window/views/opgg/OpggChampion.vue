<template>
  <div class="opgg-champion-wrapper">
    <!-- 真的想不出一点容易组织的结构, 就这样复制粘贴吧 -->
    <NSpin description="从 OP.GG 拉取数据中 ..." v-if="loading" class="spin-mask"></NSpin>
    <NScrollbar>
      <div class="card-area" v-if="info">
        <div class="card-content">
          <div class="first-line" :title="info.id === 893 ? '兔兔好可爱' : ''">
            <ChampionIcon ring round class="image" :champion-id="info.id" />
            <div class="name-tier">
              <div class="name">
                {{ gameData.champions[info.id]?.name || '-' }}
              </div>
              <div class="tier" :class="[[`tier-${info.tier}`]]">
                {{ tierText }}
              </div>
              <div class="position" v-if="props.position && props.position !== 'none'">
                {{ POSITION_TEXT[props.position] || props.position }}
              </div>
            </div>
            <div class="prop-groups">
              <div class="prop-field" v-if="info.total_place && info.play">
                <div class="prop">平均排名</div>
                <div class="value">{{ (info.total_place / (info.play || 1)).toFixed(2) }}</div>
              </div>
              <div class="prop-field" v-if="info.first_place && info.play">
                <div class="prop">第一</div>
                <div class="value">
                  {{ ((info.first_place / (info.play || 1)) * 100).toFixed(2) }}%
                </div>
              </div>
              <div class="prop-field" v-if="info.win_rate">
                <div class="prop">胜率</div>
                <div class="value">{{ (info.win_rate * 100).toFixed(2) }}%</div>
              </div>
              <div class="prop-field" v-if="info.play && info.win">
                <div class="prop">胜率</div>
                <div class="value">{{ ((info.win / (info.play || 1)) * 100).toFixed(2) }}%</div>
              </div>
              <div class="prop-field" v-if="info.pick_rate">
                <div class="prop">登场率</div>
                <div class="value">{{ (info.pick_rate * 100).toFixed(2) }}%</div>
              </div>
              <div class="prop-field" v-if="info.ban_rate">
                <div class="prop">禁用率</div>
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
          {{ isCountersExpanded ? '全部对位' : '劣势对位' }}
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
            <template #checked>全部</template>
            <template #unchecked>劣势</template>
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
              <LcuImage class="image" :src="championIconUrl(c.champion_id)" />
              <div class="win-rate" title="胜率">
                {{ ((c.win / (c.play || 1)) * 100).toFixed(2) }}%
              </div>
              <div class="play">{{ c.play.toLocaleString() }} 场</div>
            </div>
          </div>
          <div class="counter-empty" v-else>暂无数据</div>
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
              <LcuImage class="image" :src="championIconUrl(c.champion_id)" />
              <div class="win-rate" title="胜率" :class="{ win: c.win / (c.play || 1) > 0.5 }">
                {{ ((c.win / (c.play || 1)) * 100).toFixed(2) }}%
              </div>
              <div class="play">{{ c.play.toLocaleString() }} 场</div>
            </div>
          </div>
          <div class="counter-empty" v-else>暂无数据</div>
        </div>
      </div>
      <div
        class="card-area"
        v-if="data && data.data.summoner_spells && data.data.summoner_spells.length"
      >
        <div class="card-title">
          召唤师技能
          <NCheckbox size="small" v-model:checked="isSummonerSpellsExpanded">展示全部</NCheckbox>
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
                <span class="pick-rate" title="登场率">{{ (s.pick_rate * 100).toFixed(2) }}%</span>
                <span class="pick-play" title="总场次">{{ s.play.toLocaleString() }} 场</span>
              </div>
              <div class="win-rate" title="胜率">
                {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
              </div>
              <div class="buttons">
                <NButton
                  @click="() => emits('setSummonerSpells', s.ids)"
                  size="small"
                  type="primary"
                  secondary
                  :disabled="gameflow.phase !== 'ChampSelect'"
                  title="点按以设置为此召唤师技能"
                  >应用</NButton
                >
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-area" v-if="data && data.data.runes && data.data.runes.length">
        <div class="card-title">
          符文配法<NCheckbox size="small" v-model:checked="isRunesExpanded">展示全部</NCheckbox>
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
                <span class="pick-rate" title="登场率">{{ (r.pick_rate * 100).toFixed(2) }}%</span>
                <span class="pick-play" title="总场次">{{ r.play.toLocaleString() }} 场</span>
              </div>
              <div class="win-rate" title="胜率">
                {{ ((r.win / (r.play || 1)) * 100).toFixed(2) }}%
              </div>
              <div class="buttons">
                <NButton
                  @click="() => emits('setRunes', r)"
                  size="small"
                  type="primary"
                  :disabled="lc.state !== 'connected'"
                  secondary
                  title="点按以设置为此符文配法"
                  >应用</NButton
                >
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-area" v-if="data && data.data.synergies && data.data.synergies.length">
        <div class="card-title">
          伙伴<NCheckbox size="small" v-model:checked="isSynergiesExpanded">展示全部</NCheckbox>
        </div>
        <div class="card-content">
          <div
            class="synergies-group"
            v-for="(s, i) of data.data.synergies.slice(0, isSynergiesExpanded ? Infinity : 4)"
          >
            <div class="index" style="margin-right: 4px">#{{ i + 1 }}</div>
            <div class="image-name" @click="() => emits('showChampion', s.champion_id)">
              <LcuImage class="image" :src="championIconUrl(s.champion_id)" />
              <span>{{ gameData.champions[s.champion_id]?.name || s.champion_id }}</span>
            </div>
            <div class="desc">
              <div class="value-text">
                <span class="value">{{ (s.total_place / (s.play || 1)).toFixed(2) }}</span>
                <span class="text">平均排名</span>
              </div>
              <div class="value-text">
                <span class="value">{{ ((s.first_place / (s.play || 1)) * 100).toFixed(2) }}%</span>
                <span class="text">第一名</span>
              </div>
              <div class="value-text">
                <span class="value" title="登场率">{{ (s.pick_rate * 100).toFixed(2) }}%</span>
                <span class="text" title="总场次">{{ s.play.toLocaleString() }} 场</span>
              </div>
              <div class="value-text">
                <span class="value" title="胜率"
                  >{{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%</span
                >
                <span class="text" title="胜率">胜率</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-area" v-if="augments && Object.keys(augments).length">
        <NTabs v-model:value="augmentTab" size="small" :animated="false">
          <template #suffix>
            <NCheckbox size="small" v-model:checked="isAugmentsExpanded">展示全部</NCheckbox>
          </template>
          <NTabPane name="silver" v-if="augments && augments[1]">
            <template #tab>
              <span class="augments-tab-title">白银阶</span>
            </template>

            <div
              class="augments-group"
              v-for="(a, i) of augments[1].augments.slice(0, isAugmentsExpanded ? Infinity : 4)"
            >
              <div class="index">#{{ i + 1 }}</div>
              <div class="image-name">
                <AugmentDisplay :size="24" :augment-id="a.id" style="margin-right: 4px" />
                <span class="name">{{ gameData.augments[a.id]?.nameTRA || a.id }}</span>
              </div>
              <div class="desc">
                <div class="pick">
                  <span class="pick-rate" title="登场率"
                    >{{ (a.pick_rate * 100).toFixed(2) }}%</span
                  >
                  <span class="pick-play" title="总场次">{{ a.play.toLocaleString() }} 场</span>
                </div>
                <div class="win-rate" title="胜率">
                  {{ ((a.win / (a.play || 1)) * 100).toFixed(2) }}%
                </div>
              </div>
            </div>
          </NTabPane>
          <NTabPane name="gold" v-if="augments && augments[4]">
            <template #tab>
              <span class="augments-tab-title">黄金阶</span>
            </template>
            <div
              class="augments-group"
              v-for="(a, i) of augments[4].augments.slice(0, isAugmentsExpanded ? Infinity : 4)"
            >
              <div class="index">#{{ i + 1 }}</div>
              <div class="image-name">
                <AugmentDisplay :size="24" :augment-id="a.id" style="margin-right: 4px" />
                <span class="name">{{ gameData.augments[a.id]?.nameTRA || a.id }}</span>
              </div>
              <div class="desc">
                <div class="pick">
                  <span class="pick-rate" title="登场率"
                    >{{ (a.pick_rate * 100).toFixed(2) }}%</span
                  >
                  <span class="pick-play" title="总场次">{{ a.play.toLocaleString() }} 场</span>
                </div>
                <div class="win-rate" title="胜率">
                  {{ ((a.win / (a.play || 1)) * 100).toFixed(2) }}%
                </div>
              </div>
            </div>
          </NTabPane>
          <NTabPane name="prism" v-if="augments && augments[8]">
            <template #tab>
              <span class="augments-tab-title">棱彩阶</span>
            </template>

            <div
              class="augments-group"
              v-for="(a, i) of augments[8].augments.slice(0, isAugmentsExpanded ? Infinity : 4)"
            >
              <div class="index">#{{ i + 1 }}</div>
              <div class="image-name">
                <AugmentDisplay :size="24" :augment-id="a.id" style="margin-right: 4px" />
                <span class="name">{{ gameData.augments[a.id]?.nameTRA || a.id }}</span>
              </div>
              <div class="desc">
                <div class="pick">
                  <span class="pick-rate" title="登场率"
                    >{{ (a.pick_rate * 100).toFixed(2) }}%</span
                  >
                  <span class="pick-play" title="总场次">{{ a.play.toLocaleString() }} 场</span>
                </div>
                <div class="win-rate" title="胜率">
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
          技能点法<NCheckbox
            v-if="data.data.skill_masteries.length > 2"
            size="small"
            v-model:checked="isSkillMasteriesExpanded"
            >展示全部</NCheckbox
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
                      w: s === 'W',
                      q: s === 'Q',
                      e: s === 'E',
                      r: s === 'R'
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
                    w: s === 'W',
                    q: s === 'Q',
                    e: s === 'E',
                    r: s === 'R'
                  }"
                  v-for="s of m.builds[0].order"
                >
                  {{ s }}
                </div>
              </div>
            </div>
            <div class="desc">
              <div class="pick">
                <span class="pick-rate" title="登场率">{{ (m.pick_rate * 100).toFixed(2) }}%</span>
                <span class="pick-play" title="总场次">{{ m.play.toLocaleString() }} 场</span>
              </div>
              <div class="win-rate" title="胜率">
                {{ ((m.win / (m.play || 1)) * 100).toFixed(2) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- inline styled :( -->
      <div class="card-area" v-if="isAbleToAddToItemSet">
        <div class="card-title">方案应用</div>
        <div class="card-content">
          <div
            style="display: flex; align-items: center; justify-content: space-between; height: 38px"
          >
            <span style="font-size: 13px">导入当前装备方案</span>
            <div style="width: 76px; display: flex; justify-content: center">
              <NButton
                size="small"
                type="primary"
                secondary
                @click="handleAddToItemSet"
                :disabled="lc.state !== 'connected'"
                >导入</NButton
              >
            </div>
          </div>
          <!-- <div
            style="display: flex; align-items: center; justify-content: space-between; height: 38px"
          >
            <span style="font-size: 13px">自动应用出场率最高的方案</span>
            <div style="width: 76px; display: flex; justify-content: center">
              <NCheckbox
                size="small"
                type="primary"
                secondary
                v-model:checked="autoApply"
              ></NCheckbox>
            </div>
          </div> -->
        </div>
      </div>
      <div
        class="card-area"
        v-if="data && data.data.starter_items && data.data.starter_items.length"
      >
        <div class="card-title">
          初始装备<NCheckbox
            v-if="data.data.starter_items.length > 4"
            size="small"
            v-model:checked="isStarterItemsExpanded"
            >展示全部</NCheckbox
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
                <span class="pick-rate" title="登场率">{{ (s.pick_rate * 100).toFixed(2) }}%</span>
                <span class="pick-play" title="总场次">{{ s.play.toLocaleString() }} 场</span>
              </div>
              <div class="win-rate" title="胜率">
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
            >展示全部</NCheckbox
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
                  <span class="pick-rate" title="登场率"
                    >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                  >
                  <span class="pick-play" title="总场次">{{ s.play.toLocaleString() }} 场</span>
                </div>
                <div class="win-rate" title="胜率">
                  {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-area" v-if="data && data.data.prism_items && data.data.prism_items.length">
        <div class="card-title">
          棱彩阶装备<NCheckbox
            v-if="data.data.prism_items.length > 4"
            size="small"
            v-model:checked="isPrismItemsExpanded"
            >展示全部</NCheckbox
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
                  <span class="pick-rate" title="登场率"
                    >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                  >
                  <span class="pick-play" title="总场次">{{ s.play.toLocaleString() }} 场</span>
                </div>
                <div class="win-rate" title="胜率">
                  {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-area" v-if="data && data.data.starter_items && data.data.core_items.length">
        <div class="card-title">
          核心装备<NCheckbox
            v-if="data.data.core_items.length > 4"
            size="small"
            v-model:checked="isCoreItemsExpanded"
            >展示全部</NCheckbox
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
                <span class="pick-rate" title="登场率">{{ (s.pick_rate * 100).toFixed(2) }}%</span>
                <span class="pick-play" title="总场次">{{ s.play.toLocaleString() }} 场</span>
              </div>
              <div class="win-rate" title="胜率">
                {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-area" v-if="data && data.data.starter_items && data.data.last_items.length">
        <div class="card-title">
          装备<NCheckbox
            v-if="data.data.last_items.length > 8"
            size="small"
            v-model:checked="isLastItemsExpanded"
            >展示全部</NCheckbox
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
                  <span class="pick-rate" title="登场率"
                    >{{ (s.pick_rate * 100).toFixed(2) }}%</span
                  >
                  <span class="pick-play" title="总场次">{{ s.play.toLocaleString() }} 场</span>
                </div>
                <div class="win-rate" title="胜率">
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
import { chatSend } from '@renderer-shared/http-api/chat'
import { getItemSets, putItemSets } from '@renderer-shared/http-api/item-sets'
import { appRendererModule as am } from '@renderer-shared/modules/app'
import { externalDataSourceRendererModule as edsm } from '@renderer-shared/modules/external-data-source'
import { championIconUrl } from '@renderer-shared/modules/game-data'
import { useLcuConnectionStore } from '@renderer-shared/modules/lcu-connection/store'
import { useChatStore } from '@renderer-shared/modules/lcu-state-sync/chat'
import { useGameDataStore } from '@renderer-shared/modules/lcu-state-sync/game-data'
import { useGameflowStore } from '@renderer-shared/modules/lcu-state-sync/gameflow'
import { useSummonerStore } from '@renderer-shared/modules/lcu-state-sync/summoner'
import { ArrowForwardIosOutlined as ArrowForwardIosOutlinedIcon } from '@vicons/material'
import { useLocalStorage } from '@vueuse/core'
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

import { MODE_TEXT, POSITION_TEXT } from './text'

const props = defineProps<{
  region?: string
  tier?: string
  mode?: string
  position?: string
  version?: string
  loading?: boolean
  champion?: any
  data?: any
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
}>()

const gameflow = useGameflowStore()
const lc = useLcuConnectionStore()
const chat = useChatStore()

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

  return `T${info.value.tier} 级`
})

const gameData = useGameDataStore()

if (import.meta.env.DEV) {
  watchEffect(() => {
    console.debug('OPGG Component: ', props.data, props.champion, info.value)
  })

  watchEffect(() => {
    console.debug('OPGG Component: Info', info.value)
  })
}

const message = useMessage()

const isAbleToAddToItemSet = computed(() => {
  if (!props.data) {
    return false
  }

  let result = false

  if (props.data.data.boots && props.data.data.boots.length) {
    result = true
  }

  if (props.data.data.starter_items && props.data.data.starter_items.length) {
    result = true
  }

  if (props.data.data.core_items && props.data.data.core_items.length) {
    result = true
  }

  if (props.data.data.last_items && props.data.data.last_items.length) {
    result = true
  }

  if (props.data.data.prism_items && props.data.data.prism_items.length) {
    result = true
  }

  return result
})

// 防止添加一大堆重复内容
// akari1 用于标记为本软件生成的装备集
const toItemSetsUid = (traits: {
  championId: number
  mode?: string
  region?: string
  tier?: string
  position?: string
  version?: string
}) => {
  return `akari1-${traits.championId}-${traits.mode || '_'}-${traits.region || '_'}-${traits.tier || '_'}-${traits.position || '_'}-${traits.version || '_'}`
}

// 11 - SR, 12 - HA, 30 - RoW, 21 - NB
const mapIds = {
  ranked: 11,
  aram: 12,
  arena: 30,
  nexus_blitz: 21,
  urf: 11
}

// 写文件的方案还是通过 LCU API 的 custom
const ADDING_STRATEGY: 'write-to-file' | 'lcu-api' = 'write-to-file'

const summoner = useSummonerStore()
const handleAddToItemSet = async () => {
  if (!props.data) {
    return
  }

  try {
    const itemGroups: Array<{ title: string; items: number[] }> = []
    const positionName =
      props.position && props.position !== 'none' ? POSITION_TEXT[props.position] || '' : ''

    const newUid = toItemSetsUid({
      championId: props.champion.id,
      mode: props.mode,
      region: props.region,
      tier: props.tier,
      position: props.position,
      version: props.version
    })

    if (props.data.data.starter_items && props.data.data.starter_items.length) {
      props.data.data.starter_items.slice(0, 3).forEach((s: any, i: number) => {
        itemGroups.push({
          title: `初始装备 #${i + 1} | 出场率 ${(s.pick_rate * 100).toFixed(2)}%`,
          items: s.ids
        })
      })
    }

    if (props.data.data.boots && props.data.data.boots.length) {
      itemGroups.push({
        title: `鞋子 (按出场率排序)`,
        items: props.data.data.boots.reduce((acc: number[], cur: any) => {
          acc.push(...cur.ids)
          return acc
        }, [])
      })
    }

    if (props.data.data.prism_items && props.data.data.prism_items.length) {
      itemGroups.push({
        title: `棱彩阶装备 (按出场率排序)`,
        items: props.data.data.prism_items.reduce((acc: number[], cur: any) => {
          acc.push(...cur.ids)
          return acc
        }, [])
      })
    }

    if (props.data.data.core_items && props.data.data.core_items.length) {
      props.data.data.core_items.slice(0, 4).forEach((s: any, i: number) => {
        itemGroups.push({
          title: `核心装备 #${i + 1} | 出场率 ${(s.pick_rate * 100).toFixed(2)}%`,
          items: s.ids
        })
      })
    }

    if (props.data.data.last_items && props.data.data.last_items.length) {
      itemGroups.push({
        title: `装备 (按出场率排序)`,
        items: props.data.data.last_items.reduce((acc: number[], cur: any) => {
          acc.push(...cur.ids)
          return acc
        }, [])
      })
    }

    if (ADDING_STRATEGY === 'write-to-file') {
      await edsm.opgg.writeItemSetsToDisk([
        {
          uid: newUid,
          title: `[OP.GG] ${gameData.champions[info.value?.id]?.name || '-'}${positionName ? ` - ${positionName}` : ''}${props.mode === 'arena' || props.mode === 'nexus_blitz' ? ` ${MODE_TEXT[props.mode]}` : ''}`,
          sortrank: 0,
          type: 'global',
          map: 'any',
          mode: 'any',
          blocks: itemGroups.map((g) => ({
            type: g.title,
            items: g.items.map((i) => ({
              id: i.toString(),
              count: 1
            }))
          })),
          associatedChampions: [],
          associatedMaps: [],
          preferredItemSlots: []
        }
      ])

      message.success('已写入到文件中')

      if (chat.conversations.championSelect) {
        chatSend(
          chat.conversations.championSelect.id,
          `[League Akari] 已写入到装备方案: [OP.GG] ${gameData.champions[info.value?.id]?.name || '-'}${positionName ? ` - ${positionName}` : ''}`,
          'celebration'
        ).catch(() => {})
      }
    } else {
      const { itemSets: previousItemSets } = (await getItemSets(summoner.me?.accountId)).data

      const index = previousItemSets.findIndex((i) => i.uid === newUid)
      if (index !== -1) {
        previousItemSets.splice(index, 1)
      }

      // 即使清空过多的由 akari 生成的装备集
      if (previousItemSets.length > 16) {
        const akariCount = previousItemSets.filter((i) => i.uid.startsWith('akari1')).length
        let needToDelete = Math.min(previousItemSets.length - 16, akariCount)

        for (let i = previousItemSets.length - 1; i >= 0; i--) {
          if (previousItemSets[i].uid.startsWith('akari1')) {
            previousItemSets.splice(i, 1)
            needToDelete--
          }

          if (needToDelete === 0) {
            break
          }
        }
      }

      await putItemSets(
        [
          {
            uid: newUid,
            title: `[OP.GG] ${gameData.champions[info.value?.id]?.name || '-'}${positionName ? ` - ${positionName}` : ''}${props.mode === 'arena' || props.mode === 'nexus_blitz' ? ` ${MODE_TEXT[props.mode]}` : ''}`,
            sortrank: 0,
            type: 'custom',
            map: 'any',
            mode: 'any',
            blocks: itemGroups.map((g) => ({
              type: g.title,
              items: g.items.map((i) => ({
                id: i.toString(),
                count: 1
              }))
            })),
            associatedChampions: [props.champion.id],
            associatedMaps:
              props.mode === 'arena' || props.mode === 'nexus_blitz'
                ? []
                : [props.mode ? mapIds[props.mode] : mapIds['ranked']],
            preferredItemSlots: []
          },
          ...previousItemSets
        ],
        summoner.me?.accountId
      )

      message.success('请求已发送')

      if (chat.conversations.championSelect) {
        chatSend(
          chat.conversations.championSelect.id,
          `[League Akari] 已添加装备方案: [OP.GG] ${gameData.champions[info.value?.id]?.name || '-'}${positionName ? ` - ${positionName}` : ''}`,
          'celebration'
        ).catch(() => {})
      }
    }
  } catch (error) {
    am.logger.warn(`[OP.GG] 添加到物品集失败: ${(error as any).message}`, error)
    message.warning(`添加到装备方案失败: ${(error as any).message}`)
  }
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

  .skill {
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 4px;
  }

  .separator {
    font-size: 10px;
    color: #909090;
  }
}

.skill-details {
  display: flex;
  gap: 2px;

  .skill {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    font-size: 10px;
    border-radius: 2px;
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
    width: 76px;

    .pick-rate {
      font-size: 12px;
      color: #ebebeb;
      font-weight: bold;
    }

    .pick-play {
      font-size: 12px;
      color: #bebebe;
    }
  }

  .win-rate {
    width: 76px;
    font-size: 12px;
    color: #a0c6f8;
    font-weight: bold;
    text-align: center;
  }

  .buttons {
    display: flex;
    width: 76px;
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
    }
  }
}

.skills-group {
  display: flex;
  align-items: center;
  height: 56px;

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
      width: 76px;

      .pick-rate {
        font-size: 12px;
        color: #ebebeb;
        font-weight: bold;
      }

      .pick-play {
        font-size: 12px;
        color: #bebebe;
      }
    }

    .win-rate {
      width: 76px;
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
      width: 76px;

      .pick-rate {
        font-size: 12px;
        color: #ebebeb;
        font-weight: bold;
      }

      .pick-play {
        font-size: 12px;
        color: #bebebe;
      }
    }

    .win-rate {
      width: 76px;
      font-size: 12px;
      color: #a0c6f8;
      font-weight: bold;
      text-align: center;
    }

    .buttons {
      display: flex;
      width: 76px;
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
      width: 76px;

      .pick-rate {
        font-size: 12px;
        color: #ebebeb;
        font-weight: bold;
      }

      .pick-play {
        font-size: 12px;
        color: #bebebe;
      }
    }

    .win-rate {
      width: 76px;
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
      width: 76px;

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
      width: 76px;

      .pick-rate {
        font-size: 12px;
        color: #ebebeb;
        font-weight: bold;
      }

      .pick-play {
        font-size: 12px;
        color: #bebebe;
      }
    }

    .win-rate {
      width: 76px;
      font-size: 12px;
      color: #a0c6f8;
      font-weight: bold;
      text-align: center;
    }
  }
}
</style>
