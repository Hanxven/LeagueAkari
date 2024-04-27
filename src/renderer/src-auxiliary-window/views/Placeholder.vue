<template>
  <div class="la-placeholder">
    <span>League <span class="beautiful-akari">Akari</span></span>
    <span class="sub">当前没有进行中的活动</span>
  </div>
</template>

<style lang="less" scoped>
.la-placeholder {
  display: flex;
  position: relative;
  flex-direction: column;
  top: calc(var(--app-title-bar-height) * -1);
  color: #8d8d8d;
  font-size: 14px;
  font-weight: 700;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.sub {
  font-size: 12px;
  font-weight: normal;
}

.beautiful-akari {
  background-clip: text;
  background-image: linear-gradient(90deg, #b96ab7 0%, #658dc6 100%);
  color: transparent;
}
</style>
