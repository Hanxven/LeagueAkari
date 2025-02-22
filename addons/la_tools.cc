#include <iostream>
#include <napi.h>
#include <ntstatus.h>
#include <shlobj.h>
#include <stdlib.h>
#include <windows.h>
#include <TlHelp32.h>
#include <winternl.h>
#include <stdint.h>   // 引入固定宽度整数类型的定义
#include <psapi.h>    // 引入用于获取进程信息的API
#include <string>
#include <memory> // 引入智能指针
#include <shellapi.h>
constexpr wchar_t APPLICATION_CLASS_NAME[] = L"RCLIENT";
constexpr wchar_t APPLICATION_NAME[] = L"League of Legends";
constexpr wchar_t CEF_WINDOW_NAME[] = L"CefBrowserWindow";

HANDLE OpenProcessFromPid(DWORD pid, DWORD access) {
  return OpenProcess(access, FALSE, pid);
}

int GetProcessCommandLine1(DWORD pid, WCHAR** pdata, SIZE_T* psize) {
  HANDLE hProcess = NULL;
  ULONG bufLen = 0;
  NTSTATUS status;
  char* buffer = NULL;
  WCHAR* bufWchar = NULL;
  PUNICODE_STRING tmp = NULL;
  size_t size;
  int ProcessCommandLineInformation = 60;

  hProcess = OpenProcessFromPid(pid, PROCESS_QUERY_LIMITED_INFORMATION);
  if (hProcess == NULL)
    goto error;

  status = NtQueryInformationProcess(hProcess, (PROCESSINFOCLASS)ProcessCommandLineInformation, NULL, 0, &bufLen);
  if (status != STATUS_BUFFER_OVERFLOW && status != STATUS_BUFFER_TOO_SMALL && status != STATUS_INFO_LENGTH_MISMATCH)
    goto error;

  buffer = (char*)calloc(bufLen, 1);
  if (buffer == NULL) {
    fprintf(stderr, "Memory allocation failed\n");
    goto error;
  }

  status = NtQueryInformationProcess(hProcess, (PROCESSINFOCLASS)ProcessCommandLineInformation, buffer, bufLen, &bufLen);
  if (!NT_SUCCESS(status))
    goto error;

  tmp = (PUNICODE_STRING)buffer;
  size = wcslen(tmp->Buffer) + 1;
  bufWchar = (WCHAR*)calloc(size, sizeof(WCHAR));
  if (bufWchar == NULL) {
    fprintf(stderr, "Memory allocation failed\n");
    goto error;
  }
  wcscpy_s(bufWchar, size, tmp->Buffer);
  *pdata = bufWchar;
  *psize = size * sizeof(WCHAR);

  free(buffer);
  CloseHandle(hProcess);
  return 0;

error:
  if (buffer != NULL)
    free(buffer);
  if (hProcess != NULL)
    CloseHandle(hProcess);
  return -1;
}

// 查询命令行参数
// 用 1 作为后缀是因为之后可能写一个基于进程 PEB 的 2 版本
Napi::String GetCommandLine1(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
    return Napi::String::New(env, "");
  }

  DWORD pid = info[0].As<Napi::Number>().Uint32Value();
  WCHAR* cmdline = NULL;
  SIZE_T cmdline_size = 0;

  int result = GetProcessCommandLine1(pid, &cmdline, &cmdline_size);
  if (result == 0 && cmdline != NULL) {
    std::u16string cmd(reinterpret_cast<char16_t*>(cmdline));
    free(cmdline);
    return Napi::String::New(env, cmd);
  } else {
    return Napi::String::New(env, "Failed to retrieve command line.");
  }
}

Napi::Array GetPidsByName(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
    return Napi::Array::New(env);
  }

  std::string processName = info[0].As<Napi::String>().Utf8Value();
  std::vector<DWORD> pids;
  HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);

  if (hSnapshot == INVALID_HANDLE_VALUE) {
    return Napi::Array::New(env); // 返回空数组
  }

  PROCESSENTRY32 pe32;
  pe32.dwSize = sizeof(PROCESSENTRY32);

  if (Process32First(hSnapshot, &pe32)) {
    do {
      if (strcmp((const char*)pe32.szExeFile, processName.c_str()) == 0) {
        pids.push_back(pe32.th32ProcessID);
      }
    } while (Process32Next(hSnapshot, &pe32));
  }

  CloseHandle(hSnapshot);

  Napi::Array result = Napi::Array::New(env, pids.size());
  for (size_t i = 0; i < pids.size(); i++) {
    result.Set(i, Napi::Number::New(env, pids[i]));
  }

  return result;
}

