@echo off
setlocal
cd /d "%~dp0.."
where docker >nul 2>&1
if errorlevel 1 (
  echo.
  echo Docker CLI was not found.
  echo Install Docker Desktop, start it, then reopen VS Code/terminal.
  echo Download: https://www.docker.com/products/docker-desktop/
  pause
  exit /b 1
)
docker compose down
if errorlevel 1 (
  echo.
  echo Failed to stop project.
  pause
  exit /b 1
)
echo.
echo Project stopped.
pause
