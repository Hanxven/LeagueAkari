import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useTgpApiStore = defineStore('module:tgp-api', () => {
  const settings = reactive({
    enabled: false,
    qq: '',
    expired: true,
    tgpId: '',
    tgpTicket: ''
  })

  return {
    settings
  }
})
