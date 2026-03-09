# Werfie API - Full cURL-based Test Script
# Run: .\test_apis_curl.ps1
# Uses curl.exe for all requests

$Base = "http://localhost:3001"
$Admin = "http://localhost:3012"
$Messaging = "http://localhost:3019"

$Script:Token = $null
$Script:UserId = $null
$Script:AdminToken = $null
$Script:Passed = 0
$Script:Failed = 0
$Script:Errors = @()
$Script:TempDir = $null

function Get-CurlStatus {
    param([string]$Method, [string]$Url, [string]$Body = $null, [bool]$Auth = $true, [bool]$AdminAuth = $false)
    $curlArgs = @("-s", "-o", "NUL", "-w", "%{http_code}", "-X", $Method, "-H", "Content-Type: application/json")
    if ($Auth -and $Script:Token) { $curlArgs += "-H"; $curlArgs += "Authorization: Bearer $($Script:Token)" }
    if ($AdminAuth -and $Script:AdminToken) { $curlArgs += "-H"; $curlArgs += "Authorization: Bearer $($Script:AdminToken)" }
    if ($Body -and $Method -ne "GET") {
        $tmpFile = Join-Path $Script:TempDir "curl_body_$([guid]::NewGuid().ToString('N').Substring(0,8)).json"
        [System.IO.File]::WriteAllText($tmpFile, $Body)
        $curlArgs += "-d"; $curlArgs += "@$tmpFile"
        try { $code = (& curl.exe @curlArgs $Url 2>$null).ToString().Trim() } finally { Remove-Item $tmpFile -ErrorAction SilentlyContinue }
    } else {
        $code = (& curl.exe @curlArgs $Url 2>$null).ToString().Trim()
    }
    if ($code -match '^\d+$') { return [int]$code }
    return 0
}

function Test-Curl {
    param([string]$Name, [string]$Method, [string]$Url, [string]$Body = $null, [bool]$Auth = $true, [bool]$AdminAuth = $false)
    $code = Get-CurlStatus -Method $Method -Url $Url -Body $Body -Auth $Auth -AdminAuth $AdminAuth
    $ok = $code -ge 200 -and $code -lt 300
    if ($ok) { $Script:Passed++ } else { $Script:Failed++; $Script:Errors += "$Name [$code] $Method $Url" }
    $status = if ($ok) { "PASS" } else { "FAIL" }
    Write-Host "  [$status] $Method $Url -> $code" -ForegroundColor $(if($ok){"Green"}else{"Red"})
    $null
}

Write-Host "`n=== Werfie API Test Suite (cURL) ===" -ForegroundColor Cyan
Write-Host "Base: $Base`n"

# Temp dir for curl bodies (avoids PowerShell JSON escaping)
$Script:TempDir = [System.IO.Path]::GetTempPath()

