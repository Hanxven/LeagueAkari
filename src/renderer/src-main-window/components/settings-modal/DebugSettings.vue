<template>
  <NScrollbar style="max-height: 65vh" trigger="none">
    <NModal preset="card" size="small" v-model:show="editRuleModalShow" style="max-width: 500px">
      <template #header>添加</template>
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
            添加
          </NButton>
        </div>
      </template>
      <NAutoComplete
        ref="edit-rule-input"
        placeholder="输入匹配规则，如 /path/:name/to"
        v-model:value="editRuleText"
        :options="options"
        size="small"
        :status="editRuleValid ? 'success' : 'error'"
      />
    </NModal>
    <NCard size="small">
      <template #header><span class="card-header-title">Akari's Electron</span></template>
      <ControlItem
        class="control-item-margin"
        label="开发者工具"
        label-description="Toggle DevTools"
        :label-width="320"
      >
        <NButton size="small" secondary type="primary" @click="handleToggleDevtools"
          >Toggle Devtools</NButton
        >
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="页面重载"
        label-description="刷新 League Akari 用户界面"
        :label-width="320"
      >
        <NButton size="small" secondary type="primary" @click="handleReload">重新加载界面</NButton>
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header><span class="card-header-title">存储</span></template>
      <ControlItem
        class="control-item-margin"
        label="日志目录"
        label-description="打开 League Akari 日志文件所在目录"
        :label-width="320"
      >
        <NButton size="small" secondary type="primary" @click="() => handleShowLogsDir()"
          >日志目录</NButton
        >
      </ControlItem>
      <ControlItem class="control-item-margin" label="应用数据目录" :label-width="320">
        <template #labelDescription>
          打开 League Akari
          应用文件存储目录。该目录为应用数据存储位置，在应用第一次运行时生成。删除此目录将丢失所有已存储的内容
          <NPopover :delay="50">
            <template #trigger>
              <span style="font-weight: bold; color: #fff; cursor: pointer">详情</span>
            </template>
            <table>
              <colgroup>
                <col style="width: 100px" />
              </colgroup>
              <tbody style="font-size: 12px">
                <tr>
                  <td>LeagueAkari.db</td>
                  <td>存储用户设置、已标记的玩家等信息</td>
                </tr>
                <tr>
                  <td>NewUpdates/</td>
                  <td>即将进行的自动更新临时文件</td>
                </tr>
                <tr>
                  <td>AkariConfig/</td>
                  <td>一些可以替换的设置项文件</td>
                </tr>
                <tr>
                  <td>base-config.json</td>
                  <td>特殊配置文件</td>
                </tr>
              </tbody>
            </table>
          </NPopover>
        </template>
        <NButton size="small" secondary type="primary" @click="() => handleShowUserDataDir()"
          >应用目录</NButton
        >
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header><span class="card-header-title">在控制台打印 LCU 事件</span></template>
      <div class="operations">
        <NCheckbox size="small" class="check-box" v-model:checked="rds.printAll"
          >打印全部事件</NCheckbox
        >
        <NButton
          size="tiny"
          @click="handleShowAddModal"
          v-show="!rds.printAll"
          secondary
          type="primary"
          >添加规则</NButton
        >
      </div>
      <NCollapseTransition :show="!rds.printAll">
        <NDataTable
          :class="$style.table"
          :columns="columns"
          :data="printRulesArr"
          size="small"
          bordered
        >
          <template #empty>无内容</template>
        </NDataTable>
      </NCollapseTransition>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header
        ><span class="card-header-title"
          >LCU{{ lc.connectionState === 'connected' ? '' : ' (未连接)' }}</span
        ></template
      >
      <NTable size="small" bordered>
        <colgroup>
          <col style="width: 120px" />
          <col />
        </colgroup>
        <tbody>
          <tr>
            <td>端口</td>
            <td><CopyableText :text="lc.auth?.port ?? '-'" /></td>
          </tr>
          <tr>
            <td>PID</td>
            <td><CopyableText :text="lc.auth?.pid ?? '-'" /></td>
          </tr>
          <tr>
            <td>密钥</td>
            <td><CopyableText :text="lc.auth?.authToken ?? '-'" /></td>
          </tr>
          <tr>
            <td>区服</td>
            <td>
              <CopyableText :text="lc.auth?.rsoPlatformId ?? '-'">{{
                (lc.auth?.rsoPlatformId
                  ? TENCENT_RSO_PLATFORM_NAME[lc.auth.rsoPlatformId] || lc.auth.rsoPlatformId
                  : lc.auth?.rsoPlatformId) || '-'
              }}</CopyableText>
            </td>
          </tr>
          <tr>
            <td>地域</td>
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
      <template #header><span class="card-header-title">游戏流</span></template>
      <span class="text" v-if="lc.connectionState === 'connected'"
        >{{ gameflowText[lc.gameflow.phase || 'None'] }} ({{ lc.gameflow.phase }})</span
      >
      <span class="text" v-else>不可用 (未连接)</span>
    </NCard>
    <NCard v-if="as.isAdministrator" size="small" style="margin-top: 8px">
      <template #header><LeagueAkariSpan class="card-header-title" /></template>
      <span class="text">League Akari 运行在管理员权限，仅用于实现特定的客户端功能</span>
    </NCard>
    <NCard v-if="as.settings.isInKyokoMode" size="small" style="margin-top: 8px">
      <template #header><span class="card-header-title">Akari~</span></template>
      <ControlItem
        class="control-item-margin"
        label="Kyoko Mode"
        label-description="部分功能仅用于调试用途"
        :label-width="320"
      >
        <NSwitch
          size="small"
          v-if="as.settings.isInKyokoMode"
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
import {
  DataTableColumn,
  NAutoComplete,
  NButton,
  NCard,
  NCheckbox,
  NCollapseTransition,
  NDataTable,
  NFlex,
  NModal,
  NPopover,
  NScrollbar,
  NSwitch,
  NTable
} from 'naive-ui'
import { computed, h, nextTick, ref, useTemplateRef, watch } from 'vue'

