import { exec } from 'child_process'

function checkCommand(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    exec(command, (err) => {
      resolve(!err)
    })
  })
}

const precedence = {
  cmd: 1,
  pwsh: 2,
  powershell: 3
}

export async function checkAvailableShells(): Promise<string[]> {
  const results = await Promise.allSettled([
    checkCommand('powershell -Command "$PSVersionTable.PSVersion"').then((available) =>
      available ? 'powershell' : null
    ),
    checkCommand('pwsh -Version').then((available) => (available ? 'pwsh' : null)),
    checkCommand('cmd /c "echo"').then((available) => (available ? 'cmd' : null))
  ])

  return results
    .filter((result) => result.status === 'fulfilled' && result.value !== null)
    .map((result) => (result as PromiseFulfilledResult<string>).value)
    .sort((a, b) => {
      const ap = precedence[a] || 0
      const bp = precedence[b] || 0
      return bp - ap
    })
}

export function checkAdminPrivilegesCmd(): Promise<boolean> {
  return new Promise((resolve) => {
    exec('net session', (error, _stdout, _stderr) => {
      if (error) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

export function checkAdminPrivilegesPowershell(shell: string): Promise<boolean> {
  const command = `(New-Object System.Security.Principal.WindowsPrincipal([System.Security.Principal.WindowsIdentity]::GetCurrent())).IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)`
  return new Promise<boolean>((resolve, reject) => {
    exec(`${shell} -Command "${command}"`, (error, stdout) => {
      if (error) {
        reject(error)
        return
      }
      resolve(stdout.trim() === 'True')
    })
  })
}

export async function isProcessExistsPowershell(clientName: string): Promise<boolean> {
  return new Promise((resolve) => {
    exec(
      `powershell -WindowStyle Hidden "Get-CimInstance -Query 'SELECT * from Win32_Process WHERE name LIKE ''${clientName}'''"`,
      (err, stdout) => {
        if (err || stdout.length === 0) {
          resolve(false)
        } else {
          resolve(true)
        }
      }
    )
  })
}

export async function isProcessExistsCmd(clientName: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const cmd = `wmic process where "name like '%${clientName}%'" get name`

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err)
        return
      }

      if (stderr) {
        reject(stderr)
        return
      }

      resolve(stdout.toLowerCase().includes(clientName.toLowerCase()))
    })
  })
}
