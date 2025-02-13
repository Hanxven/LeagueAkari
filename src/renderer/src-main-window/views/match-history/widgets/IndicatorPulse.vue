<template>
  <div class="ongoing-indicator"></div>
</template>

<style lang="less" scoped>
.ongoing-indicator {
  width: 8px;
  height: 8px;
  background-color: #00ff00;
  border-radius: 50%;
  animation: indicator-pulse 4s infinite;
}

@keyframes indicator-pulse {
  0% {
    box-shadow: 0 0 0 0 #00ff0066;
  }
  20% {
    box-shadow: 0 0 0 10px #00ff0000;
  }
  100% {
    box-shadow: 0 0 0 0 #00ff0000;
  }
}
</style>
