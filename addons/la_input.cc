#include <windows.h>
#include <napi.h>
#include <thread>
#include <string>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <vector>
#include <queue>

HHOOK hKeyboardHook;
std::mutex mtx;
std::condition_variable cv;
bool running = true;
std::string keyEventOutput;
Napi::ThreadSafeFunction tsfn;

std::queue<std::function<void()>> taskQueue;
bool sendingThreadRunning = true;
std::condition_variable taskCv;
std::mutex taskMtx;

LRESULT CALLBACK KeyboardEvent(int nCode, WPARAM wParam, LPARAM lParam) {
  if (nCode == HC_ACTION) {
    KBDLLHOOKSTRUCT* pKeyBoard = (KBDLLHOOKSTRUCT*)lParam;
    int key = pKeyBoard->vkCode;
    std::string action = (wParam == WM_KEYDOWN || wParam == WM_SYSKEYDOWN) ? "DOWN" : "UP";

    std::string keyEventOutput = std::to_string(key) + "," + action;

    if (tsfn) {
      tsfn.BlockingCall([keyEventOutput](Napi::Env env, Napi::Function jsCallback) {
        jsCallback.Call({Napi::String::New(env, keyEventOutput)});
      });
    }
  }
  return CallNextHookEx(hKeyboardHook, nCode, wParam, lParam);
}

void KeyboardHookThread() {
  HINSTANCE hInstance = GetModuleHandle(NULL);
  hKeyboardHook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyboardEvent, hInstance, 0);
  MSG message;
  while (GetMessage(&message, NULL, 0, 0) && running) {
    TranslateMessage(&message);
    DispatchMessage(&message);
  }
  UnhookWindowsHookEx(hKeyboardHook);
}

void SendTaskThread() {
  while (sendingThreadRunning) {
    std::function<void()> task;
    {
      std::unique_lock<std::mutex> lock(taskMtx);
      taskCv.wait(lock, [] { return !taskQueue.empty() || !sendingThreadRunning; });
      if (!sendingThreadRunning && taskQueue.empty()) {
        return;
      }
      task = std::move(taskQueue.front());
      taskQueue.pop();
    }
    task();
  }
}

Napi::Value StartHook(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  std::thread(KeyboardHookThread).detach();
  std::thread(SendTaskThread).detach();
  return env.Undefined();
}

Napi::Value StopHook(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  {
    std::lock_guard<std::mutex> lock(mtx);
    running = false;
  }
  {
    std::lock_guard<std::mutex> lock(taskMtx);
    sendingThreadRunning = false;
  }
  taskCv.notify_all();
  cv.notify_one();
  return env.Undefined();
}

Napi::Value OnKeyEvent(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!info[0].IsFunction()) {
    Napi::TypeError::New(env, "Expected a function as the first argument").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  Napi::Function callback = info[0].As<Napi::Function>();
  tsfn = Napi::ThreadSafeFunction::New(
      env,
      callback,           // JavaScript function to call
      "KeyEventCallback", // Resource name
      0,                  // Max queue size (0 = unlimited)
      1                   // Initial thread count
  );

  return env.Undefined();
}

