import { defineStore } from 'pinia'
import { ref } from 'vue'

// 用于自动接受匹配功能的其他有关临时状态
export const useAutoAcceptStore = defineStore('feature:auto-accept', () => {
  // 即将自动接受对局
  const willAutoAccept = ref(false)

  // 即将自动接受对局的时间 (有误差)
  const willAutoAcceptAt = ref(-1)

  return {
    willAutoAccept,
    willAutoAcceptAt
  }
})
