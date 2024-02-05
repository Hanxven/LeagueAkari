import { spawn } from 'node:child_process'

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

function testCommand(command: string, args: string[] = []): Promise<boolean> {
  return new Promise((resolve) => {
    runCommand(command, args)
      .then(() => resolve(true))
      .catch(() => resolve(false))
  })
}

export async function checkShellAvailability() {
  const results = await Promise.all([
    testCommand('cmd', ['/c', 'ver']),
    testCommand('powershell', ['-Command', '$PSVersionTable.PSVersion.ToString()']),
    testCommand('pwsh', ['-Version'])
  ])

  return {
    cmd: results[0],
    powershell: results[1],
    pwsh: results[2]
  }
}

export async function checkAdminPrivileges(shell: 'powershell' | 'pwsh' | 'cmd'): Promise<boolean> {
  if (shell === 'cmd') {
    return new Promise((resolve) =>
      runCommand('cmd', ['/c', 'net', 'session'])
        .then(() => resolve(true))
        .catch(() => resolve(false))
    )
  }

  const powershellCmd = `(New-Object System.Security.Principal.WindowsPrincipal([System.Security.Principal.WindowsIdentity]::GetCurrent())).IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)`
  return (await runCommand(shell, ['-Command', powershellCmd])).trim() === 'True'
}

export async function isProcessExists(
  shell: 'powershell' | 'pwsh' | 'cmd',
  clientName: string
): Promise<boolean> {
  if (shell === 'cmd') {
    return new Promise((resolve) => {
      runCommand('cmd', [
        '/c',
        'wmic',
        'process',
        'where',
        `name like '%${clientName}%'`,
        'get',
        'name'
      ])
        .then((out) => resolve(out.includes(clientName)))
        .catch(() => resolve(false))
    })
  }

  return new Promise((resolve) => {
    runCommand(shell, [
      '-Command',
      'Get-CimInstance',
      '-Query',
      `'SELECT * from Win32_Process WHERE name LIKE ''${clientName}'''`
    ])
      .then((out) => {
        if (out.trim().length === 0) {
          resolve(false)
          return
        }
        resolve(true)
      })
      .catch(() => resolve(false))
  })
}

export async function getCommandLine(
  shell: 'powershell' | 'pwsh' | 'cmd',
  clientName: string
): Promise<string> {
  if (shell === 'cmd') {
    return new Promise((resolve, reject) => {
      runCommand('cmd', [
        '/c',
        'wmic',
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

  return new Promise((resolve, reject) => {
    runCommand(shell, [
      '-Command',
      'Get-CimInstance',
      '-Query',
      `'SELECT * from Win32_Process WHERE name LIKE ''${clientName}'''`,
      '|',
      'Select-Object',
      '-ExpandProperty',
      'CommandLine'
    ])
      .then((out) => resolve(out.trim()))
      .catch((error) => reject(error))
  })
}
