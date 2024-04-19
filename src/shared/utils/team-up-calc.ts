type Edge = {
  to: number
  weight: number
  ids: Set<string>
}

type ResultType = { players: number[]; times: number; ids: Set<string> }

/**
 * 用于高效分析预组队情况的图结构
 */
export class TeamUpGraph {
  private adjacencyList: Map<number, Map<number, Edge>>

  constructor() {
    this.adjacencyList = new Map()
  }

  addVertex(vertex: number): void {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, new Map())
    }
  }

  addEdge(vertex1: number, vertex2: number, id: string): void {
    this.addVertex(vertex1)
    this.addVertex(vertex2)

    let list1 = this.adjacencyList.get(vertex1) || new Map()
    let list2 = this.adjacencyList.get(vertex2) || new Map()

    let edge1 = list1.get(vertex2)
    if (edge1) {
      edge1.weight++
      edge1.ids.add(id)
    } else {
      list1.set(vertex2, { to: vertex2, weight: 1, ids: new Set([id]) })
    }

    let edge2 = list2.get(vertex1)
    if (edge2) {
      edge2.weight++
      edge2.ids.add(id)
    } else {
      list2.set(vertex1, { to: vertex1, weight: 1, ids: new Set([id]) })
    }
  }

  getTogetherTimes(playersGroups: number[][]): ResultType[] {
    const results: ResultType[] = []

    for (let players of playersGroups) {
      let count = Infinity
      let ids: Set<string>

      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          const adjacencyMap = this.adjacencyList.get(players[i])
          if (!adjacencyMap) {
            count = 0
            break
          }

          const edge = adjacencyMap.get(players[j])
          if (!edge) {
            count = 0
            break
          }

          if (edge.weight < count) {
            ids = edge.ids
            count = edge.weight
          }
        }
        if (count === 0) break
      }

      results.push({ players, times: count, ids: ids! })
    }

    return results
  }
}

export function combinations(nums: number[]): number[][] {
  const res: number[][] = []
  _backtrack(nums, [], 0, res)
  return res
}

function _backtrack(nums: number[], current: number[], start: number, res: number[][]): void {
  res.push([...current])

  for (let i = start; i < nums.length; i++) {
    current.push(nums[i])
    _backtrack(nums, current, i + 1, res)
    current.pop()
  }
}

/**
 * 注意：健壮性和 BUG 未完全测试
 * @param matches 包含了若干对局的召唤师 ID 列表
 * @param players 需要计算的玩家列表，时间复杂度很高，所以要尽可能少
 * @param threshold 阈值，多少重复场次即过滤
 * @returns
 */
export function calculateTogetherTimes(
  matches: {
    players: number[]
    id: string
  }[],
  players: number[],
  threshold = 3
): Array<{ players: number[]; times: number; ids: string[] }> {
  const graph = new TeamUpGraph()
  const set = new Set(players)
  matches
    .map((m) => ({
      players: m.players.filter((mm) => set.has(mm)),
      id: m.id
    }))
    .forEach((m) => {
      for (let i = 0; i < m.players.length - 1; i++) {
        for (let j = i + 1; j < m.players.length; j++) {
          graph.addEdge(m.players[i], m.players[j], m.id)
        }
      }
    })

  const result = graph
    .getTogetherTimes(combinations(players).filter((a) => a.length > 1))
    .filter((t) => t.times >= threshold)

  const map = new Map<string, ResultType>()

  for (const r of result) {
    const key = toSetKey(r.ids)

    if (map.has(key)) {
      const item = map.get(key)!
      if (
        r.players.length > item.players.length &&
        isSuperset(new Set(r.players), new Set(item.players))
      ) {
        item.players = r.players
      }
    } else {
      map.set(key, r)
    }
  }

  return Array.from(map.values()).map((v) => ({
    ids: Array.from(v.ids),
    players: v.players,
    times: v.times
  }))
}

function toSetKey(set: Set<string>) {
  return Array.from(set.values()).sort().join('|')
}

function isSuperset(set: Set<number>, subset: Set<number>) {
  if (subset.size > set.size) {
    return false
  }

  for (const elem of subset.values()) {
    if (!set.has(elem)) {
      return false
    }
  }

  return true
}

export function removeSubsets<T>(objects: T[], getter: (element: T) => (number | string)[]): T[] {
  const sets = objects.map((obj) => new Set(getter(obj)))

  return objects.filter((_object, index) => {
    const currentSet = sets[index]

    return !sets.some((otherSet, otherIndex) => {
      if (index === otherIndex || otherSet.size < currentSet.size) {
        return false
      }

      return Array.from(currentSet).every((element) => otherSet.has(element))
    })
  })
}
