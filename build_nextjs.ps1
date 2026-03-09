$nextUrls = @(
  ".\apps\services\analytics",
  ".\apps\services\moderation",
  ".\apps\services\notification",
  ".\apps\services\search",
  ".\apps\services\settings",
  ".\apps\services\timeline"
)

$rootDir = Get-Location
foreach ($dir in $nextUrls) {
    Write-Host "========================================"
    Write-Host "Building $dir"
    Write-Host "========================================"
    if (Test-Path $dir) {
        Set-Location $dir
        npm.cmd run build
        Set-Location $rootDir
    }
}
Write-Host "All done building!"
