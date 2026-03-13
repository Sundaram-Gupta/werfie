# Test all Auth APIs - all should return 200/201
$Base = "http://localhost:3001"
$passed = 0
$failed = 0

function Test-Auth {
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
        Write-Host "  [$status] $Name -> $code" -ForegroundColor $(if ($ok) { "Green" } else { "Red" })
        return @{ code = $code; body = $r.Content }
    } catch {
        $script:failed++
        $code = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "Error" }
        Write-Host "  [FAIL] $Name -> $code" -ForegroundColor Red
        return @{ code = $code; body = $null }
    }
}

Write-Host "`n=== Auth API Tests (http://localhost:3001/api-docs/#/Auth) ===" -ForegroundColor Cyan

# 1. Login
$loginR = Test-Auth "POST /api/auth/login" "POST" "$Base/api/auth/login" '{"email":"user1@xclone.com","password":"password123"}'
$token = $null
$refresh = $null
if ($loginR.code -eq 200) {
    $json = $loginR.body | ConvertFrom-Json
    $token = $json.data.accessToken
    $refresh = $json.data.refreshToken
    if (-not $token) { $token = $json.accessToken; $refresh = $json.refreshToken }
}

# 2. Register (unique email)
$ts = [int][double]::Parse((Get-Date -UFormat %s))
Test-Auth "POST /api/auth/register" "POST" "$Base/api/auth/register" "{`"email`":`"authuser$ts@test.com`",`"password`":`"password123`",`"name`":`"Auth Test`",`"handle`":`"authtest$ts`"}"

# 3. /me (needs token)
if ($token) {
    Test-Auth "GET /api/auth/me" "GET" "$Base/api/auth/me" $null $token
}

# 4. Refresh (needs refreshToken in body)
if ($refresh) {
    Test-Auth "POST /api/auth/refresh" "POST" "$Base/api/auth/refresh" "{`"refreshToken`":`"$refresh`"}"
}

# 5. Change password (needs token + body)
if ($token) {
    Test-Auth "POST /api/auth/change-password" "POST" "$Base/api/auth/change-password" '{"currentPassword":"password123","newPassword":"temp123"}' $token
    $login2 = Invoke-WebRequest -Uri "$Base/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"user1@xclone.com","password":"temp123"}' -UseBasicParsing
    $j2 = $login2.Content | ConvertFrom-Json
    $token2 = $j2.data.accessToken
    Test-Auth "POST /api/auth/change-password (revert)" "POST" "$Base/api/auth/change-password" '{"currentPassword":"temp123","newPassword":"password123"}' $token2
}

# 6. Logout (needs token - get fresh one)
$login3 = Invoke-WebRequest -Uri "$Base/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"user1@xclone.com","password":"password123"}' -UseBasicParsing
$j3 = $login3.Content | ConvertFrom-Json
Test-Auth "POST /api/auth/logout" "POST" "$Base/api/auth/logout" $null $j3.data.accessToken

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $passed | Failed: $failed"
if ($failed -eq 0) {
    Write-Host "`nAll Auth APIs return 200/201. For Swagger UI: Login -> Copy accessToken -> Authorize (lock icon) -> Paste token -> Try /me, /logout, /change-password" -ForegroundColor Green
}
