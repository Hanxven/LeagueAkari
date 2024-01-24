import { BrowserWindow } from 'electron'
import { observable, reaction, runInAction } from 'mobx'

import { basicState } from './basic'
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

  onCall('setWindowSize', async (_e, width, height, animate) => {
    w.setSize(width, height, animate)
  })

  onCall('getWindowSize', async () => {
    return w.getSize()
  })

  onCall('getWindowState', () => {
    return windowState.windowState
  })

  onCall('maximize', async () => {
    w.maximize()
  })

  onCall('minimize', async () => {
    w.minimize()
  })

  onCall('unmaximize', async () => {
    w.unmaximize()
  })

  onCall('restore', async () => {
    w.restore()
  })

  onCall('close', async () => {
    w.close()
  })

  onCall('toggleDevtools', async () => {
    w.webContents.toggleDevTools()
  })

  onCall('setTitle', (_, title) => {
    w.setTitle(title)
  })

  onCall('hide', () => {
    w.hide()
  })

  onCall('show', (_, inactive) => {
    if (inactive) {
      w.showInactive()
    } else {
      w.show()
      w.setAlwaysOnTop
    }
  })

  onCall('setAlwaysOnTop', (_, flag, level, relativeLevel) => {
    w.setAlwaysOnTop(flag, level, relativeLevel)
  })

  reaction(
    () => basicState.isAdmin,
    (isAdmin) => {
      if (isAdmin) {
        w.setTitle('League Toolkiverse')
      }
    }
  )

  w.on('page-title-updated', (e) => e.preventDefault())
}
