<template>
  <NScrollbar class="outer-wrapper" ref="el">
    <div class="inner-wrapper">
      <NCard size="small">
        <template #header><span class="card-header-title">自动英雄选择 · 普通模式</span></template>
        <ControlItem
          class="control-item-margin"
          label="开启"
          label-description="在常规的模式中启用。如匹配模式，排位模式等任何非随机英雄的模式"
        >
          <NSwitch
            @update:value="(v) => asm.setNormalModeEnabled(v)"
            :value="as.settings.normalModeEnabled"
            size="small"
          ></NSwitch>
        </ControlItem>
        <ControlItem
          class="control-item-margin"
          label="仅限同步自选模式"
          label-description="仅当模式是同步自选模式时生效。这些模式通常需要所有玩家同时选择英雄，如匹配模式"
        >
          <NSwitch
            @update:value="(v) => asm.setOnlySimulMode(v)"
            :value="as.settings.onlySimulMode"
            size="small"
          ></NSwitch>
        </ControlItem>
        <ControlItem
          class="control-item-margin"
          label="无视队友预选"
          label-description="开启后将不会考虑队友的预选英雄，反之会避免与队友的选择冲突"
        >
          <NSwitch
            @update:value="(v) => asm.setSelectTeammateIntendedChampion(v)"
            :value="as.settings.selectTeammateIntendedChampion"
            size="small"
          />
        </ControlItem>
        <ControlItem
          class="control-item-margin"
          label="提前预选"
          label-description="预选即将自动选用的英雄"
        >
          <NSwitch
            type="pick"
            size="small"
            :value="as.settings.showIntent"
            @update:value="(val) => asm.setShowIntent(val)"
          />
        </ControlItem>
        <ControlItem
          class="control-item-margin"
          label="选择策略"
          label-description="立即锁定或只是亮出"
        >
          <NSwitch
            @update:value="(v) => asm.setCompleted(v)"
            :value="as.settings.completed"
            size="small"
            :rail-style="completeStrategy"
          >
            <template #checked>锁定</template>
            <template #unchecked>亮出</template></NSwitch
          >
        </ControlItem>
        <ControlItem class="control-item-margin" label="意向英雄" v-if="false">
          <OrderedChampionList
            type="pick"
            :champions="as.settings.expectedChampions"
            @update:champions="(list) => asm.setExpectedChampions(list)"
          />
        </ControlItem>
        <ControlItem class="control-item-margin" label="意向英雄">
          <template #labelDescription>
            <div style="margin-bottom: 8px">将根据预设列表选择英雄</div>
            <div style="margin-bottom: 8px">
              若当前模式<span style="font-weight: bold">不存在分路信息</span>或<span
                style="font-weight: bold"
                >当前分路未设置英雄</span
              >，则按照<span style="font-weight: bold">默认</span>列表进行选择
            </div>
            <div>选择优先级为列表定义顺序，优先选择位置靠前的英雄</div>
          </template>
          <div class="expected-champion-groups">
            <div class="group">
              <div class="label" :class="{ current: as.memberMe?.assignedPosition === 'top' }">
                上路
              </div>
              <OrderedChampionList
                type="pick"
                :champions="as.settings.expectedChampions2.top"
                @update:champions="
                  (list) =>
                    asm.setExpectedChampions2({ ...as.settings.expectedChampions2, top: list })
                "
              />
            </div>
            <div class="group">
              <div class="label" :class="{ current: as.memberMe?.assignedPosition === 'middle' }">
                中路
              </div>
              <OrderedChampionList
                type="pick"
                :champions="as.settings.expectedChampions2.middle"
                @update:champions="
                  (list) =>
                    asm.setExpectedChampions2({ ...as.settings.expectedChampions2, middle: list })
                "
              />
            </div>
            <div class="group">
              <div class="label" :class="{ current: as.memberMe?.assignedPosition === 'jungle' }">打野</div>
              <OrderedChampionList
                type="pick"
                :champions="as.settings.expectedChampions2.jungle"
                @update:champions="
                  (list) =>
                    asm.setExpectedChampions2({ ...as.settings.expectedChampions2, jungle: list })
                "
              />
            </div>
            <div class="group">
              <div class="label" :class="{ current: as.memberMe?.assignedPosition === 'bottom' }">
                下路
              </div>
              <OrderedChampionList
                type="pick"
                :champions="as.settings.expectedChampions2.bottom"
                @update:champions="
                  (list) =>
                    asm.setExpectedChampions2({ ...as.settings.expectedChampions2, bottom: list })
                "
              />
            </div>
            <div class="group">
              <div class="label" :class="{ current: as.memberMe?.assignedPosition === 'utility' }">
                辅助
              </div>
              <OrderedChampionList
                type="pick"
                :champions="as.settings.expectedChampions2.utility"
                @update:champions="
                  (list) =>
                    asm.setExpectedChampions2({ ...as.settings.expectedChampions2, utility: list })
                "
              />
            </div>
            <div class="group">
              <div class="label" :class="{ current: as.memberMe?.assignedPosition === '' }">
                默认
              </div>
              <OrderedChampionList
                type="pick"
                :champions="as.settings.expectedChampions2.default"
                @update:champions="
                  (list) =>
                    asm.setExpectedChampions2({ ...as.settings.expectedChampions2, default: list })
                "
              />
            </div>
          </div>
        </ControlItem>
      </NCard>
      <NCard size="small" style="margin-top: 8px">
        <template #header><span class="card-header-title">自动英雄选择 · 随机模式</span></template>
        <ControlItem
          class="control-item-margin"
          label="开启"
          label-description="随机分配英雄的模式，如极地大乱斗"
        >
          <NSwitch
            @update:value="(v) => asm.setBenchModeEnabled(v)"
            :value="as.settings.benchModeEnabled"
            size="small"
          ></NSwitch>
        </ControlItem>
        <ControlItem class="control-item-margin" label="选用最低累积时间 (s)">
          <template #labelDescription>
            目标英雄出现在英雄选择台上的累计时间需达到此值才会执行交换操作，单位为秒
            <NTooltip>
              <template #trigger
                ><span style="text-decoration: underline; font-weight: bold">(?)</span></template
              >
              <div style="font-size: 12px; max-width: 300px">
                当英雄出现在英雄选择台上时，会针对该英雄进行计时。仅当其在英雄选择台上的累计时间满足设定值时，自动交换才会执行，避免过早选择英雄，即
                “秒抢”
              </div>
            </NTooltip>
          </template>
          <NInputNumber
            style="width: 100px"
            placeholder="秒"
            :min="0"
            size="tiny"
            :value="as.settings.grabDelaySeconds"
            @update:value="(v) => asm.setGrabDelaySeconds(v || 0)"
          />
        </ControlItem>
        <ControlItem class="control-item-margin" label="期望英雄">
          <OrderedChampionList
            type="pick"
            :champions="as.settings.benchExpectedChampions"
            @update:champions="(list) => asm.setBenchExpectedChampions(list)"
          />
        </ControlItem>
      </NCard>
      <NCard size="small" style="margin-top: 8px">
        <template #header><span class="card-header-title">自动英雄禁用</span></template>
        <ControlItem
          class="control-item-margin"
          label="开启"
          label-description="自动执行英雄的禁用操作"
        >
          <NSwitch
            @update:value="(v) => asm.setBanEnabled(v)"
            :value="as.settings.banEnabled"
            size="small"
          ></NSwitch>
        </ControlItem>
        <ControlItem
          class="control-item-margin"
          label="无视队友预选"
          label-description="开启后将不会考虑队友的预选英雄"
        >
          <NSwitch
            @update:value="(v) => asm.setBanTeammateIntendedChampion(v)"
            :value="as.settings.banTeammateIntendedChampion"
            size="small"
          ></NSwitch>
        </ControlItem>
        <ControlItem class="control-item-margin" label="意向英雄" v-if="false">
          <OrderedChampionList
            :champions="as.settings.bannedChampions"
            allow-empty
            type="ban"
            @update:champions="(list) => asm.setBannedChampions(list)"
          />
        </ControlItem>
        <ControlItem class="control-item-margin" label="意向英雄">
          <template #labelDescription>
            <div style="margin-bottom: 8px">将根据预设列表禁用英雄</div>
            <div style="margin-bottom: 8px">
              若当前模式<span style="font-weight: bold">不存在分路信息</span>或<span
                style="font-weight: bold"
                >当前分路未设置英雄</span
              >，则按照<span style="font-weight: bold">默认</span>列表进行选择
            </div>
            <div>禁用优先级为列表定义顺序，优先禁用位置靠前的英雄</div>
          </template>
          <div class="expected-champion-groups">
            <div class="group">
              <div class="label" :class="{ current: as.memberMe?.assignedPosition === 'top' }">
                上路
              </div>
              <OrderedChampionList
                type="ban"
                allow-empty
                :champions="as.settings.bannedChampions2.top"
                @update:champions="
                  (list) => asm.setBannedChampions2({ ...as.settings.bannedChampions2, top: list })
                "
              />
            </div>
            <div class="group">
              <div class="label" :class="{ current: as.memberMe?.assignedPosition === 'middle' }">
                中路
              </div>
              <OrderedChampionList
                type="ban"
                allow-empty
                :champions="as.settings.bannedChampions2.middle"
                @update:champions="
                  (list) =>
                    asm.setBannedChampions2({ ...as.settings.bannedChampions2, middle: list })
                "
              />
            </div>
            <div class="group">
              <div class="label" :class="{ current: as.memberMe?.assignedPosition === 'jungle' }">
                打野
              </div>
              <OrderedChampionList
                type="ban"
                allow-empty
                :champions="as.settings.bannedChampions2.jungle"
                @update:champions="
                  (list) =>
                    asm.setBannedChampions2({ ...as.settings.bannedChampions2, jungle: list })
                "
              />
            </div>
            <div class="group">
              <div class="label" :class="{ current: as.memberMe?.assignedPosition === 'bottom' }">
                下路
              </div>
              <OrderedChampionList
                type="ban"
                allow-empty
                :champions="as.settings.bannedChampions2.bottom"
                @update:champions="
                  (list) =>
                    asm.setBannedChampions2({ ...as.settings.bannedChampions2, bottom: list })
                "
              />
            </div>
            <div class="group">
              <div class="label" :class="{ current: as.memberMe?.assignedPosition === 'utility' }">
                辅助
              </div>
              <OrderedChampionList
                type="ban"
                allow-empty
                :champions="as.settings.bannedChampions2.utility"
                @update:champions="
                  (list) =>
                    asm.setBannedChampions2({ ...as.settings.bannedChampions2, utility: list })
                "
              />
            </div>
            <div class="group">
              <div class="label" :class="{ current: as.memberMe?.assignedPosition === '' }">
                默认
              </div>
              <OrderedChampionList
                type="ban"
                allow-empty
                :champions="as.settings.bannedChampions2.default"
                @update:champions="
                  (list) =>
                    asm.setBannedChampions2({ ...as.settings.bannedChampions2, default: list })
                "
              />
            </div>
          </div>
        </ControlItem>
      </NCard>
    </div>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import { autoSelectRendererModule as asm } from '@shared/renderer/modules/auto-select'
import { useAutoSelectStore } from '@shared/renderer/modules/auto-select/store'
import { NCard, NInputNumber, NScrollbar, NSwitch, NTooltip } from 'naive-ui'

import OrderedChampionList from '@main-window/components/OrderedChampionListNew.vue'

const as = useAutoSelectStore()

const completeStrategy = ({ checked }: { checked: boolean }) => {
  if (checked) {
    return { 'background-color': 'rgb(42,100,125)', 'font-size': '12px' }
  } else {
    return { 'background-color': 'rgb(42,148,125)', 'font-size': '12px' }
  }
}
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
  padding: 24px;
  margin: 0 auto;
  max-width: 800px;

  :deep(.n-card) {
    background-color: transparent;
  }
}

.expected-champion-groups {
  .group {
    display: flex;
    align-items: center;
    height: 24px;
  }

  .group:not(:last-child) {
    margin-bottom: 12px;
  }

  .label {
    margin-right: 12px;
    font-size: 12px;
    font-weight: bold;
  }

  .label.current {
    color: #88f6d1;
  }
}
</style>
