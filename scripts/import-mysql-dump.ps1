# Import MySQL dump (db_werfiedb_*.sql.gz) into MySQL
# Prerequisites: MySQL running (local or via Docker)
# If using Docker: docker compose -f docker-compose.yml -f docker-compose.mysql-import.yml up -d mysql

param(
    [string]$DumpPath = "db_werfiedb_20260227_023004_mysql_data (1).sql.gz",
    [string]$DbHost = "localhost",
    [int]$Port = 3306,
    [string]$User = "root",
    [string]$Password = "root",
    [string]$Database = "werfiedb"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DumpFullPath = Join-Path $ProjectRoot $DumpPath

if (-not (Test-Path $DumpFullPath)) {
    Write-Error "Dump file not found: $DumpFullPath"
}

Write-Host "Importing MySQL dump into $Database..." -ForegroundColor Cyan
Write-Host "Dump: $DumpFullPath" -ForegroundColor Gray
Write-Host "Target: $User@${DbHost}:$Port" -ForegroundColor Gray

# Try common decompression tools
$tempSql = Join-Path $env:TEMP "werfie_import_$(Get-Date -Format 'yyyyMMddHHmmss').sql"

function Decompress-Gzip {
    param([string]$InputPath, [string]$OutputPath)
    # Use .NET GZipStream
    $in = [System.IO.File]::OpenRead($InputPath)
    $gzip = [System.IO.Compression.GZipStream]::new($in, [System.IO.Compression.CompressionMode]::Decompress)
    $out = [System.IO.File]::Create($OutputPath)
    $buffer = New-Object byte[] 65536
    $total = 0
    do {
        $read = $gzip.Read($buffer, 0, $buffer.Length)
        if ($read -gt 0) {
            $out.Write($buffer, 0, $read)
            $total += $read
            if ($total % 10485760 -lt 65536) { Write-Host "  Decompressed $([math]::Round($total/1MB,1)) MB..." }
        }
    } while ($read -gt 0)
    $gzip.Close()
    $in.Close()
    $out.Close()
}

try {
    Write-Host "`n[1/2] Decompressing dump..." -ForegroundColor Yellow
    Decompress-Gzip -InputPath $DumpFullPath -OutputPath $tempSql
    Write-Host "  Done. Size: $([math]::Round((Get-Item $tempSql).Length/1MB,1)) MB" -ForegroundColor Green

    Write-Host "`n[2/2] Importing into MySQL (this may take several minutes)..." -ForegroundColor Yellow
    $mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
    if ($mysqlCmd -and $DbHost -eq "localhost") {
        $env:MYSQL_PWD = $Password
        Get-Content $tempSql | mysql -h $DbHost -P $Port -u $User $Database 2>&1
    } else {
        # Use Docker when mysql client not installed or using Docker MySQL
        $containerName = "werfie-mysql"
        docker cp $tempSql "${containerName}:/tmp/werfie_import.sql"
        docker exec -e "MYSQL_PWD=$Password" $containerName mysql -u $User $Database -e "source /tmp/werfie_import.sql"
        docker exec $containerName rm -f /tmp/werfie_import.sql
    }
    if ($LASTEXITCODE -ne 0) {
        throw "MySQL import failed with exit code $LASTEXITCODE"
    }
    Write-Host "  Import complete!" -ForegroundColor Green
}
finally {
    $env:MYSQL_PWD = $null
    if (Test-Path $tempSql) {
        Remove-Item $tempSql -Force
        Write-Host "`nCleaned up temp file." -ForegroundColor Gray
    }
}
