<div align="center">
  <div>
    <img
    src="https://github.com/Hanxven/LeagueAkari/raw/HEAD/pictures/logo.png"
    width="128"
    height="128"
    />
  </div>
  基于 LCU API 的英雄联盟客户端工具集
</div>

# 1. League Akari

## 1.1 已支持功能

- **战绩查询**
  - [x] 同大区玩家战绩查询
- **自动操作**
  - [x] 接受对局
  - [x] 点赞玩家
  - [x] 返回房间
  - [x] 英雄选择（普通模式、大乱斗模式等）
  - [x] 英雄禁用
  - [x] 重新匹配对局
  - [x] 自动回复
- **对局分析**
  - [x] 战绩分析
  - [x] 开黑分析
- **其他功能**
  - [x] 重生倒计时
  - [x] 英雄选择或游戏内发送 KDA 简报
  - [x] 虚假段位、修改生涯背景、卸下头像框和勋章
  - [x] 英雄选择时秒退
  - [x] 大乱斗无 CD 换英雄
  - [x] 创建 5x5 训练房间
  - [x] 同大区观战
  - [x] 自定义在线状态
  - [x] 游戏内发送自定义文本
  - [x] 修复客户端窗口大小
- **计划中**
  - [ ] 符文设置

## 1.2 使用方法

在右侧 Release 中寻找最新的构建版本压缩包，解压后即可运行。

运行时不需要管理员权限，但高权限会提供更多的功能。

支持腾讯服以及非腾讯服客户端。

一旦检测到游戏客户端，则会自动连接。无需考虑启动顺序。

League Akari 会很好地处理中途启动的情况。

## 1.3 企鹅群组

一个适合吹水开黑聊天的好地方，甚至还能反馈 BUG 和提出建议。

企鹅群组：301157623

# 2. 加入到开发

百密一疏，各种问题总是难以避免，作为使用者，您可以：

## 2.1 Github Issues

Github Issues 是最重要的反馈渠道，请精准描述您的需求、遇到的问题或任何可行的想法。

除了 Github，另一个反馈渠道是 Bilibili 的[作者私信](https://space.bilibili.com/34532360)和[专栏评论区](https://www.bilibili.com/read/cv28654091/)。

## 2.2 加入开发

如果您对此项目感兴趣，欢迎加入到开发之中，提交 PR，为其添加更多功能。

# 3. 编译 & 构建 & 运行

本章节指示如何通过源码构建 League Akari。

## 3.1 Electron 主程序

安装依赖：`yarn install`

dev：`yarn dev`

build（for Windows only）: `yarn build:win`

## 3.2 Node Addon

需要 MSVC 编译环境和 `node-gyp`。

Node Addons 使 League Akari 具备更强大的功能，因为它为其提供了操作系统级 API 的调用入口。

如果你修改了 `addons/*` 下的模块内容，请重新编译。

```bash
yarn install
```

```bash
node-gyp configure
node-gyp build
```

# 4. 参考

League Akari 的实现参考了许多现有的优秀开源项目，这些项目为软件的部分模块开发提供了清晰的思路指导，特此表示感谢。❤️

- [LCU API 文档 1](https://www.mingweisamuel.com/lcu-schema/tool/#/)

- [LCU 文档 - League of Legends LCU and Riot Client API Docs](https://github.com/KebsCS/lcu-and-riotclient-api)

- [Community Dragon](https://www.communitydragon.org/documentation/assets)

- [Pengu Loader - ✨ The ultimate JavaScript plugin loader, build your unmatched LoL Client.](https://github.com/PenguLoader/PenguLoader)

- [Seraphine - 英雄联盟战绩查询工具](https://github.com/Zzaphkiel/Seraphine)

- [lol-helper - 英雄联盟工具,LCU API,一键喊话,战绩查询,一键发送战绩,更改段位显示,更改背景页,牛马/上等马/下等马,彩虹屁,禁用英雄 ,秒选英雄,解锁炫彩皮肤等](https://github.com/4379711/lol-helper)

- [Joi - 一个英雄联盟助手工具](https://github.com/watchingfun/Joi)

- [fix-lcu-window - 解决《英雄联盟》客户端异常窗口大小的问题。](https://github.com/LeagueTavern/fix-lcu-window)

- [vscode-league-respawn-timer - An extension to display League of Legends player respawn time in Visual Studio Code.](https://github.com/Coooookies/vscode-league-respawn-timer)

- [LeaguePrank](https://github.com/LeagueTavern/LeaguePrank)

- [frank - A bran-new League of Legends assistant software, a replacement for WeGame.](https://github.com/Java-S12138/frank)

# 5. FAQ - 常见问题及回答

[参见 FAQ.md](https://github.com/Hanxven/LeagueAkari/blob/main/FAQ.md 'FAQ')

# 6. 免责声明

本软件作为基于 Riot 提供的 League Client Update (LCU) API 开发的辅助工具，由于其设计和实施均未采用侵入性技术手段，理论上不会直接干预或修改游戏数据。然而，需明确指出的是，虽然本软件在原理上并未直接修改游戏内部数据，但在游戏环境的持续更新和演变中 (如未来腾讯可能的反作弊系统或其他保护服务的更新)，无法完全排除由于版本更新导致的兼容性问题或其他意外后果。

特此强调，对于使用本软件可能带来的任何后果，包括但不限于游戏账户的封禁、数据损坏或其他任何形式的游戏体验负面影响，本软件的开发者将不承担任何责任。用户在决定使用本软件时，应充分考虑并自行承担由此产生的所有风险和后果。

本声明旨在全面而详尽地通知用户关于本软件使用的可能风险，以便用户在使用过程中做出充分的风险评估和明智的决策。感谢您的关注，同时敬请遵守相关游戏规则和使用指南，确保一种健康和公平的游戏环境。

[![Star History Chart](https://api.star-history.com/svg?repos=Hanxven/LeagueAkari&type=Date)](https://star-history.com/#Hanxven/LeagueAkari&Date)
