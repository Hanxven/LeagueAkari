export const FANDOM_BALANCE_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: ['object', 'null'],
  additionalProperties: {
    $ref: '#/definitions/info'
  },
  definitions: {
    info: {
      type: 'object',
      required: ['id', 'balance'],
      properties: {
        id: {
          type: 'number'
        },
        balance: {
          type: 'object',
          properties: {
            ar: { $ref: '#/definitions/modeInfo' },
            aram: { $ref: '#/definitions/modeInfo' },
            nb: { $ref: '#/definitions/modeInfo' },
            ofa: { $ref: '#/definitions/modeInfo' },
            urf: { $ref: '#/definitions/modeInfo' },
            usb: { $ref: '#/definitions/modeInfo' }
          },
          additionalProperties: false
        }
      },
      additionalProperties: false
    },
    modeInfo: {
      type: ['object', 'null'],
      properties: {
        dmg_dealt: { type: 'number' },
        dmg_taken: { type: 'number' },
        healing: { type: 'number' },
        shielding: { type: 'number' },
        ability_haste: { type: 'number' },
        mana_regen: { type: 'number' },
        energy_regen: { type: 'number' },
        attack_speed: { type: 'number' },
        movement_speed: { type: 'number' },
        tenacity: { type: 'number' }
      },
      additionalProperties: false
    }
  }
} as const
