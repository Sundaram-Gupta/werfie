$port = 3001
Write-Host "Checking for process on port $port..."
$tcp = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($tcp) {
    $pidToKill = $tcp.OwningProcess
    Write-Host "Found process ID: $pidToKill on port $port"
    Stop-Process -Id $pidToKill -Force
    Write-Host "Process $pidToKill killed."
} else {
    Write-Host "No process found on port $port."
}
