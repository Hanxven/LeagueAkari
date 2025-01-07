<div align="center">
  <div>
    <img
    src="https://github.com/Hanxven/LeagueAkari/raw/HEAD/pictures/logo.png"
    width="128"
    height="128"
    />
  </div>
  A League of Legends client toolkit based on the LCU API
</div>

<p align="center">
    <a href="https://github.com/Hanxven/LeagueAkari/releases"><img src="https://img.shields.io/github/release/Hanxven/LeagueAkari.svg?style=flat-square&maxAge=600" alt="Downloads"></a>
    <a href="https://github.com/Hanxven/LeagueAkari/releases">
    <img src="https://img.shields.io/github/downloads/Hanxven/LeagueAkari/total?style=flat&label=Downloads"></a>
    <a href="https://github.com/Hanxven/LeagueAkari/stargazers">
    <img src="https://img.shields.io/github/stars/Hanxven/LeagueAkari?style=flat&label=Stars">
  </a>
</p>

# 1. League Akari

[简体中文](README.md) | [English](README-en.md)

## 1.1 Supported Features

- **Match History**
  - [x] View match history for players in the same region and limited cross-region support.
- **Automated Actions**
  - [x] Accept matches
  - [x] Commend players
  - [x] Return to the room
  - [x] Champion selection (Normal, ARAM, etc.)
  - [x] Champion banning
  - [x] Runes and summoner spells configuration
  - [x] Rematch
  - [x] Auto reply
- **Match Analysis**
  - [x] Match history analysis
  - [x] Party analysis
- **Other Features**
  - [x] Respawn timer
  - [x] Send KDA reports during champion selection or in-game
  - [x] Fake ranks, modify career background, remove avatar frames and medals
  - [x] Dodge in the last second during champion selection
  - [x] CD-free champion swapping in ARAM
  - [x] Create 5v5 practice rooms
  - [x] Spectate matches within the same region or limited cross-region
  - [x] Customize online status
  - [x] Send custom text in-game
  - [x] Resize client window
- **External Data Sources**
  - [x] Champion balance information (Fandom)
  - [x] OP.GG Integration
- **Miscellaneous**
  - [x] Explore more on your own!

## 1.2 Usage Instructions

Download the latest build from the Release section on the right, extract the package, and run it.

Admin privileges are not required to run, but they enable additional features.

Supports both Tencent and non-Tencent game clients.

> [!NOTE]
> League Akari will automatically connect once the game client is detected, regardless of the launch order. It handles mid-launch scenarios seamlessly.

## 1.3 QQ Group

A fun place for casual chats, party setups, bug reports, and suggestions.

QQ Group 1: 301157623 (Passcode: akari)

QQ Group 2: 1021970497 (Passcode: akari)

## 1.4 Beta Versions

"rabi" versions with features slated for the next release are periodically shared in the group chat.

# 2. Contributing to Development

Issues are inevitable; as a user, you can:

## 2.1 GitHub Issues

GitHub Issues is the primary channel for feedback. Please clearly describe your requirements, issues, or suggestions.

## 2.2 Contribute Code

Interested in the project? Feel free to contribute by submitting PRs and adding new features.

# 3. Build & Run

This section describes how to build League Akari from the source code.

## 3.1 Electron Main Program

Install dependencies: `yarn install`

Run dev mode: `yarn dev`

Build (Windows only): `yarn build:win`

## 3.2 Node Native Modules (Optional)

Requires an MSVC build environment and `node-gyp`.

Node Addons enhance League Akari with powerful OS-level API integrations. These modules are located under `addons/`.

If you modify files in `addons/*`, recompile as follows:

```bash
yarn install
node-gyp configure
node-gyp build
```

Then copy `la-input-win64.node` and `la-tools-win64.node` to the app source directory at `src/main/native` and update type definitions in `src/main/node-addon.d.ts`.

# 4. Acknowledgments

League Akari's development was inspired by several outstanding open-source projects. Sincere thanks to the following:

| Project                                                                                                   | Description                                       |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| ⭐⭐⭐ [Pengu Loader](https://github.com/PenguLoader/PenguLoader)                                         | UX client debugging and reverse engineering tools |
| ⭐⭐⭐ [League of Legends LCU and Riot Client API Docs](https://github.com/KebsCS/lcu-and-riotclient-api) | LCU API documentation reference                   |
| ⭐⭐ [Community Dragon](https://www.communitydragon.org/documentation/assets)                             | Resource management and documentation             |
| ⭐⭐ [Seraphine](https://github.com/Zzaphkiel/Seraphine)                                                  | Integrated feature inspirations                   |
| ⭐ [fix-lcu-window](https://github.com/LeagueTavern/fix-lcu-window)                                       | Window resizing solutions                         |
| ⭐ [Joi](https://github.com/watchingfun/Joi)                                                              | OP.GG integration references                      |
| ⭐ [lol-helper](https://github.com/4379711/lol-helper)                                                    | Tool design and functionality inspiration         |
| ⭐ [vscode-league-respawn-timer](https://github.com/Coooookies/vscode-league-respawn-timer)               | Respawn timer reference                           |
| ⭐ [LeaguePrank](https://github.com/LeagueTavern/LeaguePrank)                                             | Fun feature implementations                       |
| ⭐ [LCU API](https://www.mingweisamuel.com/lcu-schema/tool/#/)                                            | Early LCU API documentation                       |

# 5. FAQ

[FAQ - Common Questions and Answers](https://hanxven.github.io/LeagueAkari/faq.html)

# 6. Disclaimer

This software is a tool developed based on Riot's League Client Update (LCU) API. It does not use intrusive techniques and theoretically does not directly interfere with or modify game data. However, please be aware of potential compatibility issues or risks associated with game updates or anti-cheat systems.

The developer is not responsible for any consequences, such as account bans or data loss, resulting from the use of this software. Users are advised to fully understand the risks and take responsibility for their actions.

This disclaimer is intended to provide transparency and enable users to make informed decisions. Thank you for your understanding, and please ensure fair play in the gaming environment.

[![Star History Chart](https://api.star-history.com/svg?repos=Hanxven/LeagueAkari&type=Date)](https://star-history.com/#Hanxven/LeagueAkari&Date)
