# AG AI Admissions - Run Local Environment
# Double click or run: .\run-local.ps1

Set-Location $PSScriptRoot
Clear-Host
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "   AG AI Admissions - Local Environment" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host ""

# 1. Start the API server in a separate console window.
Write-Host "Starting the AG Admissions API (Gemini chat; CRM integrations are optional)..." -ForegroundColor Green
$backendPath = Join-Path $PSScriptRoot "Backend\mock-server"
Start-Process powershell -WorkingDirectory $backendPath -ArgumentList "-NoExit -Command `"`$Host.UI.RawUI.WindowTitle = 'AG Admissions API'; npm start`""

# 2. Start the Next.js frontend in the current window.
Write-Host "Starting the AG Next.js frontend on http://localhost:3000..." -ForegroundColor Cyan
Set-Location (Join-Path $PSScriptRoot "Frontend")
npm run dev
