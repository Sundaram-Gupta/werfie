# Werfie API - Full Endpoint Test Script
# Run: .\test_all_apis.ps1
# Requires: Project running (npm run pm2:dev)

$BaseUrl = "http://localhost:3001"
$MessagingUrl = "http://localhost:3019"
$AdminUrl = "http://localhost:3012"
$LoginEmail = "user1@xclone.com"
$LoginPassword = "password123"

$Script:Token = $null
$Script:RefreshToken = $null
$Script:UserId = $null
$Script:Passed = 0
$Script:Failed = 0
$Script:Results = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method = "GET",
        [string]$Url,
        [bool]$RequireAuth = $true,
        [string]$Body = $null,
        [hashtable]$Headers = @{}
    )
    $headers_copy = $Headers.Clone()
    if ($RequireAuth -and $Script:Token) {
        $headers_copy["Authorization"] = "Bearer $($Script:Token)"
    }
    $headers_copy["Content-Type"] = "application/json"
    if ($Method -eq "GET") { $headers_copy.Remove("Content-Type") | Out-Null }

    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $headers_copy
            UseBasicParsing = $true
            ErrorAction = "Stop"
        }
        if ($Body -and $Method -ne "GET") {
            $params["Body"] = $Body
        }
        $response = Invoke-WebRequest @params
        $status = [int]$response.StatusCode
        $Script:Passed++
        $result = "PASS"
    }
    catch {
        $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { "ERR" }
        if ($status -ge 200 -and $status -lt 400) { $Script:Passed++; $result = "PASS" }
        elseif ($status -eq 401 -or $status -eq 403) { $Script:Failed++; $result = "AUTH" }
        elseif ($status -eq 404) { $Script:Failed++; $result = "404" }
        else { $Script:Failed++; $result = "FAIL" }
    }
    $Script:Results += [PSCustomObject]@{ Name=$Name; Method=$Method; Status=$status; Result=$result }
    Write-Host "  [$result] $Method $Url -> $status" -ForegroundColor $(if($result -eq "PASS"){"Green"}elseif($result -eq "AUTH"){"Yellow"}else{"Red"})
}

Write-Host "`n=== Werfie API Test Suite ===" -ForegroundColor Cyan
Write-Host "Base: $BaseUrl`n"

# Step 1: Login
Write-Host "--- Login ---" -ForegroundColor Cyan
try {
    $loginBody = @{ email = $LoginEmail; password = $LoginPassword } | ConvertTo-Json
    $loginResp = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $Script:Token = $loginResp.accessToken
    $Script:RefreshToken = $loginResp.refreshToken
    $Script:UserId = $loginResp.id
    Write-Host "  [OK] Logged in as $($loginResp.email), userId=$Script:UserId" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Ensure project is running and DB has user1@xclone.com / password123" -ForegroundColor Yellow
    exit 1
}

# Step 2: Run tests
Write-Host "`n--- Auth ---" -ForegroundColor Cyan
Test-Endpoint "Auth Me" "GET" "$BaseUrl/api/auth/me"
if ($Script:RefreshToken) {
    $refreshBody = @{ refreshToken = $Script:RefreshToken } | ConvertTo-Json
    try {
        $r = Invoke-WebRequest -Uri "$BaseUrl/api/auth/refresh" -Method POST -Body $refreshBody -ContentType "application/json" -UseBasicParsing
        $Script:Passed++; Write-Host "  [PASS] POST $BaseUrl/api/auth/refresh -> $($r.StatusCode)" -ForegroundColor Green
        $Script:Results += [PSCustomObject]@{ Name="Auth Refresh"; Method="POST"; Status=$r.StatusCode; Result="PASS" }
    } catch {
        $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { "ERR" }
        $Script:Failed++; Write-Host "  [FAIL] POST $BaseUrl/api/auth/refresh -> $code" -ForegroundColor Red
        $Script:Results += [PSCustomObject]@{ Name="Auth Refresh"; Method="POST"; Status=$code; Result="FAIL" }
    }
}
Test-Endpoint "Auth Logout" "POST" "$BaseUrl/api/auth/logout"
# Re-login after logout (token was invalidated)
$loginResp = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$Script:Token = $loginResp.accessToken

Write-Host "`n--- Users ---" -ForegroundColor Cyan
Test-Endpoint "Profile" "GET" "$BaseUrl/api/users/profile"
if ($Script:UserId) {
    Test-Endpoint "Get User" "GET" "$BaseUrl/api/users/$Script:UserId"
}
Test-Endpoint "Search" "GET" "$BaseUrl/api/users/search?q=user&limit=5"
Test-Endpoint "Suggestions" "GET" "$BaseUrl/api/users/suggestions?limit=5"

Write-Host "`n--- Posts ---" -ForegroundColor Cyan
Test-Endpoint "Get Posts" "GET" "$BaseUrl/api/posts?limit=5"
Test-Endpoint "Timeline Home" "GET" "$BaseUrl/api/posts/timeline/home?limit=5"
Test-Endpoint "Following Feed" "GET" "$BaseUrl/api/posts/following?limit=5"
Test-Endpoint "Bookmarks" "GET" "$BaseUrl/api/posts/bookmarks"
Test-Endpoint "Create Post" "POST" "$BaseUrl/api/posts" -Body '{"content":"Test from script"}'

