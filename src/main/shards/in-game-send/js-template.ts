import { i18next } from '@main/i18n'

const JS_TEMPLATE_VERSION_SUPPORT = 10

export const enum JS_TEMPLATE_CHECK_RESULT {
  VALID = 'valid',
  NOT_AN_OBJECT = 'not-an-object',
  NO_GET_METADATA = 'no-getMetadata',
  NO_METADATA = 'no-metadata',
  UNSUPPORTED_VERSION = 'unsupported-version',
  WRONG_TEMPLATE_TYPE = 'wrong-template-type',
  NO_GET_MESSAGES = 'no-getMessages'
}

export interface JSContextV1 {
  getMetadata: () => { version: number; type: string }
  getMessages: (env: any) => string[]
}

const SUPPORTED_TEMPLATE_TYPES = [
  // 战绩类, 读取 ongoing-game 阶段的数据
  'ongoing-game'
]

export function checkContextV1(ctx: any): JS_TEMPLATE_CHECK_RESULT {
  if (typeof ctx !== 'object') {
    return JS_TEMPLATE_CHECK_RESULT.NOT_AN_OBJECT
  }

  if (typeof ctx.getMetadata !== 'function') {
    return JS_TEMPLATE_CHECK_RESULT.NO_GET_METADATA
  }

  const metadata = ctx.getMetadata()

  if (typeof metadata !== 'object') {
    return JS_TEMPLATE_CHECK_RESULT.NO_METADATA
  }

  if (typeof metadata.version !== 'number' || metadata.version > JS_TEMPLATE_VERSION_SUPPORT) {
    return JS_TEMPLATE_CHECK_RESULT.UNSUPPORTED_VERSION
  }

  if (typeof metadata.type !== 'string' || !SUPPORTED_TEMPLATE_TYPES.includes(metadata.type)) {
    return JS_TEMPLATE_CHECK_RESULT.WRONG_TEMPLATE_TYPE
  }

  switch (metadata.type) {
    case 'ongoing-game':
      if (typeof ctx.getMessages !== 'function') {
        return JS_TEMPLATE_CHECK_RESULT.NO_GET_MESSAGES
      }
      break

    default:
      return JS_TEMPLATE_CHECK_RESULT.WRONG_TEMPLATE_TYPE
  }

  return JS_TEMPLATE_CHECK_RESULT.VALID
}

export function getExampleTemplate() {
  return i18next.t('in-game-send-main.exampleTemplate')
}