# Login - use temp file to avoid PowerShell escaping issues with curl -d
Write-Host "--- Login ---" -ForegroundColor Cyan
$loginJson = '{"email":"user1@xclone.com","password":"password123"}'
$loginFile = Join-Path $Script:TempDir "werfie_login.json"
[System.IO.File]::WriteAllText($loginFile, $loginJson)
$loginResp = curl.exe -s -X POST "$Base/api/auth/login" -H "Content-Type: application/json" -d "@$loginFile" 2>$null | ConvertFrom-Json
Remove-Item $loginFile -ErrorAction SilentlyContinue
if ($loginResp.data) {
    $Script:Token = $loginResp.data.accessToken
    $Script:UserId = $loginResp.data.id
} else {
    $Script:Token = $loginResp.accessToken
    $Script:UserId = $loginResp.id
}
if (-not $Script:Token) {
    Write-Host "  [FAIL] Login failed. Ensure project is running." -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Logged in, token obtained`n" -ForegroundColor Green

# Admin login
$adminFile = Join-Path $Script:TempDir "werfie_admin.json"
[System.IO.File]::WriteAllText($adminFile, '{"email":"admin@example.com","password":"admin"}')
$adminLogin = curl.exe -s -X POST "$Admin/api/admin/login" -H "Content-Type: application/json" -d "@$adminFile" 2>$null | ConvertFrom-Json
Remove-Item $adminFile -ErrorAction SilentlyContinue
if ($adminLogin.data.token) { $Script:AdminToken = $adminLogin.data.token }
elseif ($adminLogin.token) { $Script:AdminToken = $adminLogin.token }

# Auth
Write-Host "--- Auth ---" -ForegroundColor Cyan
Test-Curl "Auth /me" GET "$Base/api/auth/me"
Test-Curl "Auth /health" GET "$Base/api/health" -Auth $false
Test-Curl "Auth /trends" GET "$Base/api/trends?limit=5"

# Users
Write-Host "`n--- Users ---" -ForegroundColor Cyan
Test-Curl "Users profile" GET "$Base/api/users/profile"
if ($Script:UserId) { Test-Curl "Users get" GET "$Base/api/users/$Script:UserId" }
Test-Curl "Users search" GET "$Base/api/users/search?q=user&limit=5"
Test-Curl "Users suggestions" GET "$Base/api/users/suggestions?limit=5"

# Posts
Write-Host "`n--- Posts ---" -ForegroundColor Cyan
Test-Curl "Posts feed" GET "$Base/api/posts?limit=5"
Test-Curl "Posts timeline" GET "$Base/api/posts/timeline/home?limit=5"
Test-Curl "Posts following" GET "$Base/api/posts/following?limit=5"
Test-Curl "Posts bookmarks" GET "$Base/api/posts/bookmarks"
Test-Curl "Posts search" GET "$Base/api/posts/search?q=test&limit=5"
Test-Curl "Create post" POST "$Base/api/posts" '{"content":"Test from curl"}'

# Explore
Write-Host "`n--- Explore ---" -ForegroundColor Cyan
Test-Curl "Explore" GET "$Base/api/explore?limit=5"
Test-Curl "Communities" GET "$Base/api/communities"

# Notifications
Write-Host "`n--- Notifications ---" -ForegroundColor Cyan
Test-Curl "Notifications" GET "$Base/api/notifications?limit=5"
Test-Curl "Notifications read-all" PUT "$Base/api/notifications/read-all"

# Spaces, Lists
Write-Host "`n--- Spaces & Lists ---" -ForegroundColor Cyan
Test-Curl "Spaces" GET "$Base/api/spaces"
Test-Curl "Lists pinned" GET "$Base/api/lists/pinned"
Test-Curl "Lists discover" GET "$Base/api/lists/discover"
Test-Curl "Lists yours" GET "$Base/api/lists/yours"

# Ads, Business
Write-Host "`n--- Ads & Business ---" -ForegroundColor Cyan
Test-Curl "Ads account" GET "$Base/api/ads/account"
Test-Curl "Ads campaigns" GET "$Base/api/ads/campaigns"
Test-Curl "Business" GET "$Base/api/business"
Test-Curl "Institutional" GET "$Base/api/institutional"

# Leaders, Announcements
Write-Host "`n--- Leaders & Content ---" -ForegroundColor Cyan
Test-Curl "Leaders" GET "$Base/api/leaders"
Test-Curl "Announcements feed" GET "$Base/api/announcements/feed"
Test-Curl "Soapbox list" GET "$Base/api/soapbox/list"
Test-Curl "Debate list" GET "$Base/api/debate/list"

# Messaging
Write-Host "`n--- Messaging ---" -ForegroundColor Cyan
Test-Curl "Messaging conversations" GET "$Base/api/messages/conversations?limit=5"
Test-Curl "Messaging health" GET "$Messaging/api/messages/health" -Auth $false

# Monetization
Write-Host "`n--- Monetization ---" -ForegroundColor Cyan
Test-Curl "Monetization profile" GET "$Base/api/monetization/profile"
Test-Curl "Monetization stats" GET "$Base/api/monetization/stats"

# Moderation
Write-Host "`n--- Moderation ---" -ForegroundColor Cyan
Test-Curl "Moderation report" POST "$Base/api/moderation/report" '{"contentType":"post","contentId":"test-id","reason":"test"}'

# Settings, Search, Feed
Write-Host "`n--- Settings & Search ---" -ForegroundColor Cyan
Test-Curl "Settings" GET "$Base/api/settings"
Test-Curl "Settings health" GET "$Base/api/settings/health"
Test-Curl "Search posts" GET "$Base/api/search/posts?q=test"
Test-Curl "Search health" GET "$Base/api/search/health" -Auth $false
Test-Curl "Feed world-leaders" GET "$Base/api/feed/world-leaders"

# Admin
Write-Host "`n--- Admin ---" -ForegroundColor Cyan
Test-Curl "Admin health" GET "$Admin/api/admin/health" -Auth $false
Test-Curl "Admin login" POST "$Admin/api/admin/login" '{"email":"admin@example.com","password":"admin"}' -Auth $false
if ($Script:AdminToken) {
    Test-Curl "Admin dashboard" GET "$Admin/api/admin/dashboard/stats" -Auth $false -AdminAuth $true
    Test-Curl "Admin users" GET "$Admin/api/admin/users" -Auth $false -AdminAuth $true
    Test-Curl "Admin reports" GET "$Admin/api/admin/reports" -Auth $false -AdminAuth $true
}
Test-Curl "Admin docs" GET "$Admin/api/docs" -Auth $false

# Health
Write-Host "`n--- Health ---" -ForegroundColor Cyan
Test-Curl "User service" GET "http://localhost:3002/health" -Auth $false
Test-Curl "Content service" GET "http://localhost:3003/health" -Auth $false
Test-Curl "Moderation health" GET "$Base/api/moderation/health" -Auth $false
Test-Curl "Monetization health" GET "$Base/api/monetization/health" -Auth $false

# Summary
$total = $Script:Passed + $Script:Failed
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "  Passed: $Script:Passed" -ForegroundColor Green
Write-Host "  Failed: $Script:Failed" -ForegroundColor $(if($Script:Failed -gt 0){"Red"}else{"Green"})
Write-Host "  Total:  $total"
if ($Script:Errors.Count -gt 0) {
    Write-Host "`nErrored APIs:" -ForegroundColor Red
    $Script:Errors | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
}
Write-Host ""
exit $(if ($Script:Failed -eq 0) { 0 } else { 1 })
