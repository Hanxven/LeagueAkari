import { makeAutoObservable } from 'mobx'

class CustomKeyboardSequenceSettings {
  enabled: boolean = false

  /**
   * 回复的文本
   */
  text: string = ''

  setText(text: string) {
    this.text = text
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  constructor() {
    makeAutoObservable(this)
  }
}

class CustomKeyboardSequenceState {
  settings = new CustomKeyboardSequenceSettings()

  constructor() {
    makeAutoObservable(this)
  }
}

export const customKeyboardSequenceState = new CustomKeyboardSequenceState()
