@echo off
echo ==========================================
echo      Starting Deployment Process
echo ==========================================

echo.
echo 1. Building the application...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed! Please check the errors above.
    pause
    exit /b %errorlevel%
)
echo ✅ Build successful!

echo.
echo 2. Applying CORS configuration to Firebase Storage...
gsutil cors set cors.json gs://lifeasy-lib-9dc5b.appspot.com
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  CORS configuration failed! Continuing with deployment...
    echo Note: You may need to run apply-cors.bat separately
) else (
    echo ✅ CORS configuration applied!
)

echo.
echo 3. Deploying to Firebase Hosting...
call npx firebase deploy --only hosting --project lifeasy-lib-9dc5b
if %errorlevel% neq 0 (
    echo.
    echo ❌ Deployment failed! Please check the errors above.
    pause
    exit /b %errorlevel%
)

echo.
echo ==========================================
echo      🚀 Deployment Successful!
echo ==========================================
pause
