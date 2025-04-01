<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div class="inner-wrapper">
        <NCard size="small">
          <template #header>
            <span class="card-header-title">{{ t('AutoSelect.normalModeTitle') }}</span>
          </template>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.normalModeEnabled.label')"
            :label-description="t('AutoSelect.normalModeEnabled.description')"
            :label-width="260"
          >
            <NSwitch
              @update:value="(v) => as.setNormalModeEnabled(v)"
              :value="store.settings.normalModeEnabled"
              size="small"
            ></NSwitch>
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.showIntent.label')"
            :label-description="t('AutoSelect.showIntent.description')"
            :label-width="260"
          >
            <NSwitch
              type="pick"
              size="small"
              :value="store.settings.showIntent"
              @update:value="(val) => as.setShowIntent(val)"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.selectTeammateIntendedChampion.label')"
            :label-description="t('AutoSelect.selectTeammateIntendedChampion.description')"
            :label-width="260"
          >
            <NSwitch
              @update:value="(v) => as.setSelectTeammateIntendedChampion(v)"
              :value="store.settings.selectTeammateIntendedChampion"
              size="small"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.pickStrategy.label')"
            :label-description="t('AutoSelect.pickStrategy.description')"
            :label-width="260"
          >
            <NRadioGroup
              :value="store.settings.pickStrategy"
              @update:value="(v) => as.setPickStrategy(v)"
            >
              <NRadio value="show">{{ t('AutoSelect.pickStrategy.options.show') }}</NRadio>
              <NRadio value="lock-in">{{ t('AutoSelect.pickStrategy.options.lock-in') }}</NRadio>
              <NRadio value="show-and-delay-lock-in">{{
                t('AutoSelect.pickStrategy.options.show-and-delay-lock-in')
              }}</NRadio>
            </NRadioGroup>
          </ControlItem>
          <ControlItem
            v-if="store.settings.pickStrategy === 'show-and-delay-lock-in'"
            class="control-item-margin"
            :label="t('AutoSelect.lockInDelaySeconds.label')"
            :label-width="260"
            :label-description="t('AutoSelect.lockInDelaySeconds.description')"
          >
            <NInputNumber
              style="width: 100px"
              :min="0"
              size="small"
              :value="store.settings.lockInDelaySeconds"
              @update:value="(v) => as.setLockInDelaySeconds(v || 0)"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.expectedChampions.label')"
            :label-width="260"
          >
            <template #labelDescription>
              <div v-html="t('AutoSelect.expectedChampions.description')"></div>
            </template>
            <table class="expected-champion-groups">
              <tbody>
                <tr v-for="role in roles" :key="role.key">
                  <td class="td-label">
                    <span
                      class="label"
                      :class="{ current: store.memberMe?.assignedPosition === role.key }"
                      >{{ role.label }}</span
                    >
                  </td>
                  <td>
                    <OrderedChampionList
                      type="pick"
                      :champions="store.settings.expectedChampions[role.key]"
                      @update:champions="
                        (list) =>
                          as.setExpectedChampions({
                            ...store.settings.expectedChampions,
                            [role.key]: list
                          })
                      "
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </ControlItem>
        </NCard>
        <NCard size="small" style="margin-top: 8px">
          <template #header>
            <span class="card-header-title">{{ t('AutoSelect.benchModeTitle') }}</span>
          </template>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.benchModeEnabled.label')"
            :label-description="t('AutoSelect.benchModeEnabled.description')"
            :label-width="260"
          >
            <NSwitch
              @update:value="(v) => as.setBenchModeEnabled(v)"
              :value="store.settings.benchModeEnabled"
              size="small"
            ></NSwitch>
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.grabDelaySeconds.label')"
            :label-width="260"
          >
            <template #labelDescription>
              {{ t('AutoSelect.grabDelaySeconds.description.part1') }}
              <NTooltip>
                <template #trigger>
                  <span style="text-decoration: underline; font-weight: bold">(?)</span>
                </template>
                <div style="font-size: 12px; max-width: 300px">
                  {{ t('AutoSelect.grabDelaySeconds.description.part2') }}
                </div>
              </NTooltip>
            </template>
            <NInputNumber
              style="width: 100px"
              :min="0"
              size="small"
              :value="store.settings.grabDelaySeconds"
              @update:value="(v) => as.setGrabDelaySeconds(v || 0)"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.benchSelectFirstAvailableChampion.label')"
            :label-description="t('AutoSelect.benchSelectFirstAvailableChampion.description')"
            :label-width="260"
          >
            <NSwitch
              @update:value="(v) => as.setBenchSelectFirstAvailableChampion(v)"
              :value="store.settings.benchSelectFirstAvailableChampion"
              size="small"
            ></NSwitch>
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.benchHandleTradeEnabled.label')"
            :label-width="260"
          >
            <template #labelDescription>
              <div v-html="t('AutoSelect.benchHandleTradeEnabled.description')"></div>
            </template>
            <NSwitch
              @update:value="(v) => as.setBenchHandleTradeEnabled(v)"
              :value="store.settings.benchHandleTradeEnabled"
              size="small"
            ></NSwitch>
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.benchHandleTradeIgnoreChampionOwner.label')"
            :label-width="260"
          >
            <template #labelDescription>
              <div v-html="t('AutoSelect.benchHandleTradeIgnoreChampionOwner.description')"></div>
            </template>
            <NSwitch
              @update:value="(v) => as.setBenchHandleTradeIgnoreChampionOwner(v)"
              :value="store.settings.benchHandleTradeIgnoreChampionOwner"
              size="small"
            ></NSwitch>
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.benchExpectedChampions.label')"
            :label-width="260"
          >
            <OrderedChampionList
              type="pick"
              :champions="store.settings.benchExpectedChampions"
              @update:champions="(list) => as.setBenchExpectedChampions(list)"
            />
          </ControlItem>
        </NCard>
        <NCard size="small" style="margin-top: 8px">
          <template #header>
            <span class="card-header-title">{{ t('AutoSelect.banTitle') }}</span>
          </template>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.banEnabled.label')"
            :label-description="t('AutoSelect.banEnabled.description')"
            :label-width="260"
          >
            <NSwitch
              @update:value="(v) => as.setBanEnabled(v)"
              :value="store.settings.banEnabled"
              size="small"
            ></NSwitch>
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.banDelaySeconds.label')"
            :label-width="260"
            :label-description="t('AutoSelect.banDelaySeconds.description')"
          >
            <NInputNumber
              style="width: 100px"
              :min="0"
              size="small"
              :value="store.settings.banDelaySeconds"
              @update:value="(v) => as.setBanDelaySeconds(v || 0)"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.banTeammateIntendedChampion.label')"
            :label-description="t('AutoSelect.banTeammateIntendedChampion.description')"
            :label-width="260"
          >
            <NSwitch
              @update:value="(v) => as.setBanTeammateIntendedChampion(v)"
              :value="store.settings.banTeammateIntendedChampion"
              size="small"
            ></NSwitch>
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('AutoSelect.bannedChampions.label')"
            :label-width="260"
          >
            <template #labelDescription>
              <div v-html="t('AutoSelect.bannedChampions.description')"></div>
            </template>
            <table class="expected-champion-groups">
              <tbody>
                <tr v-for="role in roles" :key="role.key">
                  <td class="td-label">
                    <span
                      class="label"
                      :class="{ current: store.memberMe?.assignedPosition === role.key }"
                      >{{ role.label }}</span
                    >
                  </td>
                  <td>
                    <OrderedChampionList
                      type="ban"
                      allow-empty
                      :champions="store.settings.bannedChampions[role.key]"
                      @update:champions="
                        (list) =>
                          as.setBannedChampions({
                            ...store.settings.bannedChampions,
                            [role.key]: list
                          })
                      "
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </ControlItem>
        </NCard>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { AutoSelectRenderer } from '@renderer-shared/shards/auto-select'
