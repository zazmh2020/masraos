@echo off
cd /d "%~dp0"
echo Starting MASRA on http://localhost:3000
echo Keep this window open while reviewing the website.
node scripts\local.mjs start
pause
