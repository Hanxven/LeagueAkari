import { GameDataState } from '@main/shards/league-client/lc-state/game-data'
import { OngoingGameSettings, OngoingGameState } from '@main/shards/ongoing-game/state'

export interface TemplateEnv {
  /**
   * 用户决定发送哪些玩家
   */
  target: 'ally' | 'enemy' | 'all'

  /**
   * i18n 支持？不存在的
   *
   * 不过必须得有
   */
  locale: string

  /**
   * 一些工具方法
   */
  utils: {
    /**
     * 判断是否为人机对局
     */
    isBotQueue: (queueId: number) => boolean

    /**
     * 判断是否为 PvE 对局（无尽狂潮）
     */
    isPveQueue: (queueId: number) => boolean
  }

  /**
   * 当前登录大区的 sgpServerId，该字段为本项目中为了区分大区的二次封装，每个大区有唯一的 sgpServerId
   */
  sgpServerId: string

  /**
   * 当前登录大区的 region
   */
  region: string

  /**
   * 当前登录大区的 rsoPlatformId，当前仅限腾讯服务器有此字段
   */
  rsoPlatformId: string

  /**
   * 自己的 puuid
   */
  selfPuuid: string

  /**
   * 自己的队伍 id。teamId 并非对应 LCU 的 teamId，而是本项目中为了区分阵营的二次封装
   */
  selfTeamId: string

  /**
   * 所有友方成员的 puuid
   */
  allyMembers: string[]

  /**
   * 所有敌方成员的 puuid
   */
  enemyMembers: string[]

  /**
   * 所有成员的 puuid
   */
  allMembers: string[]

  /**
   * 用户决定发送哪些玩家的内容，它的内容通过 target 决定
   */
  targetMembers: string[]

  /**
   * 已加载的游戏资源
   */
  gameData: GameDataState

  /**
   * Ongoing Game 模块的设置项
   */
  settings: OngoingGameSettings

  /**
   * key: teamId (标记队伍), value: string[] (队伍成员的puuid)
   *
   * 这些 puuid 不包括匿名的成员。另外，teamId 并非对应 LCU 的 teamId，而是本项目中为了区分阵营的二次封装
   */
  teams: OngoingGameState['teams']

  /**
   * 一个 map，key 为 puuid，记录了每名玩家的战绩。这些战绩的加载数据源、加载数量和游戏模式的设置都可在 OngoingGameSettings 中找到
   */
  matchHistory: OngoingGameState['matchHistory']

  /**
   * 一个 map，key 为 puuid。记录了每名玩家的召唤师信息。
   */
  summoner: OngoingGameState['summoner']

  /**
   * 一个 map，key 为 puuid。记录了每名玩家的排位信息
   */
  rankedStats: OngoingGameState['rankedStats']

  /**
   * 一个 map，key 为 puuid。记录了每名玩家数据库保存的召唤师信息
   */
  savedInfo: OngoingGameState['savedInfo']

  /**
   * 一个 map，key 为 puuid。记录了每名玩家的位置分配信息
   */
  positionAssignments: OngoingGameState['positionAssignments']

  /**
   * 当前位于的查询阶段。包含一些游戏的基础信息
   */
  queryStage: OngoingGameState['queryStage']

  /**
   * 一个 map，key 为 puuid。记录了每名玩家的英雄熟练度信息。
   */
  championMastery: OngoingGameState['championMastery']

  /**
   * 一个 map，key 为 puuid。记录了每名玩家的英雄选择信息，值为英雄 id
   */
  championSelections: OngoingGameState['championSelections']

  /**
   * 一个 map，key 为 puuid。记录了自动计算后的玩家数据统计
   */
  playerStats: OngoingGameState['playerStats']

  /**
   * 一个 map，key 为 puuid。记录了部分对局的游戏时间线信息（是前 N 场，具体设置项可在 OngoingGameSettings 中找到）
   */
  gameTimeline: OngoingGameState['gameTimeline']

  /**
   * 一个 map，key 为 teamId。记录了基于推断的预组队信息，不是很准
   */
  inferredPremadeTeams: OngoingGameState['inferredPremadeTeams']

  /**
   * 一个 map，key 为 teamParticipantId。由 LCU 标记了每个阵营的组队情况，可以精准判断预组队情况
   */
  teamParticipantGroups: OngoingGameState['teamParticipantGroups']

  /**
   * 一个 map，key 为 gameId。记录了一些由于特殊原因额外加载的对局。一个例子是遇到了熟人，会自动加载和此人相关的历史对局
   */
  additionalGame: OngoingGameState['additionalGame']
}
