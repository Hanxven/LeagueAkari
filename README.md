<div align="center">
  <img
    src="https://github.com/Hanxven/LeagueAkari/raw/HEAD/pictures/logo.png"
    width="128"
    height="128"
  />
</div>

# 1. League Akari

利用 League Client Update (LCU) API 实现的工具集，功能很多。

## 1.1 使用方法

在右侧 Release 中寻找最新的构建版本压缩包，解压后即可运行。

运行时不需要管理员权限，但高权限会提供更多的功能。

支持腾讯服以及非腾讯服客户端。

一旦检测到游戏客户端，则会自动连接。无需考虑启动顺序。

> League Akari 会很好地处理中途启动的情况。

## 1.2 企鹅群组

一个适合反馈 BUG、提出建议以及闲聊的好地方。

企鹅群组：301157623

# 2. 使用样例

包含了部分功能的使用样例。

一图胜千言。

## 2.1 这里是战绩

你可以查询同大区任何一位玩家，即使它的生涯是隐藏的。

![标签页](https://github.com/Hanxven/LeagueAkari/raw/HEAD/pictures/main_page_match-history-tabs.png '标签页')

![搜索](https://github.com/Hanxven/LeagueAkari/raw/HEAD/pictures/main_page_search_player.png '搜索')

标记一个召唤师。可以标记哦。

![搜索](https://github.com/Hanxven/LeagueAkari/raw/HEAD/pictures/main_page_tagged-player.png '搜索')

## 2.2 完美的流程

一切都在自动过程中，一秒内完成 3 ban + 1 pick 操作。

普通模式，大乱斗模式，排位模式，都支持。

![自动选择2](https://github.com/Hanxven/LeagueAkari/raw/HEAD/pictures/automation_auto-select_custom.gif '自动选择2')

![自动选择](https://github.com/Hanxven/LeagueAkari/raw/HEAD/pictures/automation_auto-select.png '自动选择')

![自动游戏流](https://github.com/Hanxven/LeagueAkari/raw/HEAD/pictures/automation_gameflow.png '自动游戏流')

你可以设置多个意向的英雄，保证在不可用时（被选，被 ban，被热禁用）切换到另一个选项。

## 2.3 到处看看

或许你可以提前知道很多东西...

![对局中](https://github.com/Hanxven/LeagueAkari/raw/HEAD/pictures/ongoing.png '对局中')

## 2.4 大乱斗标配

还在等内置 CD？我已经换了三次英雄了。

顺便提前知道这些英雄的平衡性 BUFF。

![随机模式](https://github.com/Hanxven/LeagueAkari/raw/HEAD/pictures/aux_bench-mode.png '随机模式')

## 2.5 自我娱乐

练习英雄的时候，或许你需要创建一个 5x5 的练习房间，并添加 5 个一般人机。

![房间工具](https://github.com/Hanxven/LeagueAkari/raw/HEAD/pictures/toolkit_lobby-tools.png '房间工具')

## 2.6 最漂亮的背景

使用最最拿手的、最漂亮的皮肤当作生涯背景，展现你的英雄喜好——即使你并没有这些英雄的皮肤。

![生涯](https://github.com/Hanxven/LeagueAkari/raw/HEAD/pictures/toolkit_summoner-background.png '生涯')

> 佐伊小姐~

## 2.7 出尔反尔

在接受对局后，你仍可以拒绝掉它。反之亦然，你也可以重新接受它。

经常手滑点到拒绝的玩家可能会喜欢它。

![自动接受](https://github.com/Hanxven/LeagueAkari/raw/HEAD/pictures/aux_accepted.png '自动接受')

## 2.8 没什么用的功能

发送一段自定义的抽象文本。或许这可以做一个结算画面？

![游戏内发送](https://github.com/Hanxven/LeagueAkari/raw/HEAD/pictures/toolkit_ingame-sending.png '游戏内发送')

# 3. 更名通知

该项目的前名称为 `League-Toolkit`。由于和 Github 现有项目重名，现更名为 `LeagueAkari`。

> "Akari" 来自于《摇曳百合》的主角（?）赤座灯里（Akaza **Akari**）。

# 4. 特殊声明

League Akari 是开源软件，所有已发行的主要版本（不包括特殊测试版本）都可由 Github 源码编译而来。

**League Akari 不会在任何平台标价出售，且作者不会在任何平台开放捐赠渠道。**

League Akari 不会上传任何玩家数据，所有的数据记录皆在本地进行。

League Akari 通过 Github 公开仓库检查版本更新。

# 5. 关于自动符文功能

本功能即使容易实现，但由于没有稳定的公开外部数据源，开发进度会较为缓慢。

# 6. 加入到开发过程中！

百密一疏，各种问题总是难以避免，作为使用者，您可以：

## 6.1 提个 issue！

Github Issues 是最重要的反馈渠道，请精准描述您的需求、遇到的问题或任何可行的想法。

除了 Github，另一个反馈渠道是 Bilibili 的[作者私信](https://space.bilibili.com/34532360)和[专栏评论区](https://www.bilibili.com/read/cv28654091/)。

## 6.2 加入开发！

如果您对此项目感兴趣，欢迎加入到开发之中，提交 PR，为其添加更多功能。

## 6.3 帮助推广！

对于开源作者来说，自己写的软件能被很多人使用是一件很开心的事情。

# 7. 通过源码 - 编译 & 构建 & 运行

包括 Electron 主程序以及 Node Addons。

## 7.1 Electron 主程序

安装依赖：`yarn install`

dev：`yarn dev`

build（for Windows only）: `yarn build:win`

## 7.2 Node Addon

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

# 8. 参考

League Akari 的实现参考了许多现有的优秀开源项目，这些项目为软件的部分模块开发提供了清晰的思路指导，特此表示感谢。❤️

[LCU API 文档 1](https://www.mingweisamuel.com/lcu-schema/tool/#/)

[LCU 文档 - League of Legends LCU and Riot Client API Docs](https://github.com/KebsCS/lcu-and-riotclient-api)

[Community Dragon](https://www.communitydragon.org/documentation/assets)

[Pengu Loader - ✨ The ultimate JavaScript plugin loader, build your unmatched LoL Client.](https://github.com/PenguLoader/PenguLoader)

[Seraphine - 英雄联盟战绩查询工具](https://github.com/Zzaphkiel/Seraphine)

[lol-helper - 英雄联盟工具,LCU API,一键喊话,战绩查询,一键发送战绩,更改段位显示,更改背景页,牛马/上等马/下等马,彩虹屁,禁用英雄 ,秒选英雄,解锁炫彩皮肤等](https://github.com/4379711/lol-helper)

[Joi - 一个英雄联盟助手工具](https://github.com/watchingfun/Joi)

[fix-lcu-window - 解决《英雄联盟》客户端异常窗口大小的问题。](https://github.com/LeagueTavern/fix-lcu-window)

[vscode-league-respawn-timer - An extension to display League of Legends player respawn time in Visual Studio Code.](https://github.com/Coooookies/vscode-league-respawn-timer)

[LeaguePrank](https://github.com/LeagueTavern/LeaguePrank)

[frank - A bran-new League of Legends assistant software, a replacement for WeGame.](https://github.com/Java-S12138/frank)

# 9. FAQ

1. Q: 打开时提示：“由于找不到 ffmpeg.dll，无法继续执行代码.重新安装程序可能会解决此问题。”

   A: 在使用之前，需要先解压压缩包。

2. Q: 我下载了，但没有找到主程序 LeagueAkari.exe，应该怎么运行？

   A: 请确认下载的内容不是**源代码**。如果里面有一个文件夹是 `src`，那么九成是源代码。你应该从右侧的 Releases 中下载最新版本。

3. Q: 打开时提示：“不是有效的 Win32 应用程序”

   A: League Akari 所支持的最低系统需求是 Window 10 以及 64 位系统。

4. Q: 会封号吗？

   A: League Akari 实现基于 Riot 公开的 LCU API，但仍**不能保证**是否会因此被封号。已有人由于 “修改游戏客户端” 为由被封禁 1 小时。

5. Q: 进入英雄选择界面后闪退，重连之后无法选择英雄和符文。

   A: 已知问题，原因不明。

6. Q: 无法获取战绩 / 战绩不更新。

   A: League Akari 的大部分功能实现基于 LCU API。所有数据皆从接口请求而来。由于服务器问题，其数据可能会在某些时间出现无法访问（返回 503）或不更新（缺战绩）的情况，尤其是艾欧尼亚大区（HN1）。

7. Q: 我还有其他问题。

   A: 请速速进群交流，或创建 issue。

# 10. 免责声明

本软件作为基于 Riot 提供的 League Client Update (LCU) API 开发的辅助工具，由于其设计和实施均未采用侵入性技术手段，理论上不会直接干预或修改游戏数据。然而，需明确指出的是，虽然本软件在原理上并未直接修改游戏内部数据，但在游戏环境的持续更新和演变中 (如未来腾讯可能的反作弊系统或其他保护服务的更新)，无法完全排除由于版本更新导致的兼容性问题或其他意外后果。

特此强调，对于使用本软件可能带来的任何后果，包括但不限于游戏账户的封禁、数据损坏或其他任何形式的游戏体验负面影响，本软件的开发者将不承担任何责任。用户在决定使用本软件时，应充分考虑并自行承担由此产生的所有风险和后果。

本声明旨在全面而详尽地通知用户关于本软件使用的可能风险，以便用户在使用过程中做出充分的风险评估和明智的决策。感谢您的关注，同时敬请遵守相关游戏规则和使用指南，确保一种健康和公平的游戏环境。
