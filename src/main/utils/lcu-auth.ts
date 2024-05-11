import toolkit from '@main/native/laToolkitWin32x64.node'
import { SpawnOptionsWithoutStdio, spawn } from 'node:child_process'
import fs from 'node:fs'

/**
 * 来自 Riot 的证书文件
 */
export const RIOT_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIEIDCCAwgCCQDJC+QAdVx4UDANBgkqhkiG9w0BAQUFADCB0TELMAkGA1UEBhMC
VVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFTATBgNVBAcTDFNhbnRhIE1vbmljYTET
MBEGA1UEChMKUmlvdCBHYW1lczEdMBsGA1UECxMUTG9MIEdhbWUgRW5naW5lZXJp
bmcxMzAxBgNVBAMTKkxvTCBHYW1lIEVuZ2luZWVyaW5nIENlcnRpZmljYXRlIEF1
dGhvcml0eTEtMCsGCSqGSIb3DQEJARYeZ2FtZXRlY2hub2xvZ2llc0ByaW90Z2Ft
ZXMuY29tMB4XDTEzMTIwNDAwNDgzOVoXDTQzMTEyNzAwNDgzOVowgdExCzAJBgNV
BAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMRUwEwYDVQQHEwxTYW50YSBNb25p
Y2ExEzARBgNVBAoTClJpb3QgR2FtZXMxHTAbBgNVBAsTFExvTCBHYW1lIEVuZ2lu
ZWVyaW5nMTMwMQYDVQQDEypMb0wgR2FtZSBFbmdpbmVlcmluZyBDZXJ0aWZpY2F0
ZSBBdXRob3JpdHkxLTArBgkqhkiG9w0BCQEWHmdhbWV0ZWNobm9sb2dpZXNAcmlv
dGdhbWVzLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKoJemF/
6PNG3GRJGbjzImTdOo1OJRDI7noRwJgDqkaJFkwv0X8aPUGbZSUzUO23cQcCgpYj
21ygzKu5dtCN2EcQVVpNtyPuM2V4eEGr1woodzALtufL3Nlyh6g5jKKuDIfeUBHv
JNyQf2h3Uha16lnrXmz9o9wsX/jf+jUAljBJqsMeACOpXfuZy+YKUCxSPOZaYTLC
y+0GQfiT431pJHBQlrXAUwzOmaJPQ7M6mLfsnpHibSkxUfMfHROaYCZ/sbWKl3lr
ZA9DbwaKKfS1Iw0ucAeDudyuqb4JntGU/W0aboKA0c3YB02mxAM4oDnqseuKV/CX
8SQAiaXnYotuNXMCAwEAATANBgkqhkiG9w0BAQUFAAOCAQEAf3KPmddqEqqC8iLs
lcd0euC4F5+USp9YsrZ3WuOzHqVxTtX3hR1scdlDXNvrsebQZUqwGdZGMS16ln3k
WObw7BbhU89tDNCN7Lt/IjT4MGRYRE+TmRc5EeIXxHkQ78bQqbmAI3GsW+7kJsoO
q3DdeE+M+BUJrhWorsAQCgUyZO166SAtKXKLIcxa+ddC49NvMQPJyzm3V+2b1roP
SvD2WV8gRYUnGmy/N0+u6ANq5EsbhZ548zZc+BI4upsWChTLyxt2RxR7+uGlS1+5
EcGfKZ+g024k/J32XP4hdho7WYAS2xMiV83CfLR/MNi8oSMaVQTdKD8cpgiWJk3L
XWehWA==
-----END CERTIFICATE-----`

export interface LcuAuth {
  port: number
  pid: number
  password: string
  certificate: string
  region: string
  rsoPlatformId: string
}

export function isLcuAuthObject(obj: any): obj is LcuAuth {
  return (
    typeof obj === 'object' &&
    typeof obj.port === 'number' &&
    typeof obj.pid === 'number' &&
    typeof obj.password === 'string'
  )
}

const WMIC_PATH = 'C:\\Windows\\System32\\wbem\\WMIC.exe'

export function checkWmicAvailability() {
  const isExists = fs.existsSync(WMIC_PATH)
  if (!isExists) {
    throw new Error(
      'WMIC unavailable, League Akari relies on this tool to obtain process information'
    )
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
        reject(new Error(`command failed with code ${code}: ${stderr}`))
      }
    })

    child.on('error', (error) => {
      console.log('an error occurred on executing command: ', error, command, args)
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
    certificate: RIOT_CERTIFICATE
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

export function queryLcuAuthNative(clientName: string): LcuAuth[] {
  const pids = toolkit.getPidsByName(clientName)

  const auths: LcuAuth[] = []
  for (const p of pids) {
    try {
      const cmd = toolkit.getCommandLine1(p)
      const parsed = parseLcuAuth(cmd)
      if (parsed) {
        auths.push(parsed)
      }
    } catch {}
  }

  return auths
}
