export interface LcuEvent<T = any> {
  uri: string
  data: T
  eventType: 'Update' | 'Create' | 'Delete'
}
