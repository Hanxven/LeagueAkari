import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

export const useAutoGameflowStore = defineStore('feature:auto-gameflow', () => {
  const settings = reactive({
    autoHonorEnabled: false,
    autoHonorStrategy: 'prefer-lobby-member',
    playAgainEnabled: false,
    autoAcceptEnabled: false,
    autoAcceptDelaySeconds: 0,
    autoSearchMatchEnabled: false,
    autoSearchMatchDelaySeconds: 0
  })

  const willAccept = ref(false)

  // 即将自动接受对局的时间 (有误差)
  const willAcceptAt = ref(-1)

  const willSearchMatch = ref(false)

  const willSearchMatchAt = ref(-1)

  return {
    settings,
    willAccept,
    willAcceptAt,
    willSearchMatch,
    willSearchMatchAt
  }
})
