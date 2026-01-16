@echo off
echo Starting Photo Library...
cd /d "%~dp0"

if not exist "node_modules" (
    echo node_modules not found. Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Error installing dependencies.
        pause
        exit /b %ERRORLEVEL%
    )
)

echo Starting development server...
call npm run dev

if %ERRORLEVEL% NEQ 0 (
    echo Server stopped with error.
    pause
)
