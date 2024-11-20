import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

export const useClientInstallationStore = defineStore('shard:client-installation-renderer', () => {
  const leagueClientExecutablePaths = shallowRef<string[]>([])
  const tencentInstallationPath = ref<string | null>(null)
  const weGameExecutablePath = ref<string | null>(null)
  const defaultRiotClientExecutablePath = ref<string | null>(null)

  return {
    leagueClientExecutablePaths,
    tencentInstallationPath,
    weGameExecutablePath,
    defaultRiotClientExecutablePath
  }
})
