import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

export const useAutoGameflowStore = defineStore('feature:auto-gameflow', () => {
  const settings = reactive({
    autoHonorEnabled: false,
    autoHonorStrategy: 'prefer-lobby-member',
    playAgainEnabled: false,
    autoAcceptEnabled: false,
    autoAcceptDelaySeconds: 0
  })

  const willAutoAccept = ref(false)

  // 即将自动接受对局的时间 (有误差)
  const willAutoAcceptAt = ref(-1)

  return {
    settings,
    willAutoAccept,
    willAutoAcceptAt
  }
})
