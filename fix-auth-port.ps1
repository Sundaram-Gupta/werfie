# Fix auth-service port conflict (3001). Run before pm2 start if auth-service is errored.
# Usage: .\fix-auth-port.ps1

$port = 3001
$connections = netstat -ano | Select-String ":$port\s+.*LISTENING"
if ($connections) {
    $pids = $connections | ForEach-Object {
        if ($_ -match '\s+(\d+)\s*$') { $matches[1] }
    } | Select-Object -Unique
    foreach ($processId in $pids) {
        Write-Host "Killing process $processId using port $port"
        taskkill /PID $processId /F 2>$null
    }
    Write-Host "Port $port freed. Run: pm2 restart auth-service"
} else {
    Write-Host "Port $port is free."
}
