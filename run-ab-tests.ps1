# PowerShell Apache Bench Runner - Phase 8.2
# Usage: powershell -ExecutionPolicy Bypass -File .\run-ab-tests.ps1

param(
  [string]$ApiBase = "http://localhost:8000/api",
  [string]$LoginPayloadPath = "./ab-login.json",
  [int]$C = 100,
  [int]$N = 1000
)

function Get-AbPath {
  try {
    $p = (Get-Command ab -ErrorAction Stop).Source
    if ($p) { return $p }
  } catch {}
  $candidates = @(
    "C:\\Program Files\\Apache24\\bin\\ab.exe",
    "$env:AppData\\Apache24\\bin\\ab.exe",
    "$env:UserProfile\\Apache24\\bin\\ab.exe"
  )
  foreach ($c in $candidates) { if (Test-Path $c) { return $c } }
  throw "ab.exe not found. Add Apache24\\bin to PATH or install Apache HTTPD."
}

function Invoke-Ab {
  param(
    [string]$Url,
    [int]$C,
    [int]$N,
    [string]$Method = "GET",
    [string]$PostFile = $null,
    [hashtable]$Headers
  )

  $ab = Get-AbPath
  $headerArgs = @()
  foreach ($k in $Headers.Keys) {
    $headerArgs += "-H"
    $headerArgs += ("{0}: {1}" -f $k, $Headers[$k])
  }

  if ($Method -eq 'POST' -and $PostFile) {
    & $ab -k @headerArgs -p $PostFile -T "application/json" -c $C -n $N $Url
  } else {
    & $ab -k @headerArgs -c $C -n $N $Url
  }
}

Write-Host "=== Phase 8.2: Apache Bench Tests ===" -ForegroundColor Cyan

# 1) Login to get token
$loginUrl = "$ApiBase/auth/login"
Write-Host "Logging in: $loginUrl" -ForegroundColor Yellow

$loginBody = Get-Content -Path $LoginPayloadPath -Raw
try {
  $loginJson = Invoke-RestMethod -Method Post -Uri $loginUrl -ContentType "application/json" -Body $loginBody
} catch {
  Write-Host "Login request failed. Raw response:" -ForegroundColor Red
  try {
    $resp = Invoke-WebRequest -Method Post -Uri $loginUrl -ContentType "application/json" -Body $loginBody -ErrorAction Stop
    Write-Host $resp.Content
  } catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
  }
  throw
}

$token = $null
if ($loginJson.PSObject.Properties.Name -contains 'token') { $token = $loginJson.token }
elseif ($loginJson.PSObject.Properties.Name -contains 'data' -and $loginJson.data.PSObject.Properties.Name -contains 'token') { $token = $loginJson.data.token }
if (-not $token) { Write-Host ($loginJson | ConvertTo-Json -Depth 5); throw "Token not found in login response." }
Write-Host "Token acquired." -ForegroundColor Green

$headers = @{ "Authorization" = "Bearer $token"; "Accept" = "application/json"; "X-Device-UUID" = "ab-test-device" }

# 2) Tests
Invoke-Ab -Url "$ApiBase/sessions?page=1" -C 50 -N 500 -Headers $headers
Invoke-Ab -Url "$ApiBase/dashboard/data/cards?period=daily" -C 30 -N 300 -Headers $headers
Invoke-Ab -Url "$ApiBase/users?role=student&per_page=50" -C 50 -N 500 -Headers $headers

Write-Host "Done." -ForegroundColor Green


