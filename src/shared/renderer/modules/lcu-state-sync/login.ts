import { LoginQueueState } from '@shared/types/lcu/login'
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const useLoginStore = defineStore('lcu:login', () => {
  const loginQueueState = shallowRef<LoginQueueState | null>(null)

  return {
    loginQueueState
  }
})
