@echo off
setlocal enabledelayedexpansion

echo ???  Creating release for NestJS application...

REM Get current version from package.json
for /f "tokens=*" %%a in ('node -p "require('./package.json').version"') do set CURRENT_VERSION=%%a
echo Current version: %CURRENT_VERSION%

REM Ask for new version
set /p NEW_VERSION="Enter new version (current: %CURRENT_VERSION%): "

if "%NEW_VERSION%"=="" (
    echo ? No version provided. Exiting...
    exit /b 1
)

REM Update package.json version
echo ?? Updating package.json version to %NEW_VERSION%...
call npm version %NEW_VERSION% --no-git-tag-version

REM Build the application
echo ?? Building application...
call yarn build
if %errorlevel% neq 0 (
    echo ? Build failed!
    exit /b 1
)

REM Run tests
echo ?? Running tests...
call yarn test
if %errorlevel% neq 0 (
    echo ?? Tests failed, but continuing...
)

REM Build Docker image with version tag
echo ?? Building Docker image with tag %NEW_VERSION%...
docker build -t gauzy-app:%NEW_VERSION% -f Dockerfile .
docker build -t gauzy-app:latest -f Dockerfile .

REM Commit changes if git is available
git rev-parse --git-dir >nul 2>&1
if %errorlevel% equ 0 (
    echo ?? Committing version bump...
    git add package.json package-lock.json
    git commit -m "chore: bump version to %NEW_VERSION%"
    git tag -a "v%NEW_VERSION%" -m "Release version %NEW_VERSION%"
    echo ? Created git tag v%NEW_VERSION%
)

echo ? Release %NEW_VERSION% created successfully!
echo ?? Docker images tagged: gauzy-app:%NEW_VERSION%, gauzy-app:latest

endlocal
