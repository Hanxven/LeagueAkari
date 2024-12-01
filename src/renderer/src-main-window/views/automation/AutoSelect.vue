<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div class="inner-wrapper">
        <NCard size="small">
          <template #header
            ><span class="card-header-title">{{ t('AutoSelect.normalModeTitle') }}</span></template
          >
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
            :label="t('AutoSelect.completePick.label')"
            :label-description="t('AutoSelect.completePick.description')"
            :label-width="260"
          >
            <NRadioGroup
              :value="store.settings.completePick"
              @update:value="(v) => as.setCompletePick(v)"
            >
              <NRadio :value="true">{{ t('AutoSelect.completePick.options.true') }}</NRadio>
              <NRadio :value="false">{{ t('AutoSelect.completePick.options.false') }}</NRadio>
            </NRadioGroup>
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="`在最后一刻锁定`"
            :label-description="`在最后一刻锁定`"
            :label-width="260"
          >
            <NSwitch
              @update:value="(v) => as.setLastSecondCompletePickEnabled(v)"
              :value="store.settings.lastSecondCompletePickEnabled"
              size="small"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="`锁定距离结束延迟`"
            :label-width="260"
            :label-description="`在选择英雄后，等待多少秒后再结束选择`"
          >
            <NInputNumber
              style="width: 100px"
              placeholder="秒"
              :min="0"
              size="small"
              :value="store.settings.completePickPreEndThreshold"
              @update:value="(v) => as.setCompletePickPreEndThreshold(v || 0)"
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
          <template #header
            ><span class="card-header-title">{{ t('AutoSelect.benchModeTitle') }}</span></template
          >
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
                <template #trigger
                  ><span style="text-decoration: underline; font-weight: bold">(?)</span></template
                >
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
          <template #header
            ><span class="card-header-title">{{ t('AutoSelect.banTitle') }}</span></template
          >
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

import OrderedChampionList from '@main-window/components/OrderedChampionList.vue'

const { t } = useTranslation()

const store = useAutoSelectStore()
const as = useInstance<AutoSelectRenderer>('auto-select-renderer')

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
.divider {
  margin-top: 12px;
  margin-bottom: 12px;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.084);
}

.control-item-margin {
  &:not(:last-child) {
    margin-bottom: 12px;
  }
}

.card-header-title {
  font-weight: bold;
  font-size: 18px;
}

.outer-wrapper {
  position: relative;
  height: 100%;
  max-width: 100%;
}

.inner-wrapper {
  padding: 16px;
  margin: 0 auto;
  max-width: 800px;

  :deep(.n-card) {
    background-color: transparent;
  }
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

.single-root {
  height: 100%;
}
</style>
