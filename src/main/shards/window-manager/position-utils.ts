import { BrowserWindow, Display, Rectangle, screen } from 'electron'

export function rectsIntersect(rect1: Rectangle, rect2: Rectangle) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  )
}

export function rectDistance(rect1: Rectangle, rect2: Rectangle) {
  let dx = 0
  let dy = 0

  if (rect1.x > rect2.x + rect2.width) {
    dx = rect1.x - (rect2.x + rect2.width)
  } else if (rect2.x > rect1.x + rect1.width) {
    dx = rect2.x - (rect1.x + rect1.width)
  }

  if (rect1.y > rect2.y + rect2.height) {
    dy = rect1.y - (rect2.y + rect2.height)
  } else if (rect2.y > rect1.y + rect1.height) {
    dy = rect2.y - (rect1.y + rect1.height)
  }

  return Math.sqrt(dx * dx + dy * dy)
}

export function repositionWindowIfInvisible(win: BrowserWindow) {
  if (!win || win.isDestroyed()) return

  const winBounds = win.getBounds()
  // 如果窗口至少部分可见，则不做处理
  if (isWindowPartiallyVisible(win)) {
    return
  }

  const displays = screen.getAllDisplays()
  let nearestDisplay: Display | null = null
  let minDistance = Infinity

  // 找到与窗口矩形距离最近的显示器工作区
  for (const display of displays) {
    const distance = rectDistance(winBounds, display.workArea)
    if (distance < minDistance) {
      minDistance = distance
      nearestDisplay = display
    }
  }

  if (!nearestDisplay) return

  const workArea = nearestDisplay.workArea
  let newX = winBounds.x
  let newY = winBounds.y

  // 调整 x 坐标：
  // 如果窗口宽度小于显示区域宽度，则保证窗口水平完整显示
  if (winBounds.width <= workArea.width) {
    // 如果窗口左侧在显示区域左边之外，则移动到 workArea.x
    // 如果窗口右侧超出显示区域，则将 x 移动到 workArea.x + workArea.width - winBounds.width
    newX = Math.min(
      Math.max(winBounds.x, workArea.x),
      workArea.x + workArea.width - winBounds.width
    )
  } else {
    // 如果窗口比工作区宽，则直接左对齐
    newX = workArea.x
  }

  // 同理调整 y 坐标
  if (winBounds.height <= workArea.height) {
    newY = Math.min(
      Math.max(winBounds.y, workArea.y),
      workArea.y + workArea.height - winBounds.height
    )
  } else {
    newY = workArea.y
  }

  // 移动窗口到新的位置
  win.setPosition(newX, newY)
}

export function intersectionArea(rect1: Rectangle, rect2: Rectangle) {
  const xOverlap = Math.max(
    0,
    Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x)
  )
  const yOverlap = Math.max(
    0,
    Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y)
  )
  return xOverlap * yOverlap
}

export function repositionWindowWithSnap(win: BrowserWindow, targetBounds: Rectangle) {
  if (!win || win.isDestroyed()) return

  // 获取当前窗口的尺寸信息
  const winBounds = win.getBounds()

  // 找到目标窗口所在的显示器
  const display = screen.getDisplayMatching(targetBounds)
  const workArea = display.workArea

  // 尽量保持上边沿与目标窗口对齐
  let newY = targetBounds.y

  // 当前窗口中心点位于目标窗口的左侧还是右侧
  const winCenterX = winBounds.x + winBounds.width / 2
  const targetCenterX = targetBounds.x + targetBounds.width / 2
  let newX: number
  if (winCenterX < targetCenterX) {
    // 当前窗口在目标窗口左侧，尝试将窗口右边与目标窗口左边对齐
    newX = targetBounds.x - winBounds.width
  } else {
    // 当前窗口在目标窗口右侧，尝试将窗口左边与目标窗口右边对齐
    newX = targetBounds.x + targetBounds.width
  }

  // 调整 newX 和 newY，确保窗口完全处于显示区域内
  if (newX < workArea.x) {
    // 如果 newX 超出左侧，则调整为最左边
    newX = workArea.x
  } else if (newX + winBounds.width > workArea.x + workArea.width) {
    // 如果右侧超出，则向左平移
    newX = workArea.x + workArea.width - winBounds.width
  }

  // 对垂直位置同样做调整
  if (newY < workArea.y) {
    newY = workArea.y
  } else if (newY + winBounds.height > workArea.y + workArea.height) {
    newY = workArea.y + workArea.height - winBounds.height
  }

  win.setPosition(newX, newY)
}

export function isWindowPartiallyVisible(win: BrowserWindow, threshold = 0.98) {
  if (!win || win.isDestroyed()) return false

  const winBounds = win.getBounds()
  const winArea = winBounds.width * winBounds.height
  const displays = screen.getAllDisplays()

  let visibleArea = 0
  // 累加窗口与各显示器工作区相交的面积
  for (const display of displays) {
    visibleArea += intersectionArea(winBounds, display.workArea)
  }

  const visibleFraction = winArea > 0 ? visibleArea / winArea : 0
  return visibleFraction >= threshold
}

export function getCenteredRectangle(width: number, height: number) {
  let { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  let x = Math.round((screenWidth - width) / 2)
  let y = Math.round((screenHeight - height) / 2)

  return { x, y, width, height }
}
