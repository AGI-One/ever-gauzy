@echo off
setlocal

REM Usage:
REM bin\up.bat prod
REM bin\up.bat local

set env=%1

REM Ensure the databases network exists
echo ?? Checking if databases network exists...
docker network ls | findstr "databases" >nul 2>&1
if %errorlevel% neq 0 (
    echo ???  Creating databases network...
    docker network create databases
) else (
    echo ? databases network already exists
)

if "%env%"=="local" (
    echo ?? Starting NestJS application in local mode...
    docker compose -f docker-compose.local.yml up
    goto :end
)

if "%env%"=="localbuild" (
    echo ?? Starting NestJS application in local mode with build...
    docker compose -f docker-compose.local.yml up --build
    goto :end
)

if "%env%"=="prod" (
    echo ?? Starting NestJS application in production mode...
    docker compose -f docker-compose.prod.yml up -d
    goto :end
)

echo Environment not found! please choose [local, prod]
exit /b 1

:end
endlocal
