import { mainStateSync } from '@shared/renderer/utils/ipc'

import { useExternalDataSourceStore } from './store'

export async function setupExternalDataSource() {
  const cks = useExternalDataSourceStore()

  mainStateSync('external-data-source/balance', (s) => (cks.balance = s))
}
