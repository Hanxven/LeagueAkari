interface BattleHonour {
  gameLevel: string;
  isDoubleKills: number;
  isGodlike: number;
  isLargestAllMinionsKilled: number;
  isLargestAssists: number;
  isLargestChampionsKilled: number;
  isLargestGoldEarned: number;
  isLargestTotalDamageDealt: number;
  isLargestTotalDamageDealtToChampions: number;
  isLargestTotalDamageTaken: number;
  isLargestTotalHealthToMate: number;
  isLargestTurretsKilled: number;
  isMvp: number;
  isPentaKills: number;
  isQuadraKills: number;
  isSvp: number;
  isTripleKills: number;
  isUnrealKills: number;
  isWinWithLessTeammate: number;
  isZeroDeath: number;
}

interface PlayerDetails {
  PERK0: number;
  PERK1: number;
  PERK2: number;
  PERK3: number;
  PERK4: number;
  PERK5: number;
  STAT_PERK_0: number;
  STAT_PERK_1: number;
  STAT_PERK_2: number;
  allMinionsKilled: number;
  assists: number;
  baronKills: number;
  barracksKilled: number;
  battleHonour: BattleHonour;
  championId: number;
  championUsedExp: number;
  championsKilled: number;
  consumablesPurchased: number;
  doubleKills: number;
  dragonKills: number;
  exp: number;
  fixApiAreaId: string;
  gameScore: number;
  goldEarned: number;
  goldSpent: number;
  hqKilled: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  itemsPurchased: number;
  keystoneId: number;
  killingSpress: number;
  largestCriticalStrike: number;
  largestKillingSpree: number;
  largestMultiKill: number;
  level: number;
  loginIp: string;
  lolId: string;
  lpl: string;
  magicDamageDealtPlayer: number;
  magicDamageTaken: number;
  magicDamageToChampions: number;
  minionsKilled: number;
  name: string;
  neutralMinionsKilled: number;
  new_item0: number;
  new_item1: number;
  new_item2: number;
  new_item3: number;
  new_item4: number;
  new_item5: number;
  new_item6: number;
  numDeaths: number;
  openid: string;
  original_area_id: string;
  original_lol_id: string;
  original_puu_id: string;
  originchampionId: number;
  pentaKills: number;
  perkStyle: number;
  perkSubStyle: number;
  physicalDamageDealtPlayer: number;
  physicalDamageTaken: number;
  physicalDamageToChampions: number;
  playerAugment1: number;
  playerAugment2: number;
  playerAugment3: number;
  playerAugment4: number;
  playerAugment5: number;
  playerAugment6: number;
  playerSubteam: string;
  playerSubteamPlacement: string;
  position: string;
  puuId: string;
  pveCategoryStrawberryBoonJsonString: string;
  quadraKills: number;
  sightWardsBoughtInGame: number;
  skinIndex: number;
  skinInfoFor2V2Json: string;
  spell1Cast: number;
  spell2Cast: number;
  spell3Cast: number;
  spell4Cast: number;
  summonSpell1Cast: number;
  summonSpell1Id: number;
  summonSpell2Cast: number;
  summonSpell2Id: number;
  teamId: string;
  teamMadeSize: number;
  timeCcingOthers: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  totalDamageToChampions: number;
  totalHealth: number;
  totalHealthToMate: number;
  totalTimeSpentDead: number;
  translate_areaId: string;
  tripleKills: number;
  trueDemageToChampions: number;
  turretsKilled: number;
  uinId: string;
  unrealKills: number;
  visionScore: number;
  visionWardsBoughtInGame: number;
  wardKilled: number;
  wardPlaced: number;
  wardPlacedDetector: number;
  wardSkinIndex: number;
  wasAfk: number;
  win: string;
}

interface TeamDetails {
  banInfoList: any[];
  isSurrender: number;
  teamId: string;
  totalAssists: number;
  totalBaronKills: number;
  totalBaseKilled: number;
  totalDampenKilled: number;
  totalDeaths: number;
  totalDragonKills: number;
  totalGoldEarned: number;
  totalKills: number;
  totalTurretsKilled: number;
  win: string;
}

export interface BattleDetail {
  area_id: string;
  game_id: string;
  game_start_time: string;
  game_time_played: number;
  map_id: number;
  game_queue_id: number;
  game_mode: string;
  game_type: string;
  platform_id: string;
  was_early_surrender: number;
  play_gt25_mask: number;
  game_server_version: string;
  team_details: TeamDetails[];
  player_details: PlayerDetails[];
  strawbery_loadout_item: string;
  gameCustomizationObjects: string;
  diffculty: number;
}

export interface TgpGame {
  result: TgpResult;
  battle_detail: BattleDetail;
}

export interface TgpResult {
  error_code: number;
  error_message: string;
}

export interface Player {
  openid: string;
  area: number;
  icon_id: number;
  level: number;
  tier: number;
  queue: number;
  tag_num: number;
}

export interface TgpPlayers {
  result: TgpResult;
  players: Player[];
}

export interface Battle {
  game_id: string;
  game_start_time: string;
  game_time_played: number;
  map_id: number;
  game_queue_id: number;
  was_mvp: number;
  was_svp: number;
  was_early_surrender: number;
  play_gt25_mask: number;
  game_server_version: string;
  champion_id: number;
  position: string;
  skin_index: number;
  game_score: number;
  team_id: string;
  win: string;
  kills: number;
  deaths: number;
  assists: number;
  gold_earned: number;
  was_surrender: number;
  was_afk: number;
  most_kills: number;
  most_assists: number;
  most_minions_killed: number;
  most_gold_earned: number;
  most_damage_dealt_to_champions: number;
  most_total_damage_taken: number;
  most_turrets_killed: number;
  double_kills: number;
  triple_kills: number;
  quadra_kills: number;
  penta_kills: number;
  unreal_kills: number;
  game_level: string;
  win_with_less_teammate: number;
  team_made_size: number;
  battle_type: number;
  player_subteam: string;
  player_subteam_placement: string;
}

export interface TgpBattles {
  result: TgpResult;
  battles: Battle[];
}
