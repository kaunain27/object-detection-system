$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
Set-Location ..

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
	Write-Host 'Docker CLI was not found.' -ForegroundColor Red
	Write-Host 'Install Docker Desktop, start it, then restart VS Code/terminal.' -ForegroundColor Yellow
	Write-Host 'Download: https://www.docker.com/products/docker-desktop/' -ForegroundColor Yellow
	exit 1
}

Write-Host 'Starting backend + frontend with Docker Compose...'
docker compose up -d --build
Write-Host 'Done. Open http://localhost:5173'
