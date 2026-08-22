$ErrorActionPreference = "Stop"
$base = "http://localhost:5001"
$pass = 0; $fail = 0

function Assert($name, $condition) {
  if ($condition) { $script:pass++; Write-Output "PASS: $name" }
  else { $script:fail++; Write-Output "FAIL: $name" }
}

function Login($email, $password) {
  $body = @{ email = $email; password = $password } | ConvertTo-Json
  return Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType "application/json" -Body $body -TimeoutSec 10
}

# --- 1/2. Both users log in ---
$a = Login "admin@example.com" "ChangeMe123!"
$b = Login "user@example.com" "ChangeMe123!"
Assert "User A (admin@example.com) login" ($null -ne $a.token)
Assert "User B (user@example.com) login" ($null -ne $b.token)

# --- No password material in responses ---
$rawA = ($a | ConvertTo-Json -Depth 5).ToLower()
Assert "Login response leaks no password/hash" (-not $rawA.Contains("password") -and -not $rawA.Contains("`$2b`$"))

$hA = @{ Authorization = "Bearer $($a.token)" }
$hB = @{ Authorization = "Bearer $($b.token)" }
$today = Get-Date -Format "yyyy-MM-dd"

# --- Baselines & creation ---
$beforeA = (Invoke-RestMethod -Uri "$base/api/transactions" -Headers $hA -TimeoutSec 10).Count
$beforeB = (Invoke-RestMethod -Uri "$base/api/transactions" -Headers $hB -TimeoutSec 10).Count

$txA = Invoke-RestMethod -Uri "$base/api/transactions" -Method Post -Headers $hA -ContentType "application/json" `
  -Body (@{ type="income"; amount=111.11; category="Salary"; description="USER_A_SECURITY_TX"; date=$today } | ConvertTo-Json) -TimeoutSec 10
$txB = Invoke-RestMethod -Uri "$base/api/transactions" -Method Post -Headers $hB -ContentType "application/json" `
  -Body (@{ type="expense"; amount=222.22; category="Food"; description="USER_B_SECURITY_TX"; date=$today } | ConvertTo-Json) -TimeoutSec 10
Assert "User A created a transaction" ($null -ne $txA.id)
Assert "User B created a transaction" ($null -ne $txB.id)

# --- List isolation ---
$listA = Invoke-RestMethod -Uri "$base/api/transactions" -Headers $hA -TimeoutSec 10
$listB = Invoke-RestMethod -Uri "$base/api/transactions" -Headers $hB -TimeoutSec 10
$listA = @($listA); $listB = @($listB)
Assert "User A sees only own rows (+1 vs baseline)" ((@($listA | Where-Object { $_.id -eq $txB.id })).Count -eq 0 -and $listA.Count -eq ($beforeA + 1))
Assert "User B sees only own rows (+1 vs baseline)" ((@($listB | Where-Object { $_.id -eq $txA.id })).Count -eq 0 -and $listB.Count -eq ($beforeB + 1))

function StatusOf($block) { try { & $block | Out-Null; return 200 } catch { return [int]$_.Exception.Response.StatusCode } }

# --- Cross-user access by ID ---
$s = StatusOf { Invoke-RestMethod -Uri "$base/api/transactions/$($txB.id)" -Headers $hA -TimeoutSec 10 }
Assert "User A cannot READ User B's transaction by ID (got $s, want 404)" ($s -eq 404)
$s = StatusOf { Invoke-RestMethod -Uri "$base/api/transactions/$($txA.id)" -Headers $hB -TimeoutSec 10 }
Assert "User B cannot READ User A's transaction by ID (got $s, want 404)" ($s -eq 404)