Napi::Value FixWindowMethodA(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  // 检查参数数量和类型
  if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsObject()) {
    Napi::TypeError::New(env, "Expected zoom scale and configuration object").ThrowAsJavaScriptException();
    return env.Null();
  }

  double clientZoomScale = info[0].As<Napi::Number>().DoubleValue();
  Napi::Object config = info[1].As<Napi::Object>();

  if (clientZoomScale == -1) {
    Napi::Error::New(env, "Invalid original zoom of LeagueClientUx").ThrowAsJavaScriptException();
    return env.Null();
  }

  // 从配置对象中提取 baseWidth 和 baseHeight
  int baseWidth = config.Has("baseWidth") ? config.Get("baseWidth").As<Napi::Number>().Int32Value() : 1280;
  int baseHeight = config.Has("baseHeight") ? config.Get("baseHeight").As<Napi::Number>().Int32Value() : 720;

  HWND leagueClientWindowHWnd = FindWindowW(APPLICATION_CLASS_NAME, APPLICATION_NAME);
  HWND leagueClientWindowCefHWnd = FindWindowExW(leagueClientWindowHWnd, nullptr, CEF_WINDOW_NAME, nullptr);

  if (leagueClientWindowHWnd == nullptr || leagueClientWindowCefHWnd == nullptr) {
    Napi::Error::New(env, "Can't find LeagueClient window").ThrowAsJavaScriptException();
    return env.Null();
  }

  int screenWidth = GetSystemMetrics(SM_CXSCREEN);
  int screenHeight = GetSystemMetrics(SM_CYSCREEN);

  int width = static_cast<int>(baseWidth * clientZoomScale);
  int height = static_cast<int>(baseHeight * clientZoomScale);

  SetWindowPos(leagueClientWindowHWnd, HWND_TOP, (screenWidth - width) / 2, (screenHeight - height) / 2, width, height, SWP_NOZORDER);
  SetWindowPos(leagueClientWindowCefHWnd, HWND_TOP, 0, 0, width, height, SWP_NOZORDER);

  return Napi::Boolean::New(env, true);
}

Napi::Value GetLeagueClientWindowPlacementInfo(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  // 使用类名和窗口名查找窗口
  HWND hwnd = FindWindowW(APPLICATION_CLASS_NAME, APPLICATION_NAME);
  if (hwnd == NULL) {
    return env.Null();
  }

  WINDOWPLACEMENT wp;
  wp.length = sizeof(WINDOWPLACEMENT);
  if (!GetWindowPlacement(hwnd, &wp)) {
    return env.Null();
  }

  // 结合 IsIconic 和 IsZoomed 获取更准确的状态信息
  bool isMinimized = IsIconic(hwnd);
  bool isMaximized = IsZoomed(hwnd);
  bool isNormal = !isMinimized && !isMaximized;

  Napi::Object result = Napi::Object::New(env);
  result.Set("left", Napi::Number::New(env, wp.rcNormalPosition.left));
  result.Set("top", Napi::Number::New(env, wp.rcNormalPosition.top));
  result.Set("right", Napi::Number::New(env, wp.rcNormalPosition.right));
  result.Set("bottom", Napi::Number::New(env, wp.rcNormalPosition.bottom));
  result.Set("shownState", Napi::Number::New(env, wp.showCmd));

  result.Set("isMinimized", Napi::Boolean::New(env, isMinimized));
  result.Set("isMaximized", Napi::Boolean::New(env, isMaximized));
  result.Set("isNormal", Napi::Boolean::New(env, isNormal));

  return result;
}

Napi::Value IsElevated(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  bool bIsElevated = false;

  // Windows特定的权限检测
  BOOL isMember = FALSE;
  PSID administratorsGroup = nullptr;
  SID_IDENTIFIER_AUTHORITY SIDAuthNT = SECURITY_NT_AUTHORITY;

  if (AllocateAndInitializeSid(
          &SIDAuthNT, 2, SECURITY_BUILTIN_DOMAIN_RID, DOMAIN_ALIAS_RID_ADMINS,
          0, 0, 0, 0, 0, 0, &administratorsGroup)) {
    CheckTokenMembership(nullptr, administratorsGroup, &isMember);
  }

  if (administratorsGroup) {
    FreeSid(administratorsGroup);
  }

  bIsElevated = isMember ? true : false;

  return Napi::Boolean::New(env, bIsElevated);
}

