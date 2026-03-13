# Werfie API Test Script - Uses curl to test all APIs
# Run: .\test_apis_curl.ps1
# Requires: curl (curl.exe on Windows)

$Base = "http://localhost:3001"
$AdminBase = "http://localhost:3012"
$passed = 0
$failed = 0
$results = @()

function Test-CurlApi {
    param($Name, $Method, $Url, $Body = $null, $Token = $null)
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    try {
        $params = @{ Uri = $Url; Method = $Method; Headers = $headers; UseBasicParsing = $true }
        if ($Body -and $Method -ne "GET") { $params["Body"] = $Body }
        $r = Invoke-WebRequest @params -ErrorAction Stop
        $code = $r.StatusCode
    } catch {
        $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
    }
    $ok = $code -ge 200 -and $code -lt 300
    if ($ok) { $script:passed++ } else { $script:failed++ }
    $status = if ($ok) { "PASS" } else { "FAIL" }
    Write-Host "  [$status] $Method $Url -> $code" -ForegroundColor $(if ($ok) { "Green" } else { "Red" })
    [void]($script:results += [PSCustomObject]@{ Name = $Name; Method = $Method; Url = $Url; Status = $code; OK = $ok })
}

Write-Host "`n=== Werfie API Test (curl) ===" -ForegroundColor Cyan
Write-Host ""

# 1. Login to get token (use Invoke-RestMethod for reliable JSON on Windows)
Write-Host "1. Login..." -ForegroundColor Cyan
$token = $null
try {
    $loginResp = Invoke-RestMethod -Uri "$Base/api/auth/login" -Method POST -Body '{"email":"apitest@example.com","password":"password123"}' -ContentType "application/json"
    $token = $loginResp.data.accessToken
    if (-not $token) { $token = $loginResp.accessToken }
} catch {}
if (-not $token) {
    Write-Host "  [FAIL] Could not get token. Run: Invoke-RestMethod -Uri '$Base/api/auth/register' -Method POST -Body '{\"email\":\"apitest@example.com\",\"password\":\"password123\",\"name\":\"API Test\",\"handle\":\"apitest\"}' -ContentType 'application/json'" -ForegroundColor Red
} else {
    Write-Host "  [PASS] Got token" -ForegroundColor Green
}

# 2. Auth
Write-Host "`n2. Auth APIs..." -ForegroundColor Cyan
Test-CurlApi "Health" "GET" "$Base/api/health"
Test-CurlApi "Login" "POST" "$Base/api/auth/login" '{"email":"apitest@example.com","password":"password123"}'
if ($token) { Test-CurlApi "Me" "GET" "$Base/api/auth/me" $null $token }

# 3. Users
Write-Host "`n3. User APIs..." -ForegroundColor Cyan
if ($token) { Test-CurlApi "Users profile" "GET" "$Base/api/users/profile" $null $token }
Test-CurlApi "Users search" "GET" "$Base/api/users/search?q=user&limit=5"
Test-CurlApi "Users suggestions" "GET" "$Base/api/users/suggestions?limit=5"

# 4. Posts / Content
Write-Host "`n4. Posts / Content APIs..." -ForegroundColor Cyan
if ($token) {
    Test-CurlApi "Posts" "GET" "$Base/api/posts?limit=5" $null $token
    Test-CurlApi "Posts timeline" "GET" "$Base/api/posts/timeline/home?limit=5" $null $token
    Test-CurlApi "Posts following" "GET" "$Base/api/posts/following?limit=5" $null $token
    Test-CurlApi "Posts bookmarks" "GET" "$Base/api/posts/bookmarks" $null $token
}
Test-CurlApi "Explore" "GET" "$Base/api/explore?limit=5"
Test-CurlApi "Communities" "GET" "$Base/api/communities"
Test-CurlApi "Trends" "GET" "$Base/api/trends?limit=5"
Test-CurlApi "Leaders" "GET" "$Base/api/leaders"
Test-CurlApi "Announcements feed" "GET" "$Base/api/announcements/feed"

# 5. Other
Write-Host "`n5. Other APIs..." -ForegroundColor Cyan
if ($token) {
    Test-CurlApi "Notifications" "GET" "$Base/api/notifications?limit=5" $null $token
    Test-CurlApi "Spaces" "GET" "$Base/api/spaces" $null $token
    Test-CurlApi "Lists pinned" "GET" "$Base/api/lists/pinned" $null $token
    Test-CurlApi "Lists discover" "GET" "$Base/api/lists/discover"
    Test-CurlApi "Business" "GET" "$Base/api/business" $null $token
    Test-CurlApi "Institutional" "GET" "$Base/api/institutional" $null $token
    Test-CurlApi "Ads account" "GET" "$Base/api/ads/account" $null $token
    Test-CurlApi "Settings" "GET" "$Base/api/settings" $null $token
    Test-CurlApi "Messaging conversations" "GET" "$Base/api/messages/conversations?limit=5" $null $token
}

# 6. Health checks
Write-Host "`n6. Health checks..." -ForegroundColor Cyan
Test-CurlApi "User service" "GET" "http://localhost:3002/health"
Test-CurlApi "Content service" "GET" "http://localhost:3003/health"

# Summary
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $passed | Failed: $failed | Total: $($passed + $failed)"
if ($failed -gt 0) {
    Write-Host "`nFailed APIs:" -ForegroundColor Red
    $results | Where-Object { -not $_.OK } | ForEach-Object { Write-Host "  [$($_.Status)] $($_.Name) - $($_.Url)" }
}
Write-Host ""