# --- Cross-user update ---
$s = StatusOf { Invoke-RestMethod -Uri "$base/api/transactions/$($txB.id)" -Method Put -Headers $hA -ContentType "application/json" `
  -Body (@{ type="expense"; amount=999.99; category="Hacked"; description="HACKED"; date=$today } | ConvertTo-Json) -TimeoutSec 10 }
Assert "User A cannot UPDATE User B's transaction (got $s, want 404)" ($s -eq 404)
$bAfter = @(Invoke-RestMethod -Uri "$base/api/transactions" -Headers $hB -TimeoutSec 10) | Where-Object { $_.id -eq $txB.id }
Assert "User B's transaction unchanged after attack" ($bAfter.amount -eq 222.22)

# --- Cross-user delete ---
$s = StatusOf { Invoke-RestMethod -Uri "$base/api/transactions/$($txB.id)" -Method Delete -Headers $hA -TimeoutSec 10 }
Assert "User A cannot DELETE User B's transaction (got $s, want 404)" ($s -eq 404)
$listB2 = @(Invoke-RestMethod -Uri "$base/api/transactions" -Headers $hB -TimeoutSec 10)
Assert "User B's transaction still exists after attack" ((@($listB2 | Where-Object { $_.id -eq $txB.id })).Count -eq 1)

# --- Totals isolation (dashboard math is derived from scoped list) ---
$sumA = ($listA | Where-Object { $_.type -eq "income" } | Measure-Object -Property amount -Sum).Sum
Assert "Income totals isolated per user" ($null -ne $sumA)

# --- Own-resource operations still work ---
$s = StatusOf { Invoke-RestMethod -Uri "$base/api/transactions/$($txB.id)" -Method Delete -Headers $hB -TimeoutSec 10 }
Invoke-RestMethod -Uri "$base/api/transactions/$($txA.id)" -Method Delete -Headers $hA -TimeoutSec 10 | Out-Null
Assert "Users can still delete their OWN transactions" ($s -eq 200)
$afterA = (Invoke-RestMethod -Uri "$base/api/transactions" -Headers $hA -TimeoutSec 10).Count
$afterB = (Invoke-RestMethod -Uri "$base/api/transactions" -Headers $hB -TimeoutSec 10).Count
Assert "Counts restored after cleanup" ($afterA -eq $beforeA -and $afterB -eq $beforeB)

# --- Auth edge cases ---
$s = StatusOf { Invoke-RestMethod -Uri "$base/api/transactions" -Headers @{ Authorization = "Bearer garbage.token.here" } -TimeoutSec 10 }
Assert "Invalid token rejected (got $s, want 401)" ($s -eq 401)
$fake = @{ header=@{alg="none";typ="JWT"}; payload=@{ id=1; uuid="x" }; sig="nope" } | ConvertTo-Json -Compress
$fakeToken = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('{"alg":"none","typ":"JWT"}')) + ".AAAAAAAA." + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("x"))
$s = StatusOf { Invoke-RestMethod -Uri "$base/api/transactions" -Headers @{ Authorization = "Bearer $fakeToken" } -TimeoutSec 10 }
Assert "Forged alg-none token rejected (got $s, want 401)" ($s -eq 401)

# Wrong credentials rejected
try {
  Login "admin@example.com" "WrongPassword!" | Out-Null
  Assert "Wrong password rejected" $false
} catch {
  Assert "Wrong password rejected (got $([int]$_.Exception.Response.StatusCode), want 400)" ([int]$_.Exception.Response.StatusCode -eq 400)
}
try {
  Login "nonexistent@example.com" "Whatever123!" | Out-Null
  Assert "Unknown email rejected" $false
} catch {
  Assert "Unknown email rejected (got $([int]$_.Exception.Response.StatusCode))" ($true)
}

# --- Logout invalidation ---
$c = Login "user@example.com" "ChangeMe123!"
$hC = @{ Authorization = "Bearer $($c.token)" }
Invoke-RestMethod -Uri "$base/api/auth/logout" -Method Post -Headers $hC -TimeoutSec 10 | Out-Null
$s = StatusOf { Invoke-RestMethod -Uri "$base/api/transactions" -Headers $hC -TimeoutSec 10 }
Assert "Logout invalidates session (got $s, want 401)" ($s -eq 401)

Write-Output ""
Write-Output "RESULT: $pass passed, $fail failed"
if ($fail -gt 0) { exit 1 }
