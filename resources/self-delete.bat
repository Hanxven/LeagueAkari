@echo off
chcp 65001 >nul

if "%~1"=="" (
    echo Usage: delete_paths.bat path1 [path2 ... pathN]
    exit /b 1
)

echo Prepared to delete League Akari...

timeout /t 5 >nul

:delete_loop
if "%~1"=="" goto end

if exist "%~1" (
    echo Deleting: %~1
    rd /s /q "%~1"
    if errorlevel 1 (
        echo Unable to delete: %~1
    ) else (
        echo Deleted: %~1
    )
) else (
    echo Not found: %~1
)

shift
goto delete_loop

:end
echo End. Hoping to meet you again. Love from League Akari.
