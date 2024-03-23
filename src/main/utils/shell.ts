import { SpawnOptionsWithoutStdio, spawn } from 'node:child_process'
import fs from 'node:fs'

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

export async function isProcessExistsStandalone(clientName: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    runCommand(WMIC_PATH, ['process', 'where', `name like '%${clientName}%'`, 'get', 'name'])
      .then((out) => resolve(out.includes(clientName)))
      .catch((error) => {
        console.log(error)
        reject(error)
      })
  })
}

export async function getCommandLineStandalone(clientName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    runCommand(WMIC_PATH, ['process', 'where', `name like '%${clientName}%'`, 'get', 'CommandLine'])
      .then((out) => resolve(out.trim()))
      .catch((error) => reject(error))
  })
}
