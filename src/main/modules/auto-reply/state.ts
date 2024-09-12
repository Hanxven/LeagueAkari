import { makeAutoObservable } from 'mobx'

class AutoReplySettings {
  enabled: boolean = false

  /**
   * 仅在离开时触发自动回复
   */
  enableOnAway: boolean = false

  /**
   * 回复的文本
   */
  text: string = ''

  setText(text: string) {
    this.text = text
  }

  setEnableOnAway(yes: boolean) {
    this.enableOnAway = yes
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class AutoReplyState {
  settings = new AutoReplySettings()

  constructor() {
    makeAutoObservable(this)
  }
}
