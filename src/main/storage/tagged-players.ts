import { Equal } from 'typeorm'

import { onCall } from '../core/common'
import { dataSource } from '../db'
import { TaggedPlayer } from '../db/entities/TaggedPlayer'

interface SavePlayerDto {
  id: number
  side: 'teammate' | 'opponent'
  tag: string
  summonerInfo: any // json
  relatedGameId: number
}

export async function initTaggedPlayersStorage() {
  /**
   * 温故而知新
   */
  onCall('storage:saveTaggedPlayer', async (_e, player: SavePlayerDto) => {
    if (!Object.keys(player)) {
      return false
    }

    const record = await dataSource.manager.findOneBy(TaggedPlayer, { id: Equal(player.id) })
    if (record) {
      const updateObj: any = {}

      // 注意是单数形式
      if (player.relatedGameId) {
        const gameIds = record.relatedGameIds as number[]

        if (!gameIds.includes(player.relatedGameId)) {
          // 限制大小在 100 场对局
          // 考虑到一直和好友匹配
          if (gameIds.length >= 100) {
            gameIds.shift()
          }
          gameIds.push(player.relatedGameId)
        }

        updateObj.relatedGameIds = gameIds
        updateObj.lastMet = new Date()
      }

      const r = await dataSource.manager.update(
        TaggedPlayer,
        { id: player.id },
        {
          summonerInfo: player.summonerInfo,
          tag: player.tag,
          updateAt: new Date(),
          ...updateObj
        }
      )
      return r.affected && r.affected > 0
    }

    const taggedPlayer = new TaggedPlayer()
    taggedPlayer.id = player.id
    taggedPlayer.tag = player.tag
    taggedPlayer.side = player.side
    taggedPlayer.summonerInfo = player.summonerInfo
    taggedPlayer.relatedGameIds = [player.relatedGameId]
    taggedPlayer.updateAt = new Date()
    taggedPlayer.lastMet = new Date()
    const r = await dataSource.manager.insert(TaggedPlayer, taggedPlayer)

    return r.identifiers.length > 0
  })

  /**
   * 人满为患，需要清除一部分
   */
  onCall('storage:deleteTaggedPlayer', async (_e, id) => {
    if (
      await dataSource.manager.exists(TaggedPlayer, {
        where: {
          id: Equal(id)
        }
      })
    ) {
      return false
    }

    const result = await dataSource.manager.delete(TaggedPlayer, { id })

    return result.affected && result.affected > 0
  })

  /**
   * 起码有迹可循
   */
  onCall('storage:getTaggedPlayer', async (_e, id) => {
    return await dataSource.manager.findOneBy(TaggedPlayer, { id: Equal(id) })
  })
}
