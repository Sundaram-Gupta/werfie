# Allow incoming connections for Werfie dev server (run as Administrator)
# Enables login/API from other devices on LAN (e.g. http://192.168.1.101:5173)

$ports = @(5173, 3001, 3003)
foreach ($p in $ports) {
    $rule = "Werfie-Dev-$p"
    if (Get-NetFirewallRule -DisplayName $rule -ErrorAction SilentlyContinue) {
        Write-Host "Rule $rule already exists"
    } else {
        New-NetFirewallRule -DisplayName $rule -Direction Inbound -LocalPort $p -Protocol TCP -Action Allow -Profile Private
        Write-Host "Added firewall rule for port $p"
    }
}
Write-Host "Done. Access from other devices: http://YOUR_IP:5173"
