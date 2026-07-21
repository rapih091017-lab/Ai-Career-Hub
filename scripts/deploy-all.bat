@echo off
cls
echo ============================================
echo  🚀 AI Career Hub — Deploy All
echo ============================================
echo.
echo  This script will:
echo    1. Build the Next.js app for production
echo    2. Deploy to Vercel (main app)
echo    3. Deploy to Railway (pdf-server)
echo.
pause

:: ── 1. Build Next.js ──
echo.
echo [1/3] Building Next.js app...
call npx next build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed! Fix errors before deploying.
    pause
    exit /b 1
)
echo ✅ Build successful!

:: ── 2. Deploy to Vercel ──
echo.
echo [2/3] Deploying to Vercel...
call npx vercel --prod
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ Vercel deploy may have issues. Check the output above.
)

:: ── 3. Deploy pdf-server to Railway ──
echo.
echo [3/3] Deploying pdf-server to Railway...
echo.
echo NOTE: Railway deploy requires:
echo   - Railway CLI: npm i -g @railway/cli
echo   - Or push to GitHub and deploy from Railway dashboard
echo.
echo Run manually:
echo   cd pdf-server
echo   railway up
echo.
echo ============================================
echo  ✅ Done! Don't forget to set env vars:
echo ============================================
echo.
echo  Vercel (https://vercel.com/dashboard):
echo    DATABASE_URL       = your-postgres-url
echo    AUTH_SECRET        = openssl rand -base64 32
echo    DEEPSEEK_API_KEY   = your-deepseek-key
echo    PDF_SERVER_URL     = https://pdf-server.up.railway.app
echo    (plus all vars from .env.example)
echo.
echo  Railway (https://railway.app/dashboard):
echo    PUPPETEER_EXECUTABLE_PATH = /usr/bin/chromium
echo    PDF_SERVER_PORT           = 3001
echo.
pause
