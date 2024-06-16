import { defineStore } from "pinia";
import { reactive } from "vue";

export const useLeagueClientStore = defineStore('module:lcu-client', () => {
  const settings = reactive({
    fixWindowMethodAOptions: {
      baseWidth: 1280,
      baseHeight: 720
    } 
  })

  return {
    settings
  }
})