@echo off
setlocal

cd /d "%~dp0"

echo ============================================
echo          AI Dev Studio - Starting
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed.
    echo Install Node.js 20+ from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js:
node -v
echo.

echo Checking dependencies...
if not exist "node_modules" (
    echo Installing packages...
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
) else (
    echo node_modules found.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo.
echo ============================================
echo       AI Dev Studio running on port 8080
echo ============================================
echo.
echo Local: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server.
echo.

start "" "http://localhost:8080"

call npm run dev -- --port 8080 --host

endlocal