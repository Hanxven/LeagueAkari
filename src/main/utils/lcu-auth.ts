import cp from 'child_process'
import { randomUUID } from 'crypto'
import { app } from 'electron'
import fs, { rmSync } from 'fs'
import path from 'path'

import { basicState } from '../core/basic'

/**
 * 来自 Riot 的证书文件
 * 可能会更新？但不是现在
 */
export const certificate = `-----BEGIN CERTIFICATE-----
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
}

export function isLcuAuthObject(obj: any): obj is LcuAuth {
  return (
    typeof obj === 'object' &&
    typeof obj.port === 'number' &&
    typeof obj.pid === 'number' &&
    typeof obj.password === 'string'
  )
}

const portRegex = /--app-port=([0-9]+)/
const passwordRegex = /--remoting-auth-token=([\w-_]+)/
const pidRegex = /--app-pid=([0-9]+)/
const clientName = 'LeagueClientUx.exe'

function buildPowershellScript(clientName: string, shell: string, tempSavePath?: string) {
  let command: string
  if (tempSavePath) {
    command =
      `$_ = Start-Process powershell ` +
      `-Argumentlist "\`$PSDefaultParameterValues['Out-File:Encoding']='utf8';` +
      `Get-CimInstance -Query 'SELECT * from Win32_Process WHERE name LIKE ''${clientName}''' | ` +
      `Select-Object -ExpandProperty CommandLine | Out-File ${tempSavePath} -Encoding UTF8" ` +
      `-WindowStyle hidden -Verb runas -Wait -PassThru`
  } else {
    command = `Get-CimInstance -Query 'SELECT * from Win32_Process WHERE name LIKE ''${clientName}''' | Select-Object -ExpandProperty CommandLine`
  }

  return `${shell} -Command "${command}"`
}

function buildCmdScript(clientName: string) {
  return `wmic process where "name like '%${clientName}%'" get CommandLine`
}

// 仅限 Windows 平台，因为需要 Powershell
export function queryLcuAuth(): Promise<LcuAuth> {
  return new Promise(function (resolve, reject) {
    try {
      const savePath = path.join(app.getPath('temp'), 'temp-' + randomUUID())
      const cmd =
        `$_ = Start-Process powershell ` +
        `-Argumentlist "\`$PSDefaultParameterValues['Out-File:Encoding']='utf8';` +
        `Get-CimInstance -Query 'SELECT * from Win32_Process WHERE name LIKE ''${clientName}''' | ` +
        `Select-Object -ExpandProperty CommandLine | Out-File ${savePath} -Encoding UTF8" ` +
        `-WindowStyle hidden -Verb runAs -Wait -PassThru
      `
      cp.exec(cmd, { shell: 'powershell' }, (error, _stdout, stderr) => {
        if (error) {
          reject(new Error('尝试执行脚本时失败: ' + stderr + error.message))
          return
        }

        try {
          if (!fs.existsSync(savePath)) {
            throw new Error('进程文件不存在')
          }
          const raw = fs.readFileSync(savePath, 'utf-8').replace(/\s/g, '')
          if (raw.trim().length === 0) {
            throw new Error('空的文件内容，检查是否提供管理员权限')
          }

          const [, port] = raw.match(portRegex) || []
          const [, password] = raw.match(passwordRegex) || []
          const [, pid] = raw.match(pidRegex) || []

          if (!port || !password || !pid) {
            reject(new Error('无法解析进程命令行参数'))
            return
          }

          resolve({
            port: Number(port),
            pid: Number(pid),
            password,
            certificate
          })
        } catch (e) {
          reject(e)
        } finally {
          if (fs.existsSync(savePath)) {
            rmSync(savePath)
          }
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}

// 管理员权限下会尝试更多的方法
export function queryLcuAuthOnAdmin(): Promise<LcuAuth> {
  return new Promise(function (resolve, reject) {
    try {
      let cmd: string
      let shell = basicState.availableShells[0]
      if (shell === 'cmd') {
        cmd = buildCmdScript(clientName)
      } else {
        cmd = buildPowershellScript(clientName, shell)
      }

      cp.exec(cmd, (error, stdout, stderr) => {
        if (error) {
          reject(new Error('执行脚本时发生错误：' + stderr + error.message))
          return
        }

        const raw = stdout.trim()
        if (raw.length === 0) {
          reject(new Error('空的文件内容'))
          return
        }

        const [, port] = raw.match(portRegex) || []
        const [, password] = raw.match(passwordRegex) || []
        const [, pid] = raw.match(pidRegex) || []

        if (!port || !password || !pid) {
          reject(new Error('无法解析进程命令行参数'))
          return
        }

        resolve({
          port: Number(port),
          pid: Number(pid),
          password,
          certificate
        })
      })
    } catch (e) {
      reject(e)
    }
  })
}
