@echo off
setlocal
cd /d "%~dp0"
set "GRIMORIO_NODE="
for /f "delims=" %%N in ('where node 2^>nul') do if not defined GRIMORIO_NODE set "GRIMORIO_NODE=%%N"
if not defined GRIMORIO_NODE for /d %%R in ("%LOCALAPPDATA%\OpenAI\Codex\runtimes\cua_node\*") do if exist "%%~fR\bin\node.exe" set "GRIMORIO_NODE=%%~fR\bin\node.exe"
if not defined GRIMORIO_NODE (
  echo Instale o Node.js 24 LTS de https://nodejs.org e tente novamente.
  pause
  exit /b 1
)
"%GRIMORIO_NODE%" -e "if(Number(process.versions.node.split('.')[0])<24){console.error('E necessario Node.js 24 ou superior.');process.exit(1)}"
if errorlevel 1 (
  pause
  exit /b 1
)
echo.
echo Abra http://127.0.0.1:3210 no navegador.
echo Mantenha esta janela aberta. Use Ctrl+C para encerrar.
echo.
"%GRIMORIO_NODE%" server.mjs
if errorlevel 1 pause