Write-Host "`n--- Timeline & Explore ---" -ForegroundColor Cyan
Test-Endpoint "Trends" "GET" "$BaseUrl/api/trends?limit=10"
Test-Endpoint "Explore" "GET" "$BaseUrl/api/explore?limit=10"
Test-Endpoint "Communities" "GET" "$BaseUrl/api/communities"

Write-Host "`n--- Notifications ---" -ForegroundColor Cyan
Test-Endpoint "Notifications" "GET" "$BaseUrl/api/notifications?limit=10"
Test-Endpoint "Read All" "PUT" "$BaseUrl/api/notifications/read-all"

Write-Host "`n--- Spaces ---" -ForegroundColor Cyan
Test-Endpoint "List Spaces" "GET" "$BaseUrl/api/spaces"

Write-Host "`n--- Lists ---" -ForegroundColor Cyan
Test-Endpoint "Lists Pinned" "GET" "$BaseUrl/api/lists/pinned"
Test-Endpoint "Lists Discover" "GET" "$BaseUrl/api/lists/discover"
Test-Endpoint "Lists Yours" "GET" "$BaseUrl/api/lists/yours"

Write-Host "`n--- Ads ---" -ForegroundColor Cyan
Test-Endpoint "Ads Account" "GET" "$BaseUrl/api/ads/account"
Test-Endpoint "Campaigns" "GET" "$BaseUrl/api/ads/campaigns"
Test-Endpoint "Creatives" "GET" "$BaseUrl/api/ads/creatives"
Test-Endpoint "Performance" "GET" "$BaseUrl/api/ads/performance"

Write-Host "`n--- Business ---" -ForegroundColor Cyan
Test-Endpoint "Business" "GET" "$BaseUrl/api/business"
Test-Endpoint "Business Stats" "GET" "$BaseUrl/api/business/stats"
Test-Endpoint "Business Team" "GET" "$BaseUrl/api/business/team"

Write-Host "`n--- Institutional ---" -ForegroundColor Cyan
Test-Endpoint "Institutional" "GET" "$BaseUrl/api/institutional"

Write-Host "`n--- World Leaders ---" -ForegroundColor Cyan
Test-Endpoint "Leaders List" "GET" "$BaseUrl/api/leaders"
Test-Endpoint "Leaders" "GET" "$BaseUrl/api/leaders"

Write-Host "`n--- Announcements ---" -ForegroundColor Cyan
Test-Endpoint "Announcements Feed" "GET" "$BaseUrl/api/announcements/feed"

Write-Host "`n--- Soapbox ---" -ForegroundColor Cyan
Test-Endpoint "Soapbox List" "GET" "$BaseUrl/api/soapbox/list"

Write-Host "`n--- Debate ---" -ForegroundColor Cyan
Test-Endpoint "Debate List" "GET" "$BaseUrl/api/debate/list"

Write-Host "`n--- Messaging ---" -ForegroundColor Cyan
Test-Endpoint "Conversations" "GET" "$BaseUrl/api/messages/conversations?limit=10"
Test-Endpoint "Conversations (direct)" "GET" "$MessagingUrl/api/messages/conversations?limit=5"

Write-Host "`n--- Monetization ---" -ForegroundColor Cyan
Test-Endpoint "Monetization Profile" "GET" "$BaseUrl/api/monetization/profile"
Test-Endpoint "Monetization Stats" "GET" "$BaseUrl/api/monetization/stats"
Test-Endpoint "Monetization Transactions" "GET" "$BaseUrl/api/monetization/transactions?limit=5"

Write-Host "`n--- Moderation ---" -ForegroundColor Cyan
Test-Endpoint "Moderation Report" "POST" "$BaseUrl/api/moderation/report" -Body '{"contentType":"post","contentId":"test-id","reason":"test"}'

Write-Host "`n--- Settings ---" -ForegroundColor Cyan
Test-Endpoint "Settings" "GET" "$BaseUrl/api/settings"

Write-Host "`n--- Search ---" -ForegroundColor Cyan
Test-Endpoint "Search Posts" "GET" "$BaseUrl/api/search/posts?q=test"
Test-Endpoint "Search Posts (content)" "GET" "$BaseUrl/api/posts/search?q=test&limit=5"

Write-Host "`n--- Feed ---" -ForegroundColor Cyan
Test-Endpoint "World Leaders Feed" "GET" "$BaseUrl/api/feed/world-leaders"

Write-Host "`n--- Admin (no auth for health) ---" -ForegroundColor Cyan
Test-Endpoint "Admin Health" "GET" "$AdminUrl/api/admin/health" -RequireAuth $false
Test-Endpoint "Admin Docs" "GET" "$AdminUrl/api/docs" -RequireAuth $false

Write-Host "`n--- Health Checks ---" -ForegroundColor Cyan
Test-Endpoint "User Service Health" "GET" "http://localhost:3002/health" -RequireAuth $false
Test-Endpoint "Content Service Health" "GET" "http://localhost:3003/health" -RequireAuth $false
Test-Endpoint "Messaging Health" "GET" "$MessagingUrl/health" -RequireAuth $false
Test-Endpoint "Monetization Health" "GET" "http://localhost:3014/health" -RequireAuth $false

# Summary
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "  Passed: $Script:Passed" -ForegroundColor Green
Write-Host "  Failed: $Script:Failed" -ForegroundColor Red
Write-Host "  Total:  $($Script:Passed + $Script:Failed)" -ForegroundColor White
$Script:Results | Format-Table -AutoSize
Write-Host "`nDone. Check SWAGGER_ENDPOINTS.md for full cURL reference.`n"
