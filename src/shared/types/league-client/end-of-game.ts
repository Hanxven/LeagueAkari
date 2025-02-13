//

export interface GameclientEogStatsBlock {
  gameId: number
  gameMode: string
  isRanked: boolean
  queueId: number
  queueType: string
  statsBlock: StatsBlock
}

interface StatsBlock {
  gameLengthSeconds: number
  players: Player[]
}

interface Player {
  PUUID: string
  augmentPlatformIds: number[]
  championId: number
  championLevel: number
  championName: string
  championSkinId: number
  damageDealt: number
  damageDealtToChampions: number
  damageTaken: number
  goldEarned: number
  itemIds: number[]
  playerAssists: number
  playerDeaths: number
  playerId: number
  playerKills: number
  subteamId: number
  subteamStanding: number
  summonerSpell1: number
  summonerSpell2: number
}

/**
 *                 subteams: [{
                    subteamId: 1,
                    display: {
                        label: "cherry_subteam_display_name_poro",
                        icon: "/fe/lol-postgame/subteams/poro.svg"
                    }
                }, {
                    subteamId: 2,
                    display: {
                        label: "cherry_subteam_display_name_minion",
                        icon: "/fe/lol-postgame/subteams/minion.svg"
                    }
                }, {
                    subteamId: 3,
                    display: {
                        label: "cherry_subteam_display_name_scuttle",
                        icon: "/fe/lol-postgame/subteams/scuttle.svg"
                    }
                }, {
                    subteamId: 4,
                    display: {
                        label: "cherry_subteam_display_name_krug",
                        icon: "/fe/lol-postgame/subteams/krug.svg"
                    }
                }, {
                    subteamId: 5,
                    display: {
                        label: "cherry_subteam_display_name_raptor",
                        icon: "/fe/lol-postgame/subteams/raptor.svg"
                    }
                }, {
                    subteamId: 6,
                    display: {
                        label: "cherry_subteam_display_name_sentinel",
                        icon: "/fe/lol-postgame/subteams/sentinel.svg"
                    }
                }, {
                    subteamId: 7,
                    display: {
                        label: "cherry_subteam_display_name_wolf",
                        icon: "/fe/lol-postgame/subteams/wolf.svg"
                    }
                }, {
                    subteamId: 8,
                    display: {
                        label: "cherry_subteam_display_name_gromp",
                        icon: "/fe/lol-postgame/subteams/gromp.svg"
                    }
                }]
 */
