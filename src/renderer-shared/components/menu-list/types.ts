import { VNodeChild } from 'vue'

export interface MenuListItem {
  id: string | number
  label?: string | (() => VNodeChild)
  icon?: () => VNodeChild
}
