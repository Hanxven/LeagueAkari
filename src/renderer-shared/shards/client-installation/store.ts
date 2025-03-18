import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

export const useClientInstallationStore = defineStore('shard:client-installation-renderer', () => {
  const leagueClientExecutablePaths = shallowRef<string[]>([])
  const tencentInstallationPath = ref<string | null>(null)
  const weGameExecutablePath = ref<string | null>(null)
  const officialRiotClientExecutablePath = ref<string | null>(null)
  const detectedLiveStreamingClients = shallowRef<string[]>([])

  const hasTcls = ref(false)
  const hasWeGameLauncher = ref(false)

  return {
    leagueClientExecutablePaths,
    tencentInstallationPath,
    weGameExecutablePath,
    officialRiotClientExecutablePath,
    hasTcls,
    hasWeGameLauncher,
    detectedLiveStreamingClients
  }
})
