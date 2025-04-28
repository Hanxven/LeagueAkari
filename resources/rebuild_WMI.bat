@Echo on
cd /d c:\temp
if not exist %windir%\system32\wbem goto TryInstall
cd /d %windir%\system32\wbem
net stop winmgmt
winmgmt /kill
if exist Rep_bak rd Rep_bak /s /q
rename Repository Rep_bak
for %%i in (*.dll) do RegSvr32 -s %%i
for %%i in (*.exe) do call :FixSrv %%i
for %%i in (*.mof,*.mfl) do Mofcomp %%i
net start winmgmt
goto End

:FixSrv
if /I (%1) == (wbemcntl.exe) goto SkipSrv
if /I (%1) == (wbemtest.exe) goto SkipSrv
if /I (%1) == (mofcomp.exe) goto SkipSrv
%1 /RegServer

:SkipSrv
goto End

:TryInstall
if not exist wmicore.exe goto End
wmicore /s
net start winmgmt
:End