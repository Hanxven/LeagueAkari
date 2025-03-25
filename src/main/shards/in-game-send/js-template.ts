const JS_TEMPLATE_VERSION_SUPPORT = 10

export const enum JS_TEMPLATE_CHECK_RESULT {
  VALID = 'valid',
  NOT_AN_OBJECT = 'not-an-object',
  NO_GET_METADATA = 'no-getMetadata',
  NO_METADATA = 'no-metadata',
  UNSUPPORTED_VERSION = 'unsupported-version',
  NO_GET_LINES = 'no-getLines'
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

  if (typeof ctx.getLines !== 'function') {
    return JS_TEMPLATE_CHECK_RESULT.NO_GET_LINES
  }

  return JS_TEMPLATE_CHECK_RESULT.VALID
}
