import { i18next } from '@main/i18n'
import { AkariManager } from '@shared/akari-shard'

const JS_TEMPLATE_VERSION_SUPPORT = 10

export const enum JS_TEMPLATE_CHECK_RESULT {
  VALID = 'valid',
  NOT_AN_OBJECT = 'not-an-object',
  NO_GET_METADATA = 'no-getMetadata',
  NO_METADATA = 'no-metadata',
  UNSUPPORTED_VERSION = 'unsupported-version',
  NO_GET_MESSAGES = 'no-getMessages'
}

export interface JSContextV1 {
  require: NodeJS.Require
  akariManager: AkariManager

  getMetadata: () => { version: number }
  getLines: (env: any) => string[]
}

export function checkContextV1(ctx: any): JS_TEMPLATE_CHECK_RESULT {
  if (typeof ctx !== 'object') {
    return JS_TEMPLATE_CHECK_RESULT.NOT_AN_OBJECT
  }

  if (typeof ctx.getMetadata !== 'function') {
    return JS_TEMPLATE_CHECK_RESULT.NO_GET_METADATA
  }

  const metadata = ctx.getMetadata()

  if (typeof metadata !== 'object' || typeof metadata.version !== 'number') {
    return JS_TEMPLATE_CHECK_RESULT.NO_METADATA
  }

  if (metadata.version > JS_TEMPLATE_VERSION_SUPPORT) {
    return JS_TEMPLATE_CHECK_RESULT.UNSUPPORTED_VERSION
  }

  if (typeof ctx.getMessages !== 'function') {
    return JS_TEMPLATE_CHECK_RESULT.NO_GET_MESSAGES
  }

  return JS_TEMPLATE_CHECK_RESULT.VALID
}

export function getExampleTemplate() {
  return i18next.t('in-game-send-main.exampleTemplate')
}
