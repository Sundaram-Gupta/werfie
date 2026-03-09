$dirs = @(
  ".\adminBackend",
  ".\apps\admin",
  ".\apps\backend\auth-service-js",
  ".\apps\client",
  ".\apps\services\analytics",
  ".\apps\services\content",
  ".\apps\services\messaging",
  ".\apps\services\moderation",
  ".\apps\services\monetization",
  ".\apps\services\notification",
  ".\apps\services\search",
  ".\apps\services\settings",
  ".\apps\services\timeline",
  ".\apps\services\user"
)

$rootDir = Get-Location

foreach ($dir in $dirs) {
    Write-Host "========================================"
    Write-Host "Installing dependencies in $dir"
    Write-Host "========================================"
    if (Test-Path $dir) {
        Set-Location $dir
        npm.cmd install
        Set-Location $rootDir
    } else {
        Write-Host "Directory $dir not found, skipping."
    }
}
Write-Host "All done!"
