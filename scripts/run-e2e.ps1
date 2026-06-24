$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$nextBin = Join-Path $repoRoot "node_modules\next\dist\bin\next"
$playwrightBin = Join-Path $repoRoot "node_modules\.bin\playwright.cmd"
$stdoutLog = Join-Path $repoRoot ".next\e2e-server.stdout.log"
$stderrLog = Join-Path $repoRoot ".next\e2e-server.stderr.log"
$server = $null
$exitCode = 1

$env:APP_ORIGIN = "http://127.0.0.1:3000"
$env:FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099"
$env:FIREBASE_PROJECT_ID = "mindtrace-demo"
$env:FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080"
$env:NEXT_PUBLIC_FIREBASE_API_KEY = "demo-api-key"
$env:NEXT_PUBLIC_FIREBASE_APP_ID = "demo-app-id"
$env:NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "localhost"
$env:NEXT_PUBLIC_FIREBASE_PROJECT_ID = "mindtrace-demo"
$env:NEXT_PUBLIC_USE_FIREBASE_EMULATORS = "true"

try {
  New-Item -ItemType Directory -Force (Join-Path $repoRoot ".next") | Out-Null
  $nodePath = (Get-Command node).Source
  $server = Start-Process `
    -FilePath $nodePath `
    -ArgumentList @($nextBin, "dev") `
    -WorkingDirectory $repoRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -PassThru

  $ready = $false

  for ($attempt = 0; $attempt -lt 120; $attempt += 1) {
    if ($server.HasExited) {
      throw "Next.js E2E server exited before becoming ready."
    }

    try {
      $response = Invoke-WebRequest `
        -Uri "http://127.0.0.1:3000/zh-CN/login" `
        -UseBasicParsing `
        -TimeoutSec 2

      if ($response.StatusCode -eq 200) {
        $ready = $true
        break
      }
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }

  if (-not $ready) {
    throw "Next.js E2E server did not become ready."
  }

  & $playwrightBin test
  $exitCode = $LASTEXITCODE
} catch {
  Write-Error $_
  $exitCode = 1
} finally {
  if ($null -ne $server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
    $server.WaitForExit()
  }
}

exit $exitCode
