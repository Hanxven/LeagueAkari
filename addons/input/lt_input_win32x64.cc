#include <napi.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <windows.h>

void SendUnicode(wchar_t data) {
  INPUT input[2];
  memset(input, 0, 2 * sizeof(INPUT));

  input[0].type = INPUT_KEYBOARD;
  input[0].ki.wVk = 0;
  input[0].ki.wScan = data;
  input[0].ki.dwExtraInfo = 0;
  input[0].ki.dwFlags = 0x4; // KEYEVENTF_UNICODE;

  input[1].type = INPUT_KEYBOARD;
  input[1].ki.wVk = 0;
  input[1].ki.wScan = data;
  input[1].ki.dwExtraInfo = 0;
  input[1].ki.dwFlags = KEYEVENTF_KEYUP | 0x4; // KEYEVENTF_UNICODE;

  SendInput(2, input, sizeof(INPUT));
}

void SendUnicodeString(const std::u16string& msg) {
  size_t inputCount = msg.length() * 2;
  std::vector<INPUT> inputs(inputCount);

  for (size_t i = 0, j = 0; i < msg.length(); ++i, j += 2) {
    wchar_t ch = msg[i];

    inputs[j].type = INPUT_KEYBOARD;
    inputs[j].ki.wVk = 0;
    inputs[j].ki.wScan = ch;
    inputs[j].ki.dwFlags = KEYEVENTF_UNICODE;
    inputs[j].ki.time = 0;
    inputs[j].ki.dwExtraInfo = 0;

    inputs[j + 1].type = INPUT_KEYBOARD;
    inputs[j + 1].ki.wVk = 0;
    inputs[j + 1].ki.wScan = ch;
    inputs[j + 1].ki.dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP;
    inputs[j + 1].ki.time = 0;
    inputs[j + 1].ki.dwExtraInfo = 0;
  }

  SendInput(static_cast<UINT>(inputs.size()), &inputs[0], sizeof(INPUT));
}

void SendAscii(wchar_t data, BOOL shift) {
  INPUT input[2];
  memset(input, 0, 2 * sizeof(INPUT));

  if (shift) {
    input[0].type = INPUT_KEYBOARD;
    input[0].ki.wVk = VK_SHIFT;
    SendInput(1, input, sizeof(INPUT));
  }

  input[0].type = INPUT_KEYBOARD;
  input[0].ki.wVk = data;

  input[1].type = INPUT_KEYBOARD;
  input[1].ki.wVk = data;
  input[1].ki.dwFlags = KEYEVENTF_KEYUP;

  SendInput(2, input, sizeof(INPUT));

  if (shift) {
    input[0].type = INPUT_KEYBOARD;
    input[0].ki.wVk = VK_SHIFT;
    input[0].ki.dwFlags = KEYEVENTF_KEYUP;
    SendInput(1, input, sizeof(INPUT));
  }
}

Napi::Value SendKeys(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1) {
    Napi::TypeError::New(env, "League Toolkit - Wrong number of arguments: should be 1.").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  if (!info[0].IsString()) {
    Napi::TypeError::New(env, "League Toolkit - Wrong type of argument 0: should be a string.").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  short vk;
  BOOL shift;

  std::u16string msg = info[0].As<Napi::String>().Utf16Value();

  for (size_t i = 0; i < msg.length(); i++) {
    wchar_t ch = msg[i];
    SendUnicode(ch);
  }

  return env.Undefined();
}

Napi::Value SendKeysX(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1) {
    Napi::TypeError::New(env, "League Toolkit - Wrong number of arguments: should be 1.").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  if (!info[0].IsString()) {
    Napi::TypeError::New(env, "League Toolkit - Wrong type of argument 0: should be a string.").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  std::u16string msg = info[0].As<Napi::String>().Utf16Value();

  SendUnicodeString(msg);

  return env.Undefined();
}

WORD GetScanCode(WORD virtualKeyCode) {
  return static_cast<WORD>(MapVirtualKey(virtualKeyCode, MAPVK_VK_TO_VSC));
}

void PressKey(WORD key, bool press) {
  INPUT input = {0};
  input.type = INPUT_KEYBOARD;
  input.ki.wVk = key;
  input.ki.wScan = GetScanCode(key);

  if (!press) {
    input.ki.dwFlags = KEYEVENTF_KEYUP;
  }

  SendInput(1, &input, sizeof(INPUT));
}

Napi::Value SendKey(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 2) {
    Napi::TypeError::New(env, "League Toolkit - Wrong number of arguments: should be 2.").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  if (!info[0].IsNumber() || !info[1].IsBoolean()) {
    Napi::TypeError::New(env, "League Toolkit - Wrong type of argument: should be [uint32, bool]").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  PressKey(info[0].As<Napi::Number>().Uint32Value(), info[1].As<Napi::Boolean>().Value());
  return env.Undefined();
}

Napi::FunctionReference keysPressedCallback;
Napi::FunctionReference keyUpDownCallback;

std::vector<bool> keysPressed(384, false);

void HandleKeyUpDown(PKBDLLHOOKSTRUCT p, bool isKeyDown) {
  if (!keyUpDownCallback.IsEmpty()) {
    auto env = keyUpDownCallback.Env();
    Napi::HandleScope scope(env);

    Napi::Object eventObj = Napi::Object::New(env);
    eventObj.Set("keyCode", Napi::Number::New(env, p->vkCode));
    eventObj.Set("isKeyDown", Napi::Boolean::New(env, isKeyDown));

    keyUpDownCallback.Call({eventObj});
  }
}

LRESULT CALLBACK KeyboardProc(int nCode, WPARAM wParam, LPARAM lParam) {
  if (nCode == HC_ACTION) {
    PKBDLLHOOKSTRUCT p = (PKBDLLHOOKSTRUCT)lParam;

    if (wParam == WM_KEYDOWN || wParam == WM_KEYUP) {
      HandleKeyUpDown(p, wParam == WM_KEYDOWN);

      if (!keysPressedCallback.IsEmpty()) {
        keysPressed[p->vkCode] = (wParam == WM_KEYDOWN);

        // 当需要调用JavaScript回调时
        if (wParam == WM_KEYDOWN) {
          auto env = keysPressedCallback.Env();
          Napi::HandleScope scope(env);
          Napi::Array jsArray = Napi::Array::New(env);

          for (int i = 0; i < keysPressed.size(); ++i) {
            if (keysPressed[i]) {
              jsArray[jsArray.Length()] = Napi::Number::New(env, i);
            }
          }

          keysPressedCallback.Call({jsArray});
        }
      }
    }
  }
  return CallNextHookEx(NULL, nCode, wParam, lParam);
}

HHOOK hook = NULL;

Napi::Value RegisterHook(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (hook) {
    return Napi::Number::New(env, 0);
  }

  hook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyboardProc, NULL, 0);

  return Napi::Number::New(env, reinterpret_cast<uintptr_t>(hook));
}

Napi::Value OnKeysPressed(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsFunction()) {
    Napi::TypeError::New(env, "League Toolkit - Function expected").ThrowAsJavaScriptException();
  }

  keysPressedCallback = Napi::Persistent(info[0].As<Napi::Function>());

  return env.Undefined();
}

Napi::Value OnKeyUpDown(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsFunction()) {
    Napi::TypeError::New(env, "League Toolkit - Function expected").ThrowAsJavaScriptException();
  }

  keyUpDownCallback = Napi::Persistent(info[0].As<Napi::Function>());

  return env.Undefined();
}

Napi::Value UninstallHook(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (hook != NULL) {
    UnhookWindowsHookEx(hook);
    keysPressedCallback.Reset();
    keyUpDownCallback.Reset();
    hook = NULL;
  }
  return env.Undefined();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "sendKey"), Napi::Function::New(env, SendKey));
  exports.Set(Napi::String::New(env, "sendKeys"), Napi::Function::New(env, SendKeys));
  exports.Set(Napi::String::New(env, "sendKeysX"), Napi::Function::New(env, SendKeysX));
  exports.Set(Napi::String::New(env, "setOnKeysPressed"), Napi::Function::New(env, OnKeysPressed));
  exports.Set(Napi::String::New(env, "setOnKeyUpDown"), Napi::Function::New(env, OnKeyUpDown));
  exports.Set(Napi::String::New(env, "install"), Napi::Function::New(env, RegisterHook));
  exports.Set(Napi::String::New(env, "uninstall"), Napi::Function::New(env, UninstallHook));
  return exports;
}

NODE_API_MODULE(addon, Init)