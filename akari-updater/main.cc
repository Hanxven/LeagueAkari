#include <windows.h>
#include <tlhelp32.h>
#include <iostream>
#include <string>
#include <filesystem>
#include <chrono>
#include <thread>

namespace fs = std::filesystem;

// 卡住输出，方便截图给我看
static void wait_and_exit_on_error(const std::string& msg) {
  std::cerr << msg << std::endl;
  std::cerr << "Press ENTER to exit..." << std::endl;
  std::cin.get();
  std::exit(1);
}

static bool is_process_running(const std::string& processName) {
  HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
  if (hSnapshot == INVALID_HANDLE_VALUE) {
    return false;
  }
  PROCESSENTRY32 pe;
  pe.dwSize = sizeof(pe);
  if (Process32First(hSnapshot, &pe)) {
    do {
      if (_stricmp((const char*)pe.szExeFile, processName.c_str()) == 0) {
        CloseHandle(hSnapshot);
        return true;
      }
    } while (Process32Next(hSnapshot, &pe));
  }
  CloseHandle(hSnapshot);
  return false;
}

static void wait_for_process_stop(const std::string& processName) {
  while (is_process_running(processName)) {
    std::cout << "Process \"" << processName << "\" is running. Waiting for it to stop..." << std::endl;
    std::this_thread::sleep_for(std::chrono::seconds(2));
  }
}

int main(int argc, char* argv[]) {
  std::cout << "This is a simple update script for League Akari.\n\n";

  if (argc < 4) {
    std::cerr << "Usage: updater <source_dir> <target_dir> <process_name>\n";
    wait_and_exit_on_error("Invalid arguments.");
  }

  std::string sourceDir = argv[1];
  std::string targetDir = argv[2];
  std::string processName = argv[3];

  // 等待进程停止
  std::cout << "Checking if process \"" << processName << "\" is running..." << std::endl;
  wait_for_process_stop(processName);

  // 检查源目录和目标目录是否存在、并且是目录
  std::cout << "Checking source and target directories..." << std::endl;
  if (!fs::exists(sourceDir) || !fs::is_directory(sourceDir)) {
    wait_and_exit_on_error("Source directory invalid: " + sourceDir);
  }
  if (!fs::exists(targetDir) || !fs::is_directory(targetDir)) {
    wait_and_exit_on_error("Target directory invalid: " + targetDir);
  }

  // 将目标目录重命名做备份
  std::cout << "Renaming target directory as backup..." << std::endl;
  std::string backupDir = targetDir + ".bak";

  // 如果备份目录已存在，为了安全可以加一个时间戳或计数后缀，但既然已经存在了八成是之前的备份，就不管了
  if (fs::exists(backupDir)) {
    backupDir = targetDir + ".bak_" + std::to_string(std::time(nullptr));
  }
  try {
    fs::rename(targetDir, backupDir);
  } catch (std::exception& e) {
    wait_and_exit_on_error(std::string("Failed to rename target directory: ") + e.what());
  }

  // 将源目录复制到原本目标目录位置 (即替换)
  std::cout << "Copying source directory to target directory..." << std::endl;
  try {
    // C++17真好用
    fs::copy(sourceDir, targetDir, fs::copy_options::recursive);
  } catch (std::exception& e) {
    // 滚回到你的设置，坐和放宽
    try {
      fs::rename(backupDir, targetDir);
    } catch (...) {
    }
    wait_and_exit_on_error(std::string("Failed to copy source to target: ") + e.what());
  }

  // 如果上述步骤成功，删除重命名备份的目录，删除源目录
  std::cout << "Removing backup directory..." << std::endl;
  try {
    fs::remove_all(backupDir);
  } catch (std::exception& e) {
    // 删除失败不影响逻辑，但最好提示
    std::cerr << "Warning: Failed to remove backup directory: " << e.what() << "\n";
  }

  std::cout << "Removing source directory..." << std::endl;
  try {
    fs::remove_all(sourceDir);
  } catch (std::exception& e) {
    // 同理删除源目录失败也只是警告
    std::cerr << "Warning: Failed to remove source directory: " << e.what() << "\n";
  }

  // 启动新的进程
  // 注意：这里的 processName 应该与之前等待停止的进程同名，正常来说都是 LeagueAkari.exe
  std::cout << "Starting new process \"" << processName << "\"..." << std::endl;
  {
    // 假设进程在 targetDir 下，构建其完整路径
    fs::path newExePath = fs::path(targetDir) / processName;
    if (!fs::exists(newExePath)) {
      wait_and_exit_on_error("New process exe not found: " + newExePath.string());
    }

    STARTUPINFOA si = {0};
    si.cb = sizeof(si);
    PROCESS_INFORMATION pi = {0};

    std::string cmdLine = "\"" + newExePath.string() + "\"";
    char* cmd = new char[cmdLine.size() + 1];
    strcpy(cmd, cmdLine.c_str());

    if (!CreateProcessA(
            NULL,
            cmd,
            NULL, NULL,
            FALSE, 0, NULL,
            targetDir.c_str(),
            &si, &pi)) {
      delete[] cmd;
      wait_and_exit_on_error("Failed to start new process: " + processName);
    }
    delete[] cmd;

    // 不需要等待新进程结束，我直接启动啊
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
  }

  std::cout << "Update process completed successfully." << std::endl;

  return 0;
}
