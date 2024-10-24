@echo off
chcp 65001 >nul

if "%~1"=="" goto :EOF
if "%~2"=="" goto :EOF
if "%~3"=="" goto :EOF

set "SOURCE_A=%~1"
set "TARGET_C=%~2"
set "EXECUTABLE_NAME=%~3"

:: Wait for a specific process to end
echo Waiting for process %EXECUTABLE_NAME% to end...
:WAIT_PROCESS
set "PROCESS_NAME=%EXECUTABLE_NAME%"
tasklist | find /i "%PROCESS_NAME%" >nul
if not errorlevel 1 (
    timeout /t 1 >nul
    goto :WAIT_PROCESS
)

echo Process %EXECUTABLE_NAME% has ended.

:: Get directory B (the parent directory of C)
echo Getting the parent directory of target %TARGET_C%...
for %%I in ("%TARGET_C%") do (
    set "DEST_B=%%~dpI"
)

:: Remove trailing backslash
set "DEST_B=%DEST_B:~0,-1%"

:: Check if source directory A exists, if not, exit
echo Checking if source directory %SOURCE_A% exists...
if not exist "%SOURCE_A%" goto :EOF

echo Source directory %SOURCE_A% exists.

:: Copy directory A to B
echo Copying directory %SOURCE_A% to %DEST_B%\A...
xcopy /E /I /Y "%SOURCE_A%" "%DEST_B%\A" >nul

echo Copy completed.

:: Delete target directory C (if it exists)
echo Deleting target directory %TARGET_C% (if it exists)...
if exist "%TARGET_C%" (
    rd /S /Q "%TARGET_C%"
    echo Target directory %TARGET_C% has been deleted.
)

:: Rename directory A in B to C
echo Renaming %DEST_B%\A to %~nx2...
rename "%DEST_B%\A" "%~nx2"
echo Rename completed.

:: Delete original directory A
echo Deleting original directory %SOURCE_A%...
rd /S /Q "%SOURCE_A%"
echo Original directory %SOURCE_A% has been deleted.

:: Change to new C directory
echo Changing to new target directory %TARGET_C%...
pushd "%TARGET_C%"

:: Start executable without waiting for it to finish
echo Starting executable %EXECUTABLE_NAME%...
start "" "%EXECUTABLE_NAME%"
echo Executable has been started.

:: Return to previous directory
echo Returning to the previous directory...
popd

:: Delete the script itself
echo Deleting the script itself...
del /f /q "%~f0"
