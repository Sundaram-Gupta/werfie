$url = "http://localhost:3019/api/messages/conversations"
$origin = "http://localhost:5173"

Write-Host "Testing CORS for $url"
try {
    $response = Invoke-WebRequest -Uri $url -Method Options -Headers @{ "Origin" = $origin; "Access-Control-Request-Method" = "GET" } -ErrorAction Stop
    
    Write-Host "Status Code: $($response.StatusCode)"
    
    $acao = $response.Headers["Access-Control-Allow-Origin"]
    $acac = $response.Headers["Access-Control-Allow-Credentials"]
    
    if ($acao -and $acao.Contains($origin)) {
        Write-Host "✅ Access-Control-Allow-Origin: $acao"
    } else {
        Write-Host "❌ Missing or Incorrect Access-Control-Allow-Origin"
    }
    
    if ($acac -eq "true") {
        Write-Host "✅ Access-Control-Allow-Credentials: true"
    } else {
        Write-Host "❌ Missing Access-Control-Allow-Credentials"
    }
    
} catch {
    Write-Host "❌ Request Failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
         Write-Host "Status: $($_.Exception.Response.StatusCode)"
    }
}
