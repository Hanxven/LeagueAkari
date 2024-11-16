import 'reflect-metadata'

import { app } from 'electron'

import { bootstrap } from './bootstrap'

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
}

bootstrap()
