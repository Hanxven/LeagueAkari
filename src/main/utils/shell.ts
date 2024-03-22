import { spawn } from 'node:child_process'

import wmicExecutable from '../../../resources/WMIC.exe?asset&asarUnpack'
import { dialog } from 'electron'

function runCommand(command: string, args: string[] = []): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args)
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
  return new Promise((resolve) => {
    runCommand(wmicExecutable, ['process', 'where', `name like '%${clientName}%'`, 'get', 'name'])
      .then((out) => resolve(out.includes(clientName)))
      .catch((_e) => {
        resolve(false)
      })
  })
}

export async function getCommandLineStandalone(clientName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    runCommand(wmicExecutable, [
      'process',
      'where',
      `name like '%${clientName}%'`,
      'get',
      'CommandLine'
    ])
      .then((out) => resolve(out.trim()))
      .catch((error) => reject(error))
  })
}
