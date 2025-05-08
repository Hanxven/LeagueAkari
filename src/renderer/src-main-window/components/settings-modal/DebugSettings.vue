<template>
  <NScrollbar style="height: 65vh">
    <NModal preset="card" size="small" v-model:show="editRuleModalShow" style="max-width: 500px">
      <template #header>{{ t('DebugSettings.lcuEvent.modal.title') }}</template>
      <template #footer>
        <div class="right-side">
          <NButton
            size="small"
            type="primary"
            secondary
            :disabled="!editRuleValid"
            @click="handleAddRule"
            style="margin-left: auto"
          >
            {{ t('DebugSettings.lcuEvent.modal.button') }}
          </NButton>
        </div>
      </template>
      <NAutoComplete
        ref="edit-rule-input"
        :placeholder="t('DebugSettings.lcuEvent.modal.placeholder')"
        v-model:value="editRuleText"
        :options="options"
        size="small"
        :status="editRuleValid ? 'success' : 'error'"
      />
    </NModal>
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">{{ t('DebugSettings.files.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('DebugSettings.files.logs.label')"
        :label-description="t('DebugSettings.files.logs.description')"
        :label-width="400"
      >
        <NButton size="small" secondary type="primary" @click="() => handleShowLogsDir()"
          >{{ t('DebugSettings.files.logs.button') }}
        </NButton>
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('DebugSettings.files.appData.label')"
        :label-width="400"
      >
        <template #labelDescription>
          {{ t('DebugSettings.files.appData.description.part1') }}
          <NPopover :delay="50">
            <template #trigger>
              <span style="font-weight: bold; color: #fff">
                {{ t('DebugSettings.files.appData.popoverTrigger') }}
              </span>
            </template>
            <table>
              <colgroup>
                <col style="width: 100px" />
              </colgroup>
              <tbody style="font-size: 12px">
                <tr>
                  <td>LeagueAkari.db</td>
                  <td>{{ t('DebugSettings.files.appData.description.part2') }}</td>
                </tr>
                <tr>
                  <td>NewUpdates/</td>
                  <td>{{ t('DebugSettings.files.appData.description.part3') }}</td>
                </tr>
                <tr>
                  <td>AkariConfig/</td>
                  <td>{{ t('DebugSettings.files.appData.description.part4') }}</td>
                </tr>
                <tr>
                  <td>base-config.json</td>
                  <td>{{ t('DebugSettings.files.appData.description.part5') }}</td>
                </tr>
              </tbody>
            </table>
          </NPopover>
        </template>
        <NButton size="small" secondary type="primary" @click="() => handleShowUserDataDir()">{{
          t('DebugSettings.files.appData.button')
        }}</NButton>
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">{{ t('DebugSettings.lcuEvent.label') }}</span>
      </template>
      <div class="operations">
        <NCheckbox
          size="small"
          class="check-box"
          :checked="rds.logAllLcuEvents"
          @update:checked="(val) => rd.setLogAllLcuEvents(val)"
          >{{ t('DebugSettings.lcuEvent.logAll') }}</NCheckbox
        >
        <NButton size="tiny" @click="handleShowAddModal" secondary type="primary">{{
          t('DebugSettings.lcuEvent.addRule')
        }}</NButton>
      </div>
      <NCollapseTransition>
        <NDataTable
          :class="$style.table"
          :columns="columns"
          :data="printRulesArr"
          size="small"
          bordered
        >
          <template #empty>{{ t('DebugSettings.lcuEvent.empty') }}</template>
        </NDataTable>
      </NCollapseTransition>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">{{
          lc.connectionState === 'connected'
            ? t('DebugSettings.lcuConnection.titleConnected')
            : t('DebugSettings.lcuConnection.titleDisconnected')
        }}</span>
      </template>
      <NTable size="small" bordered>
        <colgroup>
          <col style="width: 120px" />
          <col />
        </colgroup>
        <tbody>
          <tr>
            <td>{{ t('DebugSettings.lcuConnection.port') }}</td>
            <td><CopyableText :text="lc.auth?.port ?? '-'" /></td>
          </tr>
          <tr>
            <td>{{ t('DebugSettings.lcuConnection.pid') }}</td>
            <td><CopyableText :text="lc.auth?.pid ?? '-'" /></td>
          </tr>
          <tr>
            <td>{{ t('DebugSettings.lcuConnection.auth') }}</td>
            <td><CopyableText :text="lc.auth?.authToken ?? '-'" /></td>
          </tr>
          <tr>
            <td>{{ t('DebugSettings.lcuConnection.rsoPlatform') }}</td>
            <td>
              <CopyableText :text="lc.auth?.rsoPlatformId ?? '-'">{{
                (lc.auth?.rsoPlatformId
                  ? TENCENT_RSO_PLATFORM_NAME[lc.auth.rsoPlatformId] || lc.auth.rsoPlatformId
                  : lc.auth?.rsoPlatformId) || '-'
              }}</CopyableText>
            </td>
          </tr>
          <tr>
            <td>{{ t('DebugSettings.lcuConnection.region') }}</td>
            <td>
              <CopyableText :text="lc.auth?.region ?? '-'">{{
                lc.auth?.region
                  ? REGION_NAME[lc.auth.region] || lc.auth.region
                  : lc.auth?.region || '-'
              }}</CopyableText>
            </td>
          </tr>
        </tbody>
      </NTable>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">{{ t('DebugSettings.gameflow.title') }}</span>
      </template>
      <span class="text" v-if="lc.connectionState === 'connected'"
        >{{ gameflowText[lc.gameflow.phase || 'None'] }} ({{ lc.gameflow.phase }})</span
      >
      <span class="text" v-else>{{ t('DebugSettings.gameflow.unavailable') }}</span>
    </NCard>
    <NCard v-if="as.isAdministrator" size="small" style="margin-top: 8px">
      <template #header>
        <LeagueAkariSpan class="card-header-title" text="League Akari X" />
      </template>
      <span class="text">{{ t('DebugSettings.inAdministrator.description') }}</span>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">Runtime Info</span>
      </template>
      <NDescriptions
        v-if="runtimeInfo"
        bordered
        size="small"
        :columns="6"
        label-placement="top"
        style="user-select: text"
      >
        <NDescriptionsItem label="League Akari Version">{{
          runtimeInfo.version
        }}</NDescriptionsItem>
        <NDescriptionsItem label="PID">{{ runtimeInfo.pid }}</NDescriptionsItem>
        <NDescriptionsItem label="Platform">{{ runtimeInfo.platform }}</NDescriptionsItem>
        <NDescriptionsItem label="Arch">{{ runtimeInfo.arch }}</NDescriptionsItem>
        <NDescriptionsItem label="Uptime">{{ runtimeInfo.uptime.toFixed(2) }} s</NDescriptionsItem>
        <NDescriptionsItem label="CPUs">
          {{ runtimeInfo.os.cpus.length }}
        </NDescriptionsItem>
        <NDescriptionsItem label="OS Type">
          {{ runtimeInfo.os.type }}
        </NDescriptionsItem>
        <NDescriptionsItem label="OS Release">
          {{ runtimeInfo.os.release }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Memory">
          {{ runtimeInfo.os.totalmem }} ({{ (runtimeInfo.os.totalmem / 1073741824).toFixed(2) }}
          GB)
        </NDescriptionsItem>
        <NDescriptionsItem label="NODE_ENV" :span="3">
          {{ runtimeInfo.env.NODE_ENV }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Argv" :span="6">
          <span style="font-family: monospace">{{
            runtimeInfo.argv.map((a: string) => (a.includes(' ') ? `"${a}"` : a)).join(' ')
          }}</span>
        </NDescriptionsItem>
        <NDescriptionsItem label="Electron">
          {{ runtimeInfo.versions.electron }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Node">
          {{ runtimeInfo.versions.node }}
        </NDescriptionsItem>
        <NDescriptionsItem label="Chrome">
          {{ runtimeInfo.versions.chrome }}
        </NDescriptionsItem>
        <NDescriptionsItem label="V8">
          {{ runtimeInfo.versions.v8 }}
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header><span class="card-header-title">Akari Zone</span></template>
      <ControlItem
        class="control-item-margin"
        :label="t('DebugSettings.kyokoMode.label')"
        :label-description="t('DebugSettings.kyokoMode.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="as.settings.isInKyokoMode"
          @update:value="(val: boolean) => app.setInKyokoMode(val)"
        />
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import CopyableText from '@renderer-shared/components/CopyableText.vue'
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { RendererDebugRenderer } from '@renderer-shared/shards/renderer-debug'
import { useRendererDebugStore } from '@renderer-shared/shards/renderer-debug/store'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { REGION_NAME, TENCENT_RSO_PLATFORM_NAME } from '@shared/utils/platform-names'
import { RadixMatcher } from '@shared/utils/radix-matcher'
import { useIntervalFn } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import {
  DataTableColumn,
  NAutoComplete,
  NButton,
  NCard,
  NCheckbox,
  NCollapseTransition,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NFlex,
  NModal,
  NPopover,
  NScrollbar,
  NSwitch,
  NTable
} from 'naive-ui'
import { computed, h, nextTick, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue'

import { LCU_ENDPOINTS } from './lcu-endpoints'

const { t } = useTranslation()

const lc = useLeagueClientStore()
const rds = useRendererDebugStore()
const as = useAppCommonStore()

const wm = useInstance(WindowManagerRenderer)
const log = useInstance(LoggerRenderer)
const app = useInstance(AppCommonRenderer)
const rd = useInstance(RendererDebugRenderer)

const gameflowText = computed(() => {
  return {
    Matchmaking: t('DebugSettings.gameflow.Matchmaking'),
    ChampSelect: t('DebugSettings.gameflow.ChampSelect'),
    ReadyCheck: t('DebugSettings.gameflow.ReadyCheck'),
    InProgress: t('DebugSettings.gameflow.InProgress'),
    EndOfGame: t('DebugSettings.gameflow.EndOfGame'),
    Lobby: t('DebugSettings.gameflow.Lobby'),
    GameStart: t('DebugSettings.gameflow.GameStart'),
    None: t('DebugSettings.gameflow.None'),
    Reconnect: t('DebugSettings.gameflow.Reconnect'),
    WaitingForStats: t('DebugSettings.gameflow.WaitingForStats'),
    PreEndOfGame: t('DebugSettings.gameflow.PreEndOfGame'),
    WatchInProgress: t('DebugSettings.gameflow.WatchInProgress')
  }
})

const columns: DataTableColumn<any>[] = [
  {
    title: t('DebugSettings.lcuEvent.enable'),
    key: 'enable',
    width: 84,
    fixed: 'left',
    render: (row) => {
      return h(NCheckbox, {
        'onUpdate:checked': (val: boolean) => {
          if (val) {
            rd.enableRule(row.data.rule)
          } else {
            rd.disableRule(row.data.rule)
          }
        },
        checked: row.data.enabled,
        size: 'small'
      })
    }
  },
  {
    title: t('DebugSettings.lcuEvent.rule'),
    key: 'rule',
    render: (row) => {
      return h(
        'code',
        {
          style: { userSelect: 'text' }
        },
        row.data.rule
      )
    }
  },
  {
    key: 'operations',
    fixed: 'right',
    width: 50,
    render: (row) => {
      return h(NFlex, { size: 4 }, () => [
        h(
          NButton,
          {
            size: 'tiny',
            type: 'error',
            secondary: true,
            onClick: () => handleRemoveEditRule(row.data.rule)
          },
          { default: () => t('DebugSettings.lcuEvent.delete') }
        )
      ])
    }
  }
]

const printRulesArr = computed(() => {
  return rds.rules.map((rule) => ({
    rule,
    data: rule
  }))
})

const editRuleModalShow = ref(false)
const editRuleText = ref('')
const editRuleInputEl = useTemplateRef('edit-rule-input')

watch(
  () => editRuleModalShow.value,
  (show) => {
    if (show) {
      nextTick(() => {
        editRuleInputEl.value?.focus()
      })
    }
  }
)

function isSubsequence(s: string, t: string) {
  let index = 0
  for (let i = 0; i < t.length && index < s.length; i++) {
    if (s[index] === t[i]) {
      index++
    }
  }
  return index === s.length
}

const options = computed(() => {
  return LCU_ENDPOINTS.filter((v) => isSubsequence(editRuleText.value, v)).toSorted(
    (a, b) => a.length - b.length
  )
})

const editRuleValid = computed(() => {
  if (!editRuleText.value) {
    return false
  }

  try {
    RadixMatcher.validateRoute(editRuleText.value)
  } catch (error) {
    return false
  }
  return true
})

const handleShowAddModal = async () => {
  editRuleText.value = ''
  editRuleModalShow.value = true
}

const handleAddRule = async () => {
  if (!editRuleValid.value) {
    return
  }

  rd.addRule(editRuleText.value)

  editRuleModalShow.value = false
}

const handleRemoveEditRule = async (rule: string) => {
  rd.removeRule(rule)
}
const handleToggleDevtools = async () => {
  await wm.mainWindow.toggleDevtools()
}

const handleShowLogsDir = async () => {
  await log.openLogsDir()
}

const handleShowUserDataDir = async () => {
  await app.openUserDataDir()
}

const handleReload = () => {
  location.reload()
}

const runtimeInfo = shallowRef<any>(null)

useIntervalFn(
  async () => {
    runtimeInfo.value = await app.getRuntimeInfo()
  },
  2000,
  { immediateCallback: true }
)
</script>

<style lang="less" scoped>
.operations {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.check-box {
  font-size: 13px;
}

.right-side {
  display: flex;
  justify-content: end;
  width: 100%;
}

.buttons {
  display: flex;
  gap: 4px;
}

.text {
  font-size: 13px;
}
</style>

<style module lang="less">
.table :global(.n-data-table-empty) {
  --n-empty-padding: 12px;
}
</style>