bool TerminateProcessByID(DWORD processID) {
  HANDLE hProcess = OpenProcessFromPid(processID, PROCESS_TERMINATE);
  if (hProcess == NULL) {
    std::cerr << "Cannot open process: " << GetLastError() << std::endl;
    return false;
  }

  // 结束进程
  if (!TerminateProcess(hProcess, 0)) {
    std::cerr << "Cannot terminate process: " << GetLastError() << std::endl;
    CloseHandle(hProcess);
    return false;
  }

  CloseHandle(hProcess);
  return true;
}

Napi::Boolean TerminateProcessNode(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
    return Napi::Boolean::New(env, false);
  }

  DWORD processID = info[0].As<Napi::Number>().Uint32Value();
  bool result = TerminateProcessByID(processID);
  return Napi::Boolean::New(env, result);
}

bool IsProcessForeground(DWORD processID) {
  HWND hwndForeground = GetForegroundWindow();
  DWORD foregroundProcID;
  GetWindowThreadProcessId(hwndForeground, &foregroundProcID);
  return (foregroundProcID == processID);
}

Napi::Boolean IsProcessForegroundNode(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
    return Napi::Boolean::New(env, false);
  }

  DWORD processID = info[0].As<Napi::Number>().Uint32Value();
  bool isForeground = IsProcessForeground(processID);
  return Napi::Boolean::New(env, isForeground);
}
// 获取当前应用程序的路径
std::wstring GetCurrentAppPath()
{
  wchar_t buffer[MAX_PATH];
  // 显式调用 Unicode 版本的函数
  GetModuleFileNameW(NULL, buffer, MAX_PATH);
  return std::wstring(buffer);
}
// 检查当前进程是否以管理员权限运行
bool IsRunAsAdmin()
{
  BOOL fRet = FALSE;
  DWORD dwError = 0;
  PSID pAdministratorsGroup;
  SID_IDENTIFIER_AUTHORITY NtAuthority = SECURITY_NT_AUTHORITY;
  if (!AllocateAndInitializeSid(
          &NtAuthority,
          2,
          SECURITY_BUILTIN_DOMAIN_RID,
          DOMAIN_ALIAS_RID_ADMINS,
          0, 0, 0, 0, 0, 0,
          &pAdministratorsGroup))
  {
    dwError = GetLastError();
    return false;
  }
  if (!CheckTokenMembership(NULL, pAdministratorsGroup, &fRet))
  {
    dwError = GetLastError();
    FreeSid(pAdministratorsGroup);
    return false;
  }
  FreeSid(pAdministratorsGroup);
  return fRet;
}
// 请求管理员权限
bool RequestAdminPrivileges()
{
  if (IsRunAsAdmin())
  {
    return true;
  }
  std::wstring appPath = GetCurrentAppPath();
  HINSTANCE hInst = ShellExecuteW(NULL, L"runas", appPath.c_str(), NULL, NULL, SW_SHOWNORMAL);
  if ((int)hInst <= 32)
  {
    return false;
  }
  ExitProcess(0);
  return true;
}
// N-API 包装函数，用于在 Node.js 中调用请求管理员权限的功能
Napi::Value RequestAdmin(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  if (!RequestAdminPrivileges())
  {
    Napi::TypeError::New(env, "Failed to request admin privileges").ThrowAsJavaScriptException();
    return env.Null();
  }
  return Napi::Boolean::New(env, true);
}
Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("fixWindowMethodA", Napi::Function::New(env, FixWindowMethodA));
  exports.Set("isElevated", Napi::Function::New(env, IsElevated));
  exports.Set("GetLeagueClientWindowPlacementInfo", Napi::Function::New(env, GetLeagueClientWindowPlacementInfo));
  exports.Set("getCommandLine1", Napi::Function::New(env, GetCommandLine1));
  exports.Set("getPidsByName", Napi::Function::New(env, GetPidsByName));
  exports.Set("terminateProcess", Napi::Function::New(env, TerminateProcessNode));
  exports.Set("isProcessForeground", Napi::Function::New(env, IsProcessForegroundNode));
  exports.Set("requestAdmin", Napi::Function::New(env, RequestAdmin));
  return exports;
}

NODE_API_MODULE(addon, Init)
