export const enum RadixMatcherNodeType {
  NORMAL = 0,
  PLACEHOLDER = 1,
  WILDCARD = 2
}

export interface FindResult {
  data: any
  params?: Record<string, any>
}

export class RadixMatcherNode {
  constructor(
    public type: RadixMatcherNodeType = RadixMatcherNodeType.NORMAL,
    public parent: RadixMatcherNode | null = null,
    public data: any = null,
    public normalNodes = new Map<string, RadixMatcherNode>(),
    public wildcardNode: RadixMatcherNode | null = null,
    public placeholderNodes = new Map<string, RadixMatcherNode>()
  ) {}

  static inferNodeType(node: string): RadixMatcherNodeType {
    if (node.startsWith('**')) {
      return RadixMatcherNodeType.WILDCARD
    }
    if (node[0] === ':' || node === '*') {
      return RadixMatcherNodeType.PLACEHOLDER
    }

    return RadixMatcherNodeType.NORMAL
  }
}

/**
 * 为了高效订阅 LCU 事件，编写的数据结构。
 * 支持动态的 URI 格式。
 * ```
 * const path1 = `/kagami-chan/:name/hiiragi` // 使用动态占位符
 * const path2 = `/kagami-chan/kona-chan/hiiragi` // 静态 URI
 * const path3 = `/kagami-chan/:name/hiiragi/**` // 通配符，匹配任何以其开头的 URI，不限长度
 * const path4 = `/kagami-chan/tsukasa/*` // 匿名占位符，和动态占位符相同，但只会用 _${number} 来存储参数
 * const path4 = `/**` // 监听所有
 * ```
 */
export class RadixMatcher {
  private _root = new RadixMatcherNode(RadixMatcherNodeType.NORMAL)
  private _staticRouteMap = new Map<string, any>()

