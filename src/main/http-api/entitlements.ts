import { lcuConnectionModule as lcm } from '@main/modules/lcu-connection'
import { EntitlementsToken } from '@shared/types/lcu/entitlements'

export function getEntitlementsToken() {
  return lcm.lcuRequest<EntitlementsToken>({
    method: 'GET',
    url: '/entitlements/v1/token'
  })
}
