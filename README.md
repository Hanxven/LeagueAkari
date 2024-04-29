<div align="center">
  <img
    src="https://github.com/Hanxven/LeagueAkari/raw/HEAD/pictures/logo.png"
    width="128"
    height="128"
  />
</div>

# League Akari

利用 League Client Update (LCU) API 实现的工具集，功能很多。

## 战绩页面

以标签页的形式展现不同玩家的战绩。

## 自动游戏流程

这包括了自动开始匹配、自动接受对局、自动点赞和自动开始下一局四个部分。

## 核心功能

对局中队友或对手的分析。

## 自动选择和禁用

普通模式、排位模式或大乱斗模式的英雄自动选择和禁用。

## 其他功能

不多赘述，尽在探索中。

# 使用样例

包含了一些使用样例。

一图胜千言。

## 这里是战绩

查询任意一个召唤师，并进入到战绩主页。

![查询召唤师](https://github.com/Hanxven/LeagueAkari/raw/HEAD/pictures/5.gif '查询召唤师')

## 快人一步

超\~级\~快速的英雄选择。

![立即选择](https://github.com/Hanxven/LeagueAkari/raw/HEAD/pictures/2.gif '立即选择')

## 完美的流程

一切都在自动过程中。

![完全自动化](https://github.com/Hanxven/LeagueAkari/raw/HEAD/pictures/3.gif '完全自动化')

## 大乱斗标配

还在等内置 CD？我已经换了三次英雄了。

![无内置冷却](https://github.com/Hanxven/LeagueAkari/raw/HEAD/pictures/4.gif '无内置冷却')

# 更名通知

该项目的前名称为 `League-Toolkit`。由于和 Github 现有项目重名，现更名为 `LeagueAkari`。

> "Akari" 来自于《摇曳百合》的主角（?）赤座灯里（Akaza **Akari**）。

# 特殊声明

League Akari 是开源软件，所有已发行的主要版本（不包括特殊测试版本）都可由 Github 源码编译而来。

**League Akari 不会在任何平台标价出售，且作者没有在任何平台开放捐赠渠道。**

League Akari 不会上传任何玩家数据，所有的数据记录皆在本地进行。

League Akari 通过 Github 公开仓库检查版本更新。

# 关于自动符文功能

本功能即使容易实现，但由于没有稳定的公开外部数据源，开发进度会较为缓慢。

# 加入到开发过程中！

百密一疏，各种问题总是难以避免，作为使用者，您可以：

## 提个 issue！

Github Issues 是最重要的反馈渠道，请精准描述您的需求、遇到的问题或任何可行的想法。

除了 Github，另一个反馈渠道是 Bilibili 的[作者私信](https://space.bilibili.com/34532360)和[专栏评论区](https://www.bilibili.com/read/cv28654091/)。

## 加入开发！

如果您对此项目感兴趣，欢迎加入到开发之中，提交 PR，为其添加更多功能。

## 帮助推广！

对于开源作者来说，自己写的软件能被很多人使用是一件很开心的事情。

# 编译 & 构建 & 运行

包括 Electron 主程序以及 Node Addons。

## Electron 主程序

安装依赖：`yarn install`

dev：`yarn dev`

build（for Windows）: `yarn build:win`

## Node Addon

需要 MSVC 编译环境。

Node Addons 使 League Akari 具备更强大的功能，因为它为其提供了操作系统级 API 的调用入口。

如果你修改了 `addons/*` 下的模块内容，请重新编译。

```bash
node-gyp configure
node-gyp build
```

# 免责声明

本软件作为基于 Riot 提供的 League Client Update (LCU) API 开发的辅助工具，由于其设计和实施均未采用侵入性技术手段，理论上不会直接干预或修改游戏数据。然而，需明确指出的是，虽然本软件在原理上并未直接修改游戏内部数据，但在游戏环境的持续更新和演变中 (如未来腾讯可能的反作弊系统或其他保护服务的更新)，无法完全排除由于版本更新导致的兼容性问题或其他意外后果。

特此强调，对于使用本软件可能带来的任何后果，包括但不限于游戏账户的封禁、数据损坏或其他任何形式的游戏体验负面影响，本软件的开发者将不承担任何责任。用户在决定使用本软件时，应充分考虑并自行承担由此产生的所有风险和后果。

本声明旨在全面而详尽地通知用户关于本软件使用的可能风险，以便用户在使用过程中做出充分的风险评估和明智的决策。感谢您的关注，同时敬请遵守相关游戏规则和使用指南，确保一种健康和公平的游戏环境。
