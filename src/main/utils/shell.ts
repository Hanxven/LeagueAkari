import { SpawnOptionsWithoutStdio, spawn } from 'node:child_process'
import fs from 'node:fs'

import { LcuAuth, certificate } from './lcu-auth'

const WMIC_PATH = 'C:\\Windows\\System32\\wbem\\WMIC.exe'

export function checkWmicAvailability() {
  const isExists = fs.existsSync(WMIC_PATH)
  if (!isExists) {
    throw new Error('WMIC 不存在，League Akari 依赖此工具获取进程信息')
  }
}

function runCommand(
  command: string,
  args: string[] = [],
  options?: SpawnOptionsWithoutStdio
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options)
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout)
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`))
      }
    })

    child.on('error', (error) => {
      console.log('An error occurred on executing command: ', error, command, args)
      reject(error)
    })
  })
}

export async function isProcessExists(clientName: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    runCommand(WMIC_PATH, ['process', 'where', `name like '%${clientName}%'`, 'get', 'name'])
      .then((out) => resolve(out.includes(clientName)))
      .catch((error) => {
        reject(error)
      })
  })
}

export async function getProcessPidByName(name: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    runCommand(WMIC_PATH, ['process', 'where', `name like '%${name}%'`, 'get', 'processid'])
      .then((out) => {
        const pids = out
          .split('\n')
          .map((i) => i.trim())
          .map(Number)
          .filter(Boolean)
        resolve(pids)
      })
      .catch((error) => reject(error))
  })
}

const portRegex = /--app-port=([0-9]+)/
const passwordRegex = /--remoting-auth-token=([\w-_]+)/
const pidRegex = /--app-pid=([0-9]+)/
const rsoPlatformIdRegex = /--rso_platform_id=([\w-_]+)/
const regionRegex = /--region=([\w-_]+)/

function parseLcuAuth(s: string): LcuAuth | null {
  const [, port] = s.match(portRegex) || []
  const [, password] = s.match(passwordRegex) || []
  const [, pid] = s.match(pidRegex) || []
  const [, rsoPlatformId = ''] = s.match(rsoPlatformIdRegex) || []
  const [, region = ''] = s.match(regionRegex) || []

  if (!port || !password || !pid) {
    return null
  }

  return {
    port: Number(port),
    pid: Number(pid),
    password,
    rsoPlatformId,
    region,
    certificate
  }
}

export async function queryLcuAuth(pid: number): Promise<LcuAuth[]>
export async function queryLcuAuth(clientName: string): Promise<LcuAuth[]>
export async function queryLcuAuth(arg: string | number): Promise<LcuAuth[]> {
  return new Promise((resolve, reject) => {
    let task: Promise<string>

    if (typeof arg === 'number') {
      task = runCommand(WMIC_PATH, ['process', 'where', `processid=${arg}`, 'get', 'CommandLine'])
    } else {
      // arg is string
      task = runCommand(WMIC_PATH, [
        'process',
        'where',
        `name like '%${arg}%'`,
        'get',
        'CommandLine'
      ])
    }

    task
      .then((out) => {
        const authObjects = out
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => Boolean(s) && s.toUpperCase() !== 'COMMANDLINE')
          .map(parseLcuAuth)
          .filter(Boolean) as LcuAuth[]

        resolve(authObjects)
      })
      .catch((error) => reject(error))
  })
}

/**


CommandLine                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ProcessId  

d:/wegameapps/Ӣ      /LeagueClient/LeagueClientUx.exe "--riotclient-auth-token=BTeUf9zse29lKI62YSFyjQ" "--riotclient-app-port=59426" "--riotclient-tencent" "--no-rads" "--disable-self-update" "--region=TENCENT" "--locale=zh_CN" "--t.lcdshost=hn1-cloud-feapp.lol.qq.com" "--t.chathost=hn1-cloud-ejabberd.lol.qq.com" "--t.lq=https://hn1-cloud-login.lol.qq.com:8443" "--t.storeurl=https://hn1-cloud-sr.lol.qq.com:8443" "--t.rmsurl=wss://hn1-cloud-rms.lol.qq.com" "--rso-auth.url=https://prod-rso.lol.qq.com:3000" "--rso_platform_id=HN1" "--rso-auth.client=lol" "--t.location=loltencent.gz1.HN1" "--tglog-endpoint=https://tglogsz.datamore.qq.com/lolcli/report/" "--ccs=https://hn1-cloud-cc.lol.qq.com:8093" "--entitlements-url=https://hn1-cloud-entitlements.lol.qq.com:28088/api/token/v1" "--dradis-endpoint=http://some.url" "--remoting-auth-token=suQqf2DuAlrdSuC7glykRA" "--app-port=53943" "--install-directory=d:\wegameapps\英雄联盟\LeagueClient" "--app-name=LeagueClient" "--ux-name=LeagueClientUx" "--ux-helper-name=LeagueClientUxHelper" "--log-dir=LeagueClient Logs" "--crash-reporting=" "--crash-environment=HN1" "--app-log-file-path=d:/wegameapps/Ӣ      /LeagueClient/../Game/Logs/LeagueClient Logs/2024-03-28T11-04-11_16952_LeagueClient.log" "--app-pid=16952" "--output-base-dir=d:/wegameapps/英雄联盟/LeagueClient/../Game" "--no-proxy-server" "--ignore-certificate-errors"                26192      

d:/wegameapps/Ӣ      /LeagueClient/LeagueClientUx.exe "--riotclient-auth-token=M6l6X9SV0RCdPW7EQk5_Rw" "--riotclient-app-port=55029" "--riotclient-tencent" "--no-rads" "--disable-self-update" "--region=TENCENT" "--locale=zh_CN" "--t.lcdshost=hn10-cloud-feapp.lol.qq.com" "--t.chathost=hn10-cloud-ejabberd.lol.qq.com" "--t.lq=https://hn10-cloud-login.lol.qq.com:8443" "--t.storeurl=https://hn10-cloud-sr.lol.qq.com:8443" "--t.rmsurl=wss://hn10-cloud-rms.lol.qq.com:443" "--rso-auth.url=https://prod-rso.lol.qq.com:3000" "--rso_platform_id=HN10" "--rso-auth.client=lol" "--t.location=loltencent.gz2.HN10" "--tglog-endpoint=https://tglogsz.datamore.qq.com/lolcli/report/" "--ccs=https://hn10-cloud-cc.lol.qq.com:8093" "--entitlements-url=https://hn10-cloud-entitlements.lol.qq.com:28088/api/token/v1" "--dradis-endpoint=http://some.url" "--remoting-auth-token=VZw1YBR88fbht4plzZVdsg" "--app-port=64347" "--install-directory=d:\wegameapps\英雄联盟\LeagueClient" "--app-name=LeagueClient" "--ux-name=LeagueClientUx" "--ux-helper-name=LeagueClientUxHelper" "--log-dir=LeagueClient Logs" "--crash-reporting=" "--crash-environment=HN10" "--app-log-file-path=d:/wegameapps/Ӣ      /LeagueClient/../Game/Logs/LeagueClient Logs/2024-03-28T11-05-53_11004_LeagueClient.log" "--app-pid=11004" "--output-base-dir=d:/wegameapps/英雄联盟/LeagueClient/../Game" "--no-proxy-server" "--ignore-certificate-errors"  25768      





 */
