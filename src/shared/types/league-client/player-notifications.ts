export interface PlayerNotifications {
  backgroundUrl: string
  created: string
  critical: boolean
  data: any
  detailKey: string // key 对应 i18n 的 key, 如 pre_translated_details 是 {{details}}
  dismissible: boolean
  expires: string
  iconUrl: string
  id: number // 如果 post 会自动生成
  source: string
  state: string
  titleKey: string
  type: string
}
