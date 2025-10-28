@echo off
setlocal enabledelayedexpansion

echo ?? Deploying application...

REM Get current version from package.json
for /f "tokens=*" %%a in ('node -p "require('./package.json').version"') do set CURRENT_VERSION=%%a
echo Current version: %CURRENT_VERSION%

REM Ask for deployment environment
set /p DEPLOY_ENV="Enter deployment environment [staging/production]: "

if "%DEPLOY_ENV%"=="" (
    echo ? No environment provided. Exiting...
    exit /b 1
)

if not "%DEPLOY_ENV%"=="staging" if not "%DEPLOY_ENV%"=="production" (
    echo ? Invalid environment. Please choose staging or production.
    exit /b 1
)

echo ?? Deploying version %CURRENT_VERSION% to %DEPLOY_ENV%...

REM Build Docker image
echo ?? Building Docker image...
docker build -t gauzy-app:%CURRENT_VERSION% -f Dockerfile .

REM Tag for deployment
if "%DEPLOY_ENV%"=="production" (
    docker tag gauzy-app:%CURRENT_VERSION% gauzy-app:production
    echo ???  Tagged as production
) else (
    docker tag gauzy-app:%CURRENT_VERSION% gauzy-app:staging
    echo ???  Tagged as staging
)

echo ? Deployment preparation completed!
echo ?? Next steps:
echo    - Push image to registry: docker push gauzy-app:%CURRENT_VERSION%
echo    - Deploy to %DEPLOY_ENV% environment

endlocal
