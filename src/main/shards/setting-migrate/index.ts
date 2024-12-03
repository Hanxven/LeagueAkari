import { IAkariShardInitDispose } from '@shared/akari-shard/interface'
import { Equal } from 'typeorm'

import { AkariLogger } from '../logger-factory'
import { StorageMain } from '../storage'
import { Setting } from '../storage/entities/Settings'

/**
 * 将旧的设置项重新设置, 并设置数据
 */
export class SettingMigrateMain implements IAkariShardInitDispose {
  static id = 'setting-migrate-main'

  // 引入涉及到的模块的对应依赖, 以保证其在加载其他模块之前完成迁移操作
  static dependencies = [
    'storage-main',
    'logger-factory-main',
    'league-client-main',
    'riot-client-main',
    'game-client-main',
    'self-update-main',
    'ongoing-game-main',
    'league-client-ux-main',
    'respawn-timer-main',
    'auto-reply-main',
    'auto-select-main',
    'auto-gameflow-main',
    'window-manager-main'
  ]

  static MIGRATION_FROM_126 = 'akari-migration-from-1.2.6'

  private readonly _st: StorageMain
  private readonly _log: AkariLogger

  // no need to keep the references
  // private readonly _leagueClient: LeagueClientMain
  // private readonly _riotClient: RiotClientMain
  // private readonly _gameClient: GameClientMain
  // private readonly _selfUpdate: SelfUpdateMain
  // private readonly _ongoingGame: OngoingGameMain
  // private readonly _leagueClientUx: LeagueClientUxMain
  // private readonly _windowManager: WindowManagerMain
  // private readonly _respawnTimer: RespawnTimerMain
  // private readonly _autoReply: AutoReplyMain
  // private readonly _autoSelect: AutoSelectMain
  // private readonly _autoGameflow: AutoGameflowMain

  constructor(deps: any) {
    this._st = deps['storage-main']
    this._log = deps['logger-factory-main'].create(SettingMigrateMain.id)

    this._printDeps(deps)
  }

  private _printDeps(deps: any) {
    const shards = Object.entries(deps).map(([key, _value]) => key)
    return `预先加载: [${shards.join(', ')}]`
  }

  private async _do(from: string, to: string) {
    const s = await this._st.dataSource.manager.findOneBy(Setting, { key: Equal(from) })

    if (!s) {
      return
    }

    this._log.info(`迁移设置项: ${from} -> ${to}`)

    await this._st.dataSource.manager.save(Setting.create(to, s.value))
    await this._st.dataSource.manager.remove(s)
  }

  // NOTE: drop support before League Akari 1.1.x
  private async _migrate() {
    // const isMigratedSymbol = await this._st.dataSource.manager.findOneBy(Setting, {
    //   key: Equal(SettingMigrateMain.MIGRATION_130)
    // })
    // if (isMigratedSymbol) {
    //   return
    // }
    // 原 app finish
    // await this._do('app/useWmic', 'league-client-ux-main/useWmic')
    // await this._do('app/closeStrategy', 'window-manager-main/mainWindowCloseAction')
    // await this._do('app/showFreeSoftwareDeclaration', 'app-common-main/showFreeSoftwareDeclaration')
    // await this._do('app/isInKyokoMode', 'app-common-main/isInKyokoMode')
    // 原 lcu-connection
    // await this._do('lcu-connection/autoConnect', 'league-client-main/autoConnect')
    // await this._storage.dataSource.manager.save(
    //   Setting.create(SettingMigrateMain.MIGRATION_125, true)
    // )
  }

  async onInit() {
    await this._migrate()
  }
}
