import { defineStore } from "pinia";
import { reactive } from "vue";

export const useLeagueClientStore = defineStore('module:lcu-client', () => {
  const settings = reactive({
    fixWindowMethodAOptions: {
      baseWidth: 1600,
      baseHeight: 900
    } 
  })

  return {
    settings
  }
})