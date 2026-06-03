$ErrorActionPreference = "Stop"

$nodePath = "C:\Users\Lucy\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$serverPath = Join-Path $PSScriptRoot "server.js"

if (-not (Test-Path $nodePath)) {
  Write-Host "Bundled Node.js was not found. If Node.js is installed, run: node server.js"
  exit 1
}

Write-Host "Starting Math AI MVP at http://localhost:4173"
& $nodePath $serverPath
