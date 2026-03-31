$rootSchema = "master_schema.prisma"
$schemaFiles = Get-ChildItem -Recurse -Filter "schema.prisma" | Where-Object { $_.FullName -notmatch "node_modules" -and $_.Name -eq "schema.prisma" -and $_.FullName -ne (Join-Path (Get-Location) $rootSchema) }

foreach ($file in $schemaFiles) {
    Write-Host "Syncing $rootSchema -> $($file.FullName)"
    Copy-Item $rootSchema $file.FullName -Force
    
    # Check if a prisma project (has package.json nearby)
    $dir = $file.Directory.Parent.FullName
    if (Test-Path (Join-Path $dir "package.json")) {
        Write-Host "Regenerating client in $dir"
        Push-Location $dir
        try {
            npx prisma generate
        } catch {
            Write-Warning "Prisma generate failed in $dir"
        }
        Pop-Location
    }
}
