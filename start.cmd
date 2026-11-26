@echo off
REM Double-click launcher: serves this folder over http and opens it.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [start.cmd] node was not found on PATH.
  echo Install Node.js from https://nodejs.org/ and double-click again.
  echo Alternative without Node: python3 -m http.server 8000
  pause
  exit /b 1
)
if not "%~1"=="" ( set BUNDLE_PORT=%~1 ) else ( set BUNDLE_PORT=8000 )
node serve.mjs %BUNDLE_PORT%
if errorlevel 1 (
  echo [start.cmd] the server stopped with an error - see above.
  pause
  exit /b 1
)
