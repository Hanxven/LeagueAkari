import { lcuConnectionModule as lcm } from '@main/modules/akari-core/lcu-connection'
import { EntitlementsToken } from '@shared/types/lcu/entitlements'

export function getEntitlementsToken() {
  return lcm.request<EntitlementsToken>({
    method: 'GET',
    url: '/entitlements/v1/token'
  })
}
