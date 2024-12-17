<template>
  <NCard size="small" class="champion-config-wrapper">
    <template #header>
      <div class="header">
        <LcuImage class="header-icon" :src="championIconUri(1)" />
        <span>黑暗之女</span>
      </div>
    </template>
    <template #footer>
      <div class="actions">
        <NButton size="small">取消</NButton>
        <NButton size="small" type="primary">保存</NButton>
      </div>
    </template>
    <NTabs
      class="tabs"
      :tab-style="{ paddingLeft: '0' }"
      :pane-style="{ paddingLeft: '16px' }"
      type="line"
      size="small"
      placement="left"
    >
      <NTabPane display-directive="show" name="runes">
        <template #tab>符文设定</template>
        <NTabs
          class="tabs"
          :tab-style="{ paddingLeft: '0' }"
          :pane-style="{ paddingLeft: '16px' }"
          type="line"
          size="small"
          placement="left"
        >
          <NTabPane name="default">
            <template #tab>默认</template>
            <RuneV2Edit />
          </NTabPane>
          <NTabPane name="top">
            <template #tab>上路</template>
            默认不选
          </NTabPane>
          <NTabPane name="middle">
            <template #tab>中路</template>
            真不选吗哥
          </NTabPane>
          <NTabPane name="jungle">
            <template #tab>打野</template>
            真不选吗哥
          </NTabPane>
          <NTabPane name="bottom">
            <template #tab>下路</template>
            真不选吗哥
          </NTabPane>
          <NTabPane name="utility">
            <template #tab>辅助</template>
            真不选吗哥
          </NTabPane>
        </NTabs>
      </NTabPane>
      <NTabPane display-directive="show" name="summoner-spells">
        <template #tab>召唤师技能</template>
        <NTabs
          class="tabs"
          :tab-style="{ paddingLeft: '0' }"
          :pane-style="{ borderLeft: '1px solid #fff1', paddingLeft: '16px' }"
          size="small"
          placement="left"
        >
          <NTabPane name="default">
            <template #tab>默认</template>
            <SummonerSpellEdit />
          </NTabPane>
          <NTabPane name="top">
            <template #tab>上路</template>
            默认不选
          </NTabPane>
          <NTabPane name="middle">
            <template #tab>中路</template>
            真不选吗哥
          </NTabPane>
          <NTabPane name="jungle">
            <template #tab>打野</template>
            真不选吗哥
          </NTabPane>
          <NTabPane name="bottom">
            <template #tab>下路</template>
            真不选吗哥
          </NTabPane>
          <NTabPane name="utility">
            <template #tab>辅助</template>
            真不选吗哥
          </NTabPane>
        </NTabs>
      </NTabPane>
    </NTabs>
  </NCard>
</template>

<script lang="ts" setup>
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import { NButton, NCard, NTabPane, NTabs } from 'naive-ui'
import SummonerSpellEdit from './SummonerSpellEdit.vue'
import RuneV2Edit from './RuneV2Edit.vue'
</script>

<style lang="less" scoped>
.champion-config-wrapper {
  height: 480px;
  width: 640px;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;

  .header-icon {
    width: 20px;
    height: 20px;
  }
}

.tabs {
  height: 100%;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}
</style>
