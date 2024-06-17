<template>
  <NScrollbar style="max-height: 60vh" trigger="none">
    <NModal preset="card" size="small" v-model:show="editRuleModalShow" style="max-width: 500px">
      <template #header>添加</template>
      <template #footer>
        <div class="right-side">
          <NButton
            size="tiny"
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
        ref="editRuleInputEl"
        placeholder="输入匹配规则，如 /path/:name/to"
        v-model:value="editRuleText"
        :options="options"
        size="small"
        :status="editRuleValid ? 'success' : 'error'"
      />
    </NModal>

    <NCard size="small">
      <template #header><span class="card-header-title">Electron</span></template>
      <div class="buttons">
        <NButton size="tiny" secondary type="primary" @click="handleToggleDevtools"
          >Toggle Devtools</NButton
        >
        <NButton size="tiny" secondary type="primary" @click="handleReload">重新加载界面</NButton>
      </div>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header><span class="card-header-title">存储</span></template>
      <ControlItem
        class="control-item-margin"
        label="日志目录"
        label-description="打开 League Akari 日志文件所在目录"
        :label-width="320"
      >
        <NButton size="tiny" secondary type="primary" @click="() => handleShowLogsDir()"
          >日志目录</NButton
        >
      </ControlItem>
      <ControlItem class="control-item-margin" label="应用数据目录" :label-width="320">
        <template #labelDescription>
          打开 League Akari
          应用文件存储目录。该目录为应用数据存储位置，在应用第一次运行时生成。删除此目录将丢失所有已存储的内容
          <NPopover>
            <template #trigger>
              <span style="font-weight: 700; color: #fff; cursor: pointer">详情</span>
            </template>
            <div style="font-size: 12px">该目录下：</div>
            <div style="font-size: 12px">LeagueAkari.db - 存储用户设置、已标记的玩家等信息</div>
          </NPopover>
        </template>
        <NButton size="tiny" secondary type="primary" @click="() => handleShowUserDataDir()"
          >应用目录</NButton
        >
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header><span class="card-header-title">在控制台打印 LCU 事件</span></template>
      <div class="operations">
        <NCheckbox size="small" class="check-box" v-model:checked="debug.settings.printAllLcuEvents"
          >打印全部事件</NCheckbox
        >
        <NButton
          size="tiny"
          @click="handleShowAddModal"
          v-show="!debug.settings.printAllLcuEvents"
          secondary
          type="primary"
          >添加规则</NButton
        >
      </div>
      <NCollapseTransition :show="!debug.settings.printAllLcuEvents">
        <NDataTable
          :class="styles.table"
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
          >LCU{{ lc.state === 'connected' ? '' : ' (未连接)' }}</span
        ></template
      >
      <NTable size="small" bordered>
        <tbody>
          <tr>
            <td style="width: 50px">端口</td>
            <td><CopyableText :text="lc.auth?.port ?? '-'" /></td>
          </tr>
          <tr>
            <td>PID</td>
            <td><CopyableText :text="lc.auth?.pid ?? '-'" /></td>
          </tr>
          <tr>
            <td>密钥</td>
            <td><CopyableText :text="lc.auth?.password ?? '-'" /></td>
          </tr>
          <tr>
            <td>区服</td>
            <td>
              <CopyableText :text="lc.auth?.rsoPlatformId ?? '-'">{{
                (lc.auth?.rsoPlatformId
                  ? rsoPlatformText[lc.auth.rsoPlatformId] || lc.auth.rsoPlatformId
                  : lc.auth?.rsoPlatformId) || '-'
              }}</CopyableText>
            </td>
          </tr>
          <tr>
            <td>地域</td>
            <td>
              <CopyableText :text="lc.auth?.region ?? '-'">{{
                lc.auth?.region
                  ? regionText[lc.auth.region] || lc.auth.region
                  : lc.auth?.region || '-'
              }}</CopyableText>
            </td>
          </tr>
        </tbody>
      </NTable>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header><span class="card-header-title">游戏流</span></template>
      <span class="text" v-if="lc.state === 'connected'"
        >{{ gameflowText[gameflow.phase || 'None'] }} ({{ gameflow.phase }})</span
      >
      <span class="text" v-else>不可用 (未连接)</span>
    </NCard>
    <NCard v-if="app.isAdministrator" size="small" style="margin-top: 8px">
      <template #header><LeagueAkariSpan class="card-header-title" /></template>
      <span class="text">League Akari 运行在管理员权限，仅用于实现特定的客户端功能</span>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@shared/renderer/components/ControlItem.vue'
import CopyableText from '@shared/renderer/components/CopyableText.vue'
import LeagueAkariSpan from '@shared/renderer/components/LeagueAkariSpan.vue'
import { appRendererModule as am } from '@shared/renderer/modules/app'
import { useAppStore } from '@shared/renderer/modules/app/store'
import { useLcuConnectionStore } from '@shared/renderer/modules/lcu-connection/store'
import { useGameflowStore } from '@shared/renderer/modules/lcu-state-sync/gameflow'
import { mainWindowRendererModule as mwm } from '@shared/renderer/modules/main-window'
import { RadixMatcher } from '@shared/utils/radix-matcher'
import { regionText, rsoPlatformText } from '@shared/utils/rso-platforms'
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
  NTable
} from 'naive-ui'
import { computed, h, nextTick, ref, useCssModule, watch } from 'vue'

import { debugRendererModule as dm } from '@main-window/modules/debug'
import { useDebugStore } from '@main-window/modules/debug/store'

import { lcuEndpoints } from './lcu-endpoints'

const gameflow = useGameflowStore()
const app = useAppStore()
const debug = useDebugStore()
const lc = useLcuConnectionStore()

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
            dm.enablePrintRule(row.rule)
          } else {
            dm.disablePrintRule(row.rule)
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
        row.rule
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
            onClick: () => handleRemoveEditRule(row.rule)
          },
          { default: () => '删除' }
        )
      ])
    }
  }
]

const printRulesArr = computed(() => {
  return Object.keys(debug.settings.printRules)
    .sort((a, b) => a.localeCompare(b))
    .map((k) => ({
      rule: k,
      data: debug.settings.printRules[k]
    }))
})

const editRuleModalShow = ref(false)
const editRuleText = ref('')
const editRuleInputEl = ref()

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
  return lcuEndpoints
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

  dm.addPrintRule(editRuleText.value)

  editRuleModalShow.value = false
}

const handleRemoveEditRule = async (rule: string) => {
  dm.removePrintRule(rule)
}

const styles = useCssModule()

const handleToggleDevtools = async () => {
  await mwm.toggleDevTools()
}

const handleShowLogsDir = async () => {
  await am.openLogsDirInExplorer()
}

const handleShowUserDataDir = async () => {
  await am.openUserDataDirInExplorer()
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
</style>

<style module lang="less">
.table :global(.n-data-table-empty) {
  --n-empty-padding: 12px;
}
</style>