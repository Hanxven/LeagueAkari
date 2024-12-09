<template>
  <div
    class="obj"
    ref="box"
    @mousedown="dragHandler($event)"
    @mouseenter="enter"
    @mouseleave="leave"
  >
    <img src="./assets/test.gif" />
    <p>Drag Me!</p>
  </div>
  <p>Overlay Window</p>
  <p>Click Count {{ count }}</p>
  <p>Click Through {{ clickThroughStatus }}</p>
  <button @mouseenter="enter" @mouseleave="leave" @click="clickThroughCount">
    Click Me!
  </button>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { ref } from 'vue'

const wm = useInstance<WindowManagerRenderer>('window-manager-renderer')

const count = ref(0);
const clickThroughStatus = ref(true);

const clickThroughCount = () => {
  count.value++;
};

const enter = () => {
  console.log("enter");
  clickThroughStatus.value = false;
  wm.setOverlayWindowClickThrough(false);
};

const leave = () => {
  console.log("leave");
  clickThroughStatus.value = true;
  wm.setOverlayWindowClickThrough(true);
};

const box = ref();

const dragHandler = (el: any) => {
  let oDiv = box.value;

  let disX = el.clientX - oDiv.offsetLeft;
  let disY = el.clientY - oDiv.offsetTop;
  document.onmousemove = (e) => {
    //通过事件委托，计算移动的距离
    let l = e.clientX - disX;
    let t = e.clientY - disY;
    if (l < 0) {
      //如果左侧的距离小于0，就让距离等于0.不能超出屏幕左侧。如果需要磁性吸附，把0改为100或者想要的数字即可
      l = 0;
    } else if (l + oDiv.offsetWidth > document.documentElement.clientWidth) {
      //如果左侧的距离>屏幕的宽度-元素的宽度。也就是说元素的右侧超出屏幕的右侧，就让元素的右侧在屏幕的右侧上
      l = document.documentElement.clientWidth - oDiv.offsetWidth;
    }
    if (t < 0) {
      //和左右距离同理
      t = 0;
    } else if (t + oDiv.offsetHeight > document.documentElement.clientHeight) {
      t = document.documentElement.clientHeight - oDiv.offsetHeight;
    }
    //移动当前元素
    // console.log(oDiv);
    oDiv.style["left"] = l + "px";
    oDiv.style["top"] = t + "px";
  };
  document.onmouseup = () => {
    document.onmousemove = null;
    document.onmouseup = null;
  };
  // 解决有些时候,在鼠标松开的时候,元素仍然可以拖动;
  document.ondragstart = (ev) => {
    ev.preventDefault();
  };
  document.ondragend = (ev) => {
    ev.preventDefault();
  };
  return false;
};
</script>

<style lang="less">
.obj {
  position: absolute;
  width: max-content;
  background-color: #646cff;
  top: 0;
  left: 0;
  z-index: 10;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
}

.obj img {
  margin: 10px;
  border-radius: 6px;
}
</style>