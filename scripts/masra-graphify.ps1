[CmdletBinding()]
param(
  [ValidateSet('Setup', 'Build', 'Query')][string]$Action = 'Build',
  [string]$Question
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'package.json'))) { throw 'Run this script inside the MASRA project.' }
$envRoot = Join-Path $projectRoot '.local/graphify-env'
$pythonPath = Join-Path $envRoot 'Scripts/python.exe'
$graphifyPath = Join-Path $envRoot 'Scripts/graphify.exe'
if ($Action -eq 'Setup') {
  if (-not (Test-Path -LiteralPath $pythonPath)) {
    & python -m venv $envRoot
    if ($LASTEXITCODE -ne 0) { throw 'Python 3.10+ is required to create the isolated environment.' }
  }
  & $pythonPath -m pip install --disable-pip-version-check --only-binary=:all: -r (Join-Path $PSScriptRoot 'graphify-requirements.txt')
  if ($LASTEXITCODE -ne 0) { throw 'Graphify installation failed. Review the error; do not change the project dependencies.' }
  Write-Output 'Graphify is installed in this project only. Run Build next.'
  return
}
if (-not (Test-Path -LiteralPath $graphifyPath)) { throw 'Run ./scripts/masra-graphify.ps1 -Action Setup first.' }
if ($Action -eq 'Query' -and [string]::IsNullOrWhiteSpace($Question)) { throw 'Provide -Question with a symbol or focused question.' }
$previousLog = [Environment]::GetEnvironmentVariable('GRAPHIFY_QUERY_LOG_DISABLE', 'Process')
$previousOut = [Environment]::GetEnvironmentVariable('GRAPHIFY_OUT', 'Process')
Push-Location -LiteralPath $projectRoot
try {
  $env:GRAPHIFY_QUERY_LOG_DISABLE = '1'
  $env:GRAPHIFY_OUT = 'graphify-out'
  if ($Action -eq 'Build') {
    & $graphifyPath extract . --code-only --no-cluster --max-workers 2
  } else {
    if (-not (Test-Path -LiteralPath 'graphify-out/graph.json')) { throw 'No graph exists. Run Build first.' }
    & $graphifyPath query $Question --graph 'graphify-out/graph.json' --budget 800
  }
  if ($LASTEXITCODE -ne 0) { throw "Graphify $Action failed. Check the error and graph coverage before continuing." }
} finally {
  Pop-Location
  [Environment]::SetEnvironmentVariable('GRAPHIFY_QUERY_LOG_DISABLE', $previousLog, 'Process')
  [Environment]::SetEnvironmentVariable('GRAPHIFY_OUT', $previousOut, 'Process')
}
