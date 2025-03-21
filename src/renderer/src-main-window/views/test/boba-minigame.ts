export const initialState = {
  FTUXConvosHeard: [],
  Version: 1,
  animationsSeen: [],
  battlesWon: 0,
  completedMapNodes: [],
  conversationsPlayed: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  currency: 0,
  currentMapEnemies: [
    {
      enemyId: 'minotaur',
      nodeId: 12
    },
    {
      enemyId: 'wolf',
      nodeId: 11
    },
    {
      enemyId: 'imposing_fox',
      nodeId: 7
    },
    {
      enemyId: 'frenzied_flock_of_ravens',
      nodeId: 8
    },
    {
      enemyId: 'starving_wolf',
      nodeId: 5
    },
    {
      enemyId: 'tri_tail',
      nodeId: 3
    },
    {
      enemyId: 'flock_of_ravens',
      nodeId: 1
    },
    {
      enemyId: 'bison',
      nodeId: 999
    }
  ],
  demonHand: 0,
  encounteredEnemies: [],
  flush: 0,
  fullHouse: 0,
  hasSeenIntroComic: true,
  hasSeenOutroComic: false,
  high: 0,
  highestBattlesWon: 0,
  highestDamageDealtAllTime: 0,
  highestDamageDealtThisRun: 0,
  highestTotalDamageDealtAllTime: 0,
  highestTotalGoldEarned: 0,
  hp: 100,
  isFirstPlaythrough: true,
  mapIndex: 0,
  mostPlayed: 1,
  pair: 0,
  quads: 0,
  retortsPlayed: [],
  runBonusStats: {
    BonusBaseCardDamage: 0,
    BonusCritChance: 0,
    BonusMaxHp: 0
  },
  runNum: 1,
  selectedDifficulty: 0,
  settingsSaveState: {
    ambienceVolume: 1,
    brightness: 0.5,
    contrast: 0.5,
    gamma: 0.5,
    mainVolume: 1,
    musicVolume: 1,
    sfxVolume: 1
  },
  sigilSaveState: {
    SigilProgression: [0, 0, 0, 0, 0, 0],
    Sigils: ['', '', '', '', '', '']
  },
  straight: 0,
  straightFlush: 0,
  totalDamageDealtThisRun: 0,
  totalGoldEarned: 0,
  triples: 0,
  twoPair: 0,
  usePlaytestSigilsSet: false,
  wonLastGame: false
} as const
