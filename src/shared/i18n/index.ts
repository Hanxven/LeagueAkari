const chineseNumber = ['一', '二', '三', '四', '五', '六', '七', '八', '九']

export function formatI18nOrdinal(n: number, locale: string) {
  if (locale.startsWith('zh')) {
    return `第${chineseNumber[n - 1] || ' ? '}名`
  } else {
    const suffix = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0])
  }
}
