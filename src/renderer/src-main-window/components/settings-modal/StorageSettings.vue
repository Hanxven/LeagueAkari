<template>
  <NScrollbar style="max-height: 65vh">
    <NCard size="small">
      <template #header><span class="card-header-title">存储</span></template>
      <div class="control-line">
        <div class="label" title="占位">占位</div>
        <div class="control"></div>
      </div>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts"></script>

<style lang="less" scoped>
.card-header-title {
  font-weight: bold;
  font-size: 18px;
}

.control-line {
  display: flex;
  align-items: center;
  font-size: 13px;
  height: 30px;

  &:not(:last-child) {
    margin-bottom: 16px;
  }

  .label {
    width: 130px;
  }

  // .control {
  // }

  .input-number {
    width: 120px;
  }
}
</style>
