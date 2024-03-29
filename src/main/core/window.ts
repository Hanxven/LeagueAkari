import { BrowserWindow } from 'electron'
import { observable, reaction, runInAction } from 'mobx'

import { onCall, sendUpdate } from '../utils/ipc'

export const windowState = observable({
  windowState: 'normal', // should be one of 'normal', 'maximized', 'minimized'
  focusState: 'focused' // should be one of 'focused', 'blurred'
})

// 和窗口相关的 API
export function initWindowIpc(w: BrowserWindow) {
  reaction(
    () => windowState.windowState,
    (windowState) => {
      sendUpdate(w.webContents, 'windowState', windowState)
    }
  )

  reaction(
    () => windowState.focusState,
    (focusState) => {
      sendUpdate(w.webContents, 'focusState', focusState)
    }
  )

  runInAction(() => {
    if (w.isMaximized()) {
      windowState.windowState = 'maximized'
    } else if (w.isMinimized()) {
      windowState.windowState = 'minimized'
    } else {
      windowState.windowState = 'normal'
    }
  })

  w.on('maximize', () => {
    runInAction(() => {
      windowState.windowState = 'maximized'
    })
  })

  w.on('unmaximize', () => {
    runInAction(() => {
      windowState.windowState = 'normal'
    })
  })

  w.on('focus', () => {
    runInAction(() => {
      windowState.focusState = 'focused'
    })
  })

  w.on('blur', () => {
    runInAction(() => {
      windowState.focusState = 'blurred'
    })
  })

  // update:/la/main-window/window-size
  onCall('setWindowSize', async (_e, width, height, animate) => {
    w.setSize(width, height, animate)
  })

  // get:/la/main-window/size
  onCall('getWindowSize', async () => {
    return w.getSize()
  })

  // get:/la/main-window/state
  onCall('getWindowState', () => {
    return windowState.windowState
  })

  // update:/la/main-window/maximize
  onCall('maximize', async () => {
    w.maximize()
  })

  // update:/la/main-window/minimize
  onCall('minimize', async () => {
    w.minimize()
  })

  // call:/la/main-window/unmaximize
  onCall('unmaximize', async () => {
    w.unmaximize()
  })

  // call:/la/main-window/restore
  onCall('restore', async () => {
    w.restore()
  })

  // call:/la/main-window/close
  onCall('close', async () => {
    w.close()
  })

  // call:/la/main-window/devtools/toggle
  onCall('toggleDevtools', async () => {
    w.webContents.toggleDevTools()
  })

  // update:/la/main-window/title
  onCall('setTitle', (_, title) => {
    w.setTitle(title)
  })

  // call:/main-window/hide
  onCall('hide', () => {
    w.hide()
  })

  // call:/window/show
  onCall('show', (_, inactive) => {
    if (inactive) {
      w.showInactive()
    } else {
      w.show()
      w.setAlwaysOnTop
    }
  })

  // update:/window/always-on-top
  onCall('setAlwaysOnTop', (_, flag, level, relativeLevel) => {
    w.setAlwaysOnTop(flag, level, relativeLevel)
  })

  w.on('page-title-updated', (e) => e.preventDefault())
}