  static validateRoute(route: string) {
    const parts = route.split('/').filter(Boolean)

    if (parts.length === 0) {
      throw new Error('route should not be empty')
    }

    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith(':')) {
        if (parts[i].length === 1) {
          throw new Error('placeholder should have a name')
        }
      } else if (parts[i].startsWith('**')) {
        if (parts[i].length !== 2) {
          throw new Error('wildcard should be **')
        }
        if (i !== parts.length - 1) {
          throw new Error('wildcard should be the last part')
        }
      } else if (parts[i].startsWith('*')) {
        if (parts[i].length !== 1) {
          throw new Error('placeholder * should be the only part')
        }
      } else {
        // normal nodes
        if (parts[i].includes(':') || parts[i].includes('*')) {
          throw new Error('normal nodes should not have : or *')
        }
      }
    }
  }

  private _maybeDynamicRoute(route: string): boolean {
    return route.includes('*') || route.includes(':')
  }

  private _findDynamicRouteNode(route: string): RadixMatcherNode | undefined {
    const parts = route.split('/').filter(Boolean)

    let node = this._root
    let unnamedCount = 0

    let i = 0
    for (; i < parts.length; i++) {
      const type = RadixMatcherNode.inferNodeType(parts[i])
      if (type === RadixMatcherNodeType.NORMAL) {
        const childNode = node.normalNodes.get(parts[i])
        if (childNode) {
          node = childNode
        } else {
          break
        }
      } else if (type === RadixMatcherNodeType.PLACEHOLDER) {
        let childNode: RadixMatcherNode | undefined
        if (parts[i] === '*') {
          childNode = node.placeholderNodes.get(`_${unnamedCount++}`)
        } else {
          childNode = node.placeholderNodes.get(parts[i].slice(1))
        }
        if (childNode) {
          node = childNode
        } else {
          break
        }
      } else if (type === RadixMatcherNodeType.WILDCARD) {
        if (node.wildcardNode) {
          node = node.wildcardNode
        }
        break
      }
    }

    if ((i !== parts.length && node.type !== RadixMatcherNodeType.WILDCARD) || !node.data) {
      return undefined
    }

    return node
  }

  insert(route: string, data: any) {
    if (data === undefined || data == null) {
      throw new Error('data should not be undefined or null')
    }

    RadixMatcher.validateRoute(route)

    if (!this._maybeDynamicRoute(route)) {
      this._staticRouteMap.set(route, data)
      return
    }

    const parts = route.split('/').filter(Boolean)

    let node = this._root
    let nextUnnamedPartCount = 0

    for (let i = 0; i < parts.length; i++) {
      const type = RadixMatcherNode.inferNodeType(parts[i])
      if (type === RadixMatcherNodeType.NORMAL) {
        const childNode = node.normalNodes.get(parts[i])
        if (childNode) {
          node = childNode
        } else {
          const newNode = new RadixMatcherNode(type, node)
          node.normalNodes.set(parts[i], newNode)
          node = newNode
        }
      } else if (type === RadixMatcherNodeType.PLACEHOLDER) {
        let childNode: RadixMatcherNode | undefined
        if (parts[i] === '*') {
          childNode = node.placeholderNodes.get(`_${nextUnnamedPartCount}`)
        } else {
          childNode = node.placeholderNodes.get(parts[i].slice(1))
        }
        if (childNode) {
          nextUnnamedPartCount++
          node = childNode
        } else {
          const newNode = new RadixMatcherNode(type, node)
          if (parts[i] === '*') {
            node.placeholderNodes.set(`_${nextUnnamedPartCount++}`, newNode)
          } else {
            node.placeholderNodes.set(parts[i].slice(1), newNode)
          }
          node = newNode
        }
      } else if (type === RadixMatcherNodeType.WILDCARD) {
        const newNode = new RadixMatcherNode(type, node)
        node.wildcardNode = newNode
        node.data = data
        node = newNode
      }
    }

    if (node.data) {
      throw new Error(`route '${route}' already exists`)
    }

    node.data = data
  }

  remove(route: string): boolean {
    if (this._staticRouteMap.has(route)) {
      this._staticRouteMap.delete(route)
      return true
    }

    const node = this._findDynamicRouteNode(route)
    if (!node || node.data === null) {
      return false
    }

    node.data = null

    if (node.normalNodes.size > 0 || node.placeholderNodes.size > 0 || node.wildcardNode) {
      return true
    }

    let current = node
    while (current.parent) {
      const parent = current.parent

      if (current.type === RadixMatcherNodeType.NORMAL) {
        for (const [key, child] of parent.normalNodes.entries()) {
          if (child === current) {
            parent.normalNodes.delete(key)
            break
          }
        }
      } else if (current.type === RadixMatcherNodeType.PLACEHOLDER) {
        for (const [key, child] of parent.placeholderNodes.entries()) {
          if (child === current) {
            parent.placeholderNodes.delete(key)
            break
          }
        }
      } else if (current.type === RadixMatcherNodeType.WILDCARD) {
        if (parent.wildcardNode === current) {
          parent.wildcardNode = null
        }
      }

      if (
        parent.data !== null ||
        parent.normalNodes.size > 0 ||
        parent.placeholderNodes.size > 0 ||
        parent.wildcardNode
      ) {
        break
      }

      current = parent
    }

    return true
  }

  getRouteData(route: string): Omit<FindResult, 'params'> | undefined {
    if (this._staticRouteMap.has(route)) {
      return {
        data: this._staticRouteMap.get(route)!
      }
    }

    const node = this._findDynamicRouteNode(route)
    if (node) {
      return {
        data: node.data
      }
    }
    return undefined
  }

  private _findDynamic(
    node: RadixMatcherNode,
    parts: string[],
    index: number,
    result: FindResult[],
    params: [string, string][],
    onlyOne: boolean = false
  ) {
    if (onlyOne && result.length > 0) {
      return
    }

    // 如果当前节点有通配符节点，并且还未处理完所有部分，则匹配剩余所有部分
    if (node.wildcardNode && index < parts.length) {
      result.push({
        data: node.data,
        params: {
          __: parts.slice(index).join('/'),
          ...Object.fromEntries(params)
        }
      })
    }

    // 如果已处理完所有部分，且当前节点存在数据，则收集匹配结果
    if (index === parts.length) {
      if (node.data) {
        result.push({
          data: node.data,
          params: Object.fromEntries(params)
        })
      }
      return
    }

    const part = parts[index]

    const normalNode = node.normalNodes.get(part)
    if (normalNode) {
      this._findDynamic(normalNode, parts, index + 1, result, params, onlyOne)
    }

    if (node.placeholderNodes.size) {
      for (const [key, childNode] of node.placeholderNodes) {
        params.push([key, part])
        this._findDynamic(childNode, parts, index + 1, result, params, onlyOne)
        params.pop()
      }
    }
  }

  findOne(path: string): FindResult | undefined {
    if (this._staticRouteMap.has(path)) {
      return {
        data: this._staticRouteMap.get(path)!
      }
    }

    const parts = path.split('/').filter(Boolean)
    const result: FindResult[] = []
    this._findDynamic(this._root, parts, 0, result, [], true)
    return result[0]
  }

  findAll(path: string): FindResult[] {
    const parts = path.split('/').filter(Boolean)
    const result: FindResult[] = []

    if (this._staticRouteMap.has(path)) {
      result.push({
        data: this._staticRouteMap.get(path)!
      })
    }

    this._findDynamic(this._root, parts, 0, result, [])

    return result
  }

  clear() {
    this._root = new RadixMatcherNode(RadixMatcherNodeType.NORMAL)
    this._staticRouteMap.clear()
  }
}
