# Test all main APIs
$Base = "http://localhost:3001"
$AdminBase = "http://localhost:3012"
$passed = 0
$failed = 0

function Test-Api {
    param($Name, $Method, $Url, $Body = $null, $Token = $null)
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    try {
        $params = @{ Uri = $Url; Method = $Method; Headers = $headers; UseBasicParsing = $true }
        if ($Body) { $params["Body"] = $Body }
        $r = Invoke-WebRequest @params
        $code = $r.StatusCode
        $ok = $code -ge 200 -and $code -lt 300
        if ($ok) { $script:passed++ } else { $script:failed++ }
        $status = if ($ok) { "PASS" } else { "FAIL" }
        Write-Host "  [$status] $Method $Url -> $code" -ForegroundColor $(if ($ok) { "Green" } else { "Red" })
        return @{ code = $code; body = $r.Content }
    } catch {
        $script:failed++
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "  [FAIL] $Method $Url -> $code Error" -ForegroundColor Red
        return @{ code = $code; body = $null }
    }
}

Write-Host "`n=== 1. Auth (no token) ===" -ForegroundColor Cyan
$loginBody = '{"email":"user1@xclone.com","password":"password123"}'
$loginR = Test-Api "Login" "POST" "$Base/api/auth/login" $loginBody
$token = $null
if ($loginR.code -eq 200) {
    $json = $loginR.body | ConvertFrom-Json
    $token = $json.data.accessToken
    if (-not $token) { $token = $json.accessToken }
}

Write-Host "`n=== 2. Auth (with token) ===" -ForegroundColor Cyan
if ($token) {
    Test-Api "Me" "GET" "$Base/api/auth/me" $null $token
}

Write-Host "`n=== 3. Users ===" -ForegroundColor Cyan
if ($token) {
    Test-Api "Users profile" "GET" "$Base/api/users/profile" $null $token
    Test-Api "Users search" "GET" "$Base/api/users/search?q=user&limit=5" $null $token
}

Write-Host "`n=== 4. Posts / Timeline ===" -ForegroundColor Cyan
if ($token) {
    Test-Api "Posts timeline" "GET" "$Base/api/posts/timeline/home?limit=5" $null $token
    Test-Api "Posts list" "GET" "$Base/api/posts?limit=5" $null $token
}

Write-Host "`n=== 5. Trends / Explore ===" -ForegroundColor Cyan
Test-Api "Trends" "GET" "$Base/api/trends?limit=5"
Test-Api "Explore" "GET" "$Base/api/explore?limit=5"

Write-Host "`n=== 6. Admin (needs admin token) ===" -ForegroundColor Cyan
# Admin uses different base and auth
Test-Api "Admin users" "GET" "$AdminBase/api/admin/users?limit=5"

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $passed | Failed: $failed"
