#include <iostream>
#include <napi.h>
#include <shlobj.h>
#include <windows.h>

constexpr wchar_t APPLICATION_CLASS_NAME[] = L"RCLIENT";
constexpr wchar_t APPLICATION_NAME[] = L"League of Legends";
constexpr wchar_t CEF_WINDOW_NAME[] = L"CefBrowserWindow";

Napi::Value FixWindowMethodA(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  // 检查参数数量和类型
  if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsObject()) {
    Napi::TypeError::New(env, "League Akari - Expected zoom scale and configuration object").ThrowAsJavaScriptException();
    return env.Null();
  }

  double clientZoomScale = info[0].As<Napi::Number>().DoubleValue();
  Napi::Object config = info[1].As<Napi::Object>();

  if (clientZoomScale == -1) {
    Napi::Error::New(env, "League Akari - Invalid original zoom of LeagueClientUx").ThrowAsJavaScriptException();
    return env.Null();
  }

  // 从配置对象中提取 baseWidth 和 baseHeight
  int baseWidth = config.Has("baseWidth") ? config.Get("baseWidth").As<Napi::Number>().Int32Value() : 1280;
  int baseHeight = config.Has("baseHeight") ? config.Get("baseHeight").As<Napi::Number>().Int32Value() : 720;

  HWND leagueClientWindowHWnd = FindWindowW(APPLICATION_CLASS_NAME, APPLICATION_NAME);
  HWND leagueClientWindowCefHWnd = FindWindowExW(leagueClientWindowHWnd, nullptr, CEF_WINDOW_NAME, nullptr);

  if (leagueClientWindowHWnd == nullptr || leagueClientWindowCefHWnd == nullptr) {
    Napi::Error::New(env, "League Akari - Can't find LeagueClient window").ThrowAsJavaScriptException();
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

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("fixWindowMethodA", Napi::Function::New(env, FixWindowMethodA));
  exports.Set("isElevated", Napi::Function::New(env, IsElevated));
  return exports;
}

NODE_API_MODULE(addon, Init)