import { LCU_ENDPOINTS } from './lcu-endpoints'

const lc = useLeagueClientStore()
const rds = useRendererDebugStore()
const as = useAppCommonStore()

const wm = useInstance<WindowManagerRenderer>('window-manager-renderer')
const log = useInstance<LoggerRenderer>('logger-renderer')
const app = useInstance<AppCommonRenderer>('app-common-renderer')
const rd = useInstance<RendererDebugRenderer>('renderer-debug-renderer')

const gameflowText = {
  Matchmaking: '正在匹配',
  ChampSelect: '英雄选择中',
  ReadyCheck: '等待接受状态中',
  InProgress: '游戏进行中',
  EndOfGame: '游戏结算',
  Lobby: '房间',
  GameStart: '游戏开始',
  None: '无',
  Reconnect: '重新连接',
  WaitingForStats: '等待结果',
  PreEndOfGame: '结束游戏之前',
  WatchInProgress: '在观战中'
}

const columns: DataTableColumn<any>[] = [
  {
    title: '启用',
    key: 'enable',
    width: 60,
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
    title: '规则',
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
          { default: () => '删除' }
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
  return LCU_ENDPOINTS
    .filter((v) => isSubsequence(editRuleText.value, v))
    .toSorted((a, b) => a.length - b.length)
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
  await wm.toggleMainWindowDevtools()
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
</script>

<style lang="less" scoped>
.operations {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.card-header-title {
  font-weight: bold;
  font-size: 18px;
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

.control-item-margin {
  &:not(:last-child) {
    margin-bottom: 12px;
  }
}
</style>

<style module lang="less">
.table :global(.n-data-table-empty) {
  --n-empty-padding: 12px;
}
</style>
