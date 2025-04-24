import { SgpServersConfig } from '@shared/data-sources/sgp'
import Ajv from 'ajv'

export const LEAGUE_SGP_SERVERS_CONFIG_SCHEMA = {
  type: 'object',
  properties: {
    servers: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          matchHistory: {
            type: ['string', 'null']
          },
          common: {
            type: ['string', 'null']
          }
        },
        required: ['matchHistory', 'common'],
        additionalProperties: true
      }
    },
    tencentServerMatchHistoryInteroperability: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    tencentServerSpectatorInteroperability: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    tencentServerSummonerInteroperability: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    serverNames: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        additionalProperties: { type: 'string' }
      }
    },
    version: {
      type: 'number'
    },
    lastUpdate: {
      type: 'number'
    }
  },
  required: [
    'servers',
    'serverNames',
    'version',
    'lastUpdate',
    'tencentServerMatchHistoryInteroperability',
    'tencentServerSpectatorInteroperability',
    'tencentServerSummonerInteroperability'
  ],
  additionalProperties: true
} as const

const ajv = new Ajv()
const validateSchemaFn = ajv.compile<SgpServersConfig>(LEAGUE_SGP_SERVERS_CONFIG_SCHEMA)

export function validateSchema(obj: unknown) {
  return {
    valid: validateSchemaFn(obj),
    errors: validateSchemaFn.errors
  }
}
