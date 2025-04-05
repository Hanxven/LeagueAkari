import { makeAutoObservable } from 'mobx'

export class AutoReplySettings {
  enabled: boolean = false

  /**
   * 仅在离开时触发自动回复
   */
  enableOnAway: boolean = false

  /**
   * 回复的文本
   */
  text: string = ''

  lockOfflineStatus: boolean = false

  setText(text: string) {
    this.text = text
  }

  setEnableOnAway(yes: boolean) {
    this.enableOnAway = yes
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  setLockOfflineStatus(yes: boolean) {
    this.lockOfflineStatus = yes
  }

  constructor() {
    makeAutoObservable(this)
  }
}
