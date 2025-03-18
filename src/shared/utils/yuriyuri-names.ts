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
    '友子 ',
    '千鹤',
    '抚子',
    '花子',
    '枫',
    '奈奈',
    '真理'
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
    'Mari'
  ]
} as const

export function getNameFromYuriyuri(index: number, locale: string): string | undefined {
  return (NAMES[locale] || NAMES.en)[index]
}
