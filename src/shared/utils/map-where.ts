const MAP_SPEC = {
  1: {
    min: { x: -650, y: -83 },
    max: { x: 14076, y: 14522 }
  },
  3: {
    min: { x: -500, y: -500 },
    max: { x: 15e3, y: 15e3 }
  },
  8: {
    min: { x: 0, y: 0 },
    max: { x: 13987, y: 13987 }
  },
  10: {
    min: { x: 0, y: 0 },
    max: { x: 15398, y: 15398 }
  },
  11: {
    min: { x: 0, y: 0 },
    max: { x: 14820, y: 14881 }
  },
  12: {
    min: { x: -28, y: -19 },
    max: { x: 12849, y: 12858 }
  },
  14: {
    min: { x: -28, y: -19 },
    max: { x: 12849, y: 12858 }
  },
  21: {
    min: { x: 0, y: 0 },
    max: { x: 15e3, y: 15e3 }
  },
  90: {
    min: { x: 0, y: 0 },
    max: { x: 14820, y: 14881 }
  }
}

/**
 * 获取这个位置是地图的哪里
 * @param mapId
 * @param x
 * @param y
 */
export function getArea(mapId: number, x: number, y: number) {
  throw new Error('Not implemented')
}

/**
 * 射线法判断点是否在多边形内部
 * @param polygon
 * @param x
 * @param y
 */
function isInside(polygon: readonly [x: number, y: number][], x: number, y: number) {
  let count = 0
  for (let i = 0; i < polygon.length; i++) {
    const [x1, y1] = polygon[i]
    const [x2, y2] = polygon[(i + 1) % polygon.length]
    if (y1 === y2) {
      continue
    }
    if (y < Math.min(y1, y2)) {
      continue
    }
    if (y >= Math.max(y1, y2)) {
      continue
    }
    const x0 = ((y - y1) * (x2 - x1)) / (y2 - y1) + x1
    if (x0 > x) {
      count++
    }
  }
  return count % 2 === 1
}