import { useAutoSelectStore } from '@renderer-shared/shards/auto-select/store'
import { useTranslation } from 'i18next-vue'
import { NCard, NInputNumber, NRadio, NRadioGroup, NScrollbar, NSwitch, NTooltip } from 'naive-ui'
import { computed } from 'vue'

import OrderedChampionList from '@main-window/components/ordered-champion-list/OrderedChampionList.vue'

const { t } = useTranslation()

const store = useAutoSelectStore()
const as = useInstance(AutoSelectRenderer)

const roles = computed(() => {
  return [
    { key: 'top', label: t('common.lanes.top') },
    { key: 'middle', label: t('common.lanes.middle') },
    { key: 'jungle', label: t('common.lanes.jungle') },
    { key: 'bottom', label: t('common.lanes.bottom') },
    { key: 'utility', label: t('common.lanes.utility') },
    { key: 'default', label: t('common.default') }
  ]
})
</script>

<style lang="less" scoped>
@import './automation-styles.less';

.divider {
  margin-top: 12px;
  margin-bottom: 12px;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.084);
}

.expected-champion-groups {
  border-collapse: separate;
  border-spacing: 8px 8px;

  .group {
    display: flex;
    align-items: center;
    height: 24px;
  }

  .group:not(:last-child) {
    margin-bottom: 12px;
  }

  .label {
    font-size: 12px;
    font-weight: bold;
  }

  .label.current {
    color: #88f6d1;
  }
}
</style>
