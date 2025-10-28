@echo off
setlocal

if not exist .env (
    echo ? File .env kh�ng t?n t?i.
    exit /b 1
)

echo ?? ?ang load bi?n t? .env v�o m�i tr??ng hi?n t?i...

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

echo ? Bi?n m�i tr??ng ?� ???c load.

endlocal
