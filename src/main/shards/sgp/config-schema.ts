export const SCHEMA = {
  type: 'object',
  properties: {
    servers: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          name: {
            type: 'string'
          },
          matchHistory: {
            type: ['string', 'null']
          },
          common: {
            type: ['string', 'null']
          }
        },
        required: ['name'],
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
    }
  },
  required: [
    'servers',
    'tencentServerMatchHistoryInteroperability',
    'tencentServerSpectatorInteroperability',
    'tencentServerSummonerInteroperability'
  ],
  additionalProperties: true
} as const
