const NAMES = {
  'zh-CN': [
    '灯里',
    '京子',
    '结衣',
    '千夏',
    '绫乃',
    '千岁',
    '樱子',
    '向日葵',
    '理世',
    '茜',
    '友子',
    '千鹤',
    '抚子',
    '花子',
    '枫',
    '奈奈',
    '真理',
    '赤座',
    '岁纳',
    '船见',
    '吉川',
    '杉浦',
    '池田',
    '大室',
    '古谷',
    '松本',
    '西垣'
  ],
  en: [
    'Akari',
    'Kyoko',
    'Yui',
    'Chinatsu',
    'Ayano',
    'Chitose',
    'Sakurako',
    'Himawari',
    'Rise',
    'Akane',
    'Tomoko',
    'Chizuru',
    'Nadeshiko',
    'Hanako',
    'Kaede',
    'Nana',
    'Mari',
    'Akaza',
    'Toshino',
    'Funami',
    'Yoshikawa',
    'Sugiura',
    'Ikeda',
    'Omuro',
    'Furutani',
    'Matsumoto',
    'Nishigaki'
  ]
} as const

function mapPuuidToIndex(puuid: string, modBy: number): number {
  let mod = 0
  for (let i = 0; i < puuid.length; i++) {
    const c = puuid[i]
    if (c === '-') continue
    let digit = 0
    if (c >= '0' && c <= '9') {
      digit = c.charCodeAt(0) - 48
    } else if (c >= 'a' && c <= 'f') {
      digit = c.charCodeAt(0) - 97 + 10
    } else if (c >= 'A' && c <= 'F') {
      digit = c.charCodeAt(0) - 65 + 10
    }
    mod = (mod * 16 + digit) % modBy
  }
  return mod
}

const cachedNames = new Map<string, string[]>()
/**
 * 懒加载
 * @param locale
 */
function getNames(locale: string) {
  if (cachedNames.has(locale)) return cachedNames.get(locale)!

  const names = NAMES[locale] || NAMES.en

  // 两两组合 (可重复)
  const result: string[] = []
  for (let i = 0; i < names.length; i++) {
    for (let j = 0; j < names.length; j++) {
      // chinese name normally don't have space
      if (locale === 'zh-CN') {
        result.push(`${names[i]}${names[j]}`)
      } else {
        result.push(`${names[i]} ${names[j]}`)
      }
    }
  }

  cachedNames.set(locale, result)
  return result
}

export function getNameFromYuriyuri(puuid: string, locale: string): string {
  const names = getNames(locale)
  return names[mapPuuidToIndex(puuid, names.length)]
}
