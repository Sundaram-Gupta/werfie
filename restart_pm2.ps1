# Restart all PM2 services (build Next.js apps first, then start)
param([switch]$SkipBuild)
$root = Get-Location
if (-not $SkipBuild) {
    Write-Host "Building Next.js apps..."
    & "$PSScriptRoot\build_nextjs.ps1"
}
Write-Host "Stopping all PM2 processes..."
pm2 delete all 2>$null
Write-Host "Starting ecosystem..."
pm2 start ecosystem.config.js
pm2 save
Write-Host "Done. Run: pm2 list"
