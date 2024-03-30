import { SpawnOptionsWithoutStdio, spawn } from 'node:child_process'
import fs from 'node:fs'

import { LcuAuth, RIOT_CERTIFICATE } from './lcu-auth'

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
