@echo off
setlocal

if not exist .env (
    echo ? File .env không t?n t?i.
    exit /b 1
)

echo ?? ?ang load bi?n t? .env vào môi tr??ng hi?n t?i...

REM Read .env file and set environment variables
for /f "usebackq tokens=*" %%a in (".env") do (
    set line=%%a
    REM Skip empty lines and comments
    if not "!line!"=="" (
        echo !line! | findstr /r "^#" >nul
        if errorlevel 1 (
            REM Set the environment variable
            set %%a
        )
    )
)

echo ? Bi?n môi tr??ng ?ã ???c load.

endlocal