void SendUnicode(wchar_t data) {
  INPUT input[2];
  memset(input, 0, 2 * sizeof(INPUT));

  input[0].type = INPUT_KEYBOARD;
  input[0].ki.wVk = 0;
  input[0].ki.wScan = data;
  input[0].ki.dwExtraInfo = 0;
  input[0].ki.dwFlags = KEYEVENTF_UNICODE;

  input[1].type = INPUT_KEYBOARD;
  input[1].ki.wVk = 0;
  input[1].ki.wScan = data;
  input[1].ki.dwExtraInfo = 0;
  input[1].ki.dwFlags = KEYEVENTF_KEYUP | KEYEVENTF_UNICODE;

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
    Napi::TypeError::New(env, "Wrong number of arguments: should be 2.").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  if (!info[0].IsNumber() || !info[1].IsBoolean()) {
    Napi::TypeError::New(env, "Wrong type of argument: should be [uint32, bool]").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  {
    std::lock_guard<std::mutex> lock(taskMtx);
    taskQueue.push([key = info[0].As<Napi::Number>().Uint32Value(), press = info[1].As<Napi::Boolean>().Value()]() {
      PressKey(key, press);
    });
  }
  taskCv.notify_one();

  return env.Undefined();
}

Napi::Value SendKeys(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Wrong number of arguments: should be 1.").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  if (!info[0].IsString()) {
    Napi::TypeError::New(env, "Wrong type of argument 0: should be a string.").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  std::u16string msg = info[0].As<Napi::String>().Utf16Value();

  {
    std::lock_guard<std::mutex> lock(taskMtx);
    taskQueue.push([msg]() {
      SendUnicodeString(msg);
    });
  }
  taskCv.notify_one();

  return env.Undefined();
}

/**
 * 尝试一点新的东西，让其可 async / await
 */
class SendKeysWorker : public Napi::AsyncWorker {
public:
  SendKeysWorker(const Napi::Env& env, const std::u16string& msg)
      : Napi::AsyncWorker(env), msg(msg), deferred(Napi::Promise::Deferred::New(env)) {};

  ~SendKeysWorker() {
  }

  void Execute() override {
    SendUnicodeString(msg);
  }

  void OnOK() override {
    deferred.Resolve(Env().Undefined());
  }

  void OnError(const Napi::Error& e) override {
    deferred.Reject(e.Value());
  }

  Napi::Promise GetPromise() { return deferred.Promise(); }

private:
  std::u16string msg;
  Napi::Promise::Deferred deferred;
};

class SendKeyWorker : public Napi::AsyncWorker {
public:
  SendKeyWorker(const Napi::Env& env, WORD key, bool press)
    : Napi::AsyncWorker(env), key(key), press(press), deferred(Napi::Promise::Deferred::New(env)) {}

  ~SendKeyWorker() {}

  void Execute() override {
    PressKey(key, press);
  }

  void OnOK() override {
    deferred.Resolve(Env().Undefined());
  }

  void OnError(const Napi::Error& e) override {
    deferred.Reject(e.Value());
  }

  Napi::Promise GetPromise() { return deferred.Promise(); }

private:
  WORD key;
  bool press;
  Napi::Promise::Deferred deferred;
};

class GetAllKeyStatesWorker : public Napi::AsyncWorker {
public:
  struct KeyStateInfo {
    int vkCode;
    bool isPressed;
    UINT scanCode;
  };

  GetAllKeyStatesWorker(const Napi::Env& env)
      : Napi::AsyncWorker(env)
      , deferred(Napi::Promise::Deferred::New(env)) {}

  ~GetAllKeyStatesWorker() {}

  void Execute() override {
    for (int vk = 0; vk < 256; ++vk) {
      SHORT state = GetAsyncKeyState(vk);
      bool pressed = (state & 0x8000) != 0;

      UINT scanCode = MapVirtualKey(vk, MAPVK_VK_TO_VSC);

      KeyStateInfo info;
      info.vkCode    = vk;
      info.isPressed = pressed;
      info.scanCode  = scanCode;

      results.push_back(info);
    }
  }

  void OnOK() override {
    Napi::Env env = Env();

    Napi::Array arr = Napi::Array::New(env, results.size());
    for (size_t i = 0; i < results.size(); i++) {
      Napi::Object entry = Napi::Object::New(env);
      entry.Set("vkCode",    Napi::Number::New(env, results[i].vkCode));
      entry.Set("pressed",   Napi::Boolean::New(env, results[i].isPressed));
      entry.Set("scanCode",  Napi::Number::New(env, results[i].scanCode));

      arr.Set(i, entry);
    }

    deferred.Resolve(arr);
  }

  void OnError(const Napi::Error& e) override {
    deferred.Reject(e.Value());
  }

  Napi::Promise GetPromise() { return deferred.Promise(); }

private:
  Napi::Promise::Deferred deferred;
  std::vector<KeyStateInfo> results;
};

Napi::Value SendKeysAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1) {
    Napi::TypeError::New(env, "Wrong number of arguments: should be 1.").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  if (!info[0].IsString()) {
    Napi::TypeError::New(env, "Wrong type of argument 0: should be a string.").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  std::u16string msg = info[0].As<Napi::String>().Utf16Value();

  SendKeysWorker* worker = new SendKeysWorker(env, msg);
  Napi::Promise promise = worker->GetPromise();
  worker->Queue();

  return promise;
}

Napi::Value SendKeyAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Wrong number of arguments: should be 2.").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  if (!info[0].IsNumber() || !info[1].IsBoolean()) {
    Napi::TypeError::New(env, "Wrong type of arguments: should be [uint32, bool]").ThrowAsJavaScriptException();
    return env.Undefined();
  }

  WORD key = static_cast<WORD>(info[0].As<Napi::Number>().Uint32Value());
  bool press = info[1].As<Napi::Boolean>().Value();

  SendKeyWorker* worker = new SendKeyWorker(env, key, press);
  Napi::Promise promise = worker->GetPromise();
  worker->Queue();

  return promise;
}

Napi::Value GetAllKeyStatesAsync(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  GetAllKeyStatesWorker* worker = new GetAllKeyStatesWorker(env);
  Napi::Promise promise = worker->GetPromise();
  worker->Queue();
  return promise;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "startHook"), Napi::Function::New(env, StartHook));
  exports.Set(Napi::String::New(env, "stopHook"), Napi::Function::New(env, StopHook));
  exports.Set(Napi::String::New(env, "onKeyEvent"), Napi::Function::New(env, OnKeyEvent));
  exports.Set(Napi::String::New(env, "sendKey"), Napi::Function::New(env, SendKey));
  exports.Set(Napi::String::New(env, "sendKeys"), Napi::Function::New(env, SendKeys));
  exports.Set(Napi::String::New(env, "sendKeysAsync"), Napi::Function::New(env, SendKeysAsync));
  exports.Set(Napi::String::New(env, "sendKeyAsync"), Napi::Function::New(env, SendKeyAsync));
  exports.Set(Napi::String::New(env, "getAllKeyStatesAsync"), Napi::Function::New(env, GetAllKeyStatesAsync));
  return exports;
}

NODE_API_MODULE(keyboardhook, Init)
