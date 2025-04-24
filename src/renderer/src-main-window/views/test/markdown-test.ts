import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { computed } from 'vue'

const textZh = `# ✨《Rabi 与 Ribi の异世界大混乱》✨

## 🌀 第一章：突如其来的传送门事故

「Ribi ちゃん！快看这个奇怪的按钮！」<div style="text-align:center"><button disabled>DO NOT PRESS</button></div>

> **Ribi 推了推反光的眼镜**："Rabi 你这个笨蛋！这种明显写着【不要按】的按钮不就是专门用来按的吗？！"

突然**整个实验室开始剧烈震动**，一个彩虹色的传送门将两人吞噬！

---

### 🛸 穿越后的初始装备清单

- [x] 兔耳发卡（耐久度：∞）
- [x] 魔法棒棒糖 ×3
- [ ] 正常人的常识
- [ ] 物理法则遵守手册

![装备示意图](https://placehold.co/600x400?text=Rabbit+Girl+Arsenal)

---

## 🤯 第二章：魔王城の下午茶时间

两人掉进了魔王城的点心仓库，此时属性面板突然弹出：

| 角色 | HP  | MP  | 特殊技能     |
| ---- | --- | --- | ------------ |
| Rabi | ??? | 999 | 呆毛能量炮   |
| Ribi | 1   | 1   | 绝对逻辑破解 |

\`\`\`python
while True:
    print("魔王の曲奇饼×" + str(random.randint(100,999)))
\`\`\`

突然警报大作！<mark>守卫机械龙</mark>破墙而入：

> 「检测到非法甜品摄入！启动<u>强制甜蜜净化程序</u>！」

---

## 🎮 战斗阶段！代码对决

Ribi 快速敲击虚空键盘：

\`\`\`javascript
const attack = () => {
  let damage = Math.random() * 100 + '🍰'
  console.log(\`Ribi发动【蛋糕溢出攻击】造成 \${damage} 点伤害！\`)
}
\`\`\`

Rabi 则摆出经典 pose：
![战斗画面](https://placehold.co/800x600?text=Magical+Girl+Transformation)

---

## 🎉 结局：世界线收束

经过~~完全不符合物理法则~~的战斗，两人发现：

1. 魔王其实是
   - 平行世界的
     - 奶茶成精的
       - 自家班主任

最终 BOSS 战以<ruby>奶茶<rt>ミルクティー</rt></ruby>洪流淹没整个大陆告终...

---

<blockquote style="color: #ff69b4">
<h3>📢 系统公告</h3>
由于主要角色<a href="javascript:void(0)">Rabi</a>和<a href="javascript:void(0)">Ribi</a>的乱入<br>
本季动画提前完结，<del>续篇制作决定</del>
</blockquote>

###### 本故事最终解释权归 <kbd>世界意志</kbd> 所有`

const textEn = `# ✨《Rabi and Ribi's Chaotic Isekai Adventure》✨

## 🌀 Chapter 1: The Sudden Portal Accident

"Ribi-chan! Look at this weird button!"

<div style="text-align:center"><button disabled>DO NOT PRESS</button></div>

> **Ribi adjusted her shiny glasses**: "Rabi, you idiot! A button that says 'DO NOT PRESS' is obviously meant to be pressed!!"

Suddenly, **the entire lab began to shake violently**, and a rainbow-colored portal swallowed them both!

---

### 🛸 Initial Equipment List After the Warp

- [x] Bunny Ear Hairpin (Durability: ∞)
- [x] Magical Lollipops ×3
- [ ] Common Sense of a Normal Person
- [ ] Manual of Physical Law Compliance

![Equipment Illustration](https://placehold.co/600x400?text=Rabbit+Girl+Arsenal)

---

## 🤯 Chapter 2: Afternoon Tea at the Demon King's Castle

The two fell into the Demon King's snack storage. Suddenly, a status panel popped up:

| Character | HP  | MP  | Special Skill        |
| --------- | --- | --- | -------------------- |
| Rabi      | ??? | 999 | Ahoge Energy Cannon  |
| Ribi      | 1   | 1   | Absolute Logic Break |

\`\`\`python
while True:
    print("Demon King's Cookies ×" + str(random.randint(100,999)))
\`\`\`

Suddenly, alarms blared! <mark>Guardian Mecha Dragon</mark> burst through the wall:

> "Unauthorized dessert intake detected! Initiating <u>Sweetness Purification Protocol</u>!"

---

## 🎮 Battle Phase! Code Showdown

Ribi rapidly tapped the void keyboard:

\`\`\`javascript
const attack = () => {
  let damage = Math.random() * 100 + '🍰'
  console.log(\`Ribi launched [Cake Overflow Attack] dealing \${damage} damage!\`)
}
\`\`\`

Rabi struck a classic pose:
![Battle Scene](https://placehold.co/800x600?text=Magical+Girl+Transformation)

---

## 🎉 Ending: Worldline Convergence

After a ~~completely physically inaccurate~~ battle, they discovered:

1. The Demon King was actually
   - a milk tea spirit
     - from a parallel universe
       - who also happened to be their homeroom teacher

The final boss battle ended as a <ruby>Milk Tea<rt>ミルクティー</rt></ruby> flood engulfed the entire continent...

---

<blockquote style="color: #ff69b4">
<h3>📢 System Announcement</h3>
Due to the unauthorized involvement of <a href="javascript:void(0)">Rabi</a> and <a href="javascript:void(0)">Ribi</a>,<br>
this season’s anime ends prematurely. <del>Sequel in production</del>
</blockquote>

###### Final interpretation rights reserved by <kbd>World Will</kbd>`

export function useMarkdownTest() {
  const ap = useAppCommonStore()

  return computed(() => {
    if (ap.settings.locale === 'zh-cn') {
      return textZh
    } else if (ap.settings.locale === 'en') {
      return textEn
    }

    return textZh
  })
}
