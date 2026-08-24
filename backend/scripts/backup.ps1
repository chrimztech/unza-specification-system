<#
.SYNOPSIS
  Backs up the specification_db Postgres database and the local attachments
  directory into a single timestamped folder under backend/backups/.

.DESCRIPTION
  Writes <BackupRoot>/<yyyyMMdd-HHmmss>/database.dump (pg_dump custom format,
  compressed, restorable with pg_restore) and .../attachments.zip (a snapshot
  of the attachments directory), plus a manifest.json recording what was
  backed up. Prunes backups beyond -Retain (default 14) so backups/ doesn't
  grow unbounded on a scheduled run.

  Reads DB connection details and the attachments directory from the same
  defaults as backend/src/main/resources/application.yml so the common case
  needs no parameters at all. Override any of them for a different
  environment (staging, a differently-configured dev box, etc).

.PARAMETER PgHost
  Postgres host. Default: localhost

.PARAMETER PgPort
  Postgres port. Default: 5433 (matches application.yml)

.PARAMETER Database
  Database name. Default: specification_db

.PARAMETER PgUser
  Postgres role. Default: postgres

.PARAMETER PgPassword
  Postgres password. Default: matches the dev default in application.yml.
  Override via -PgPassword or the PGPASSWORD env var for any non-dev use.

.PARAMETER AttachmentsDir
  Attachments directory to snapshot. Default: ./data/attachments relative to
  the backend project root (matches ATTACHMENTS_DIR / app.storage.attachments-dir).

.PARAMETER BackupRoot
  Where timestamped backup folders are written. Default: backend/backups

.PARAMETER Retain
  How many most-recent backup folders to keep. Older ones are deleted after
  a successful backup. Default: 14

.EXAMPLE
  ./backup.ps1
  Backs up using the same defaults the app itself uses in dev.

.EXAMPLE
  ./backup.ps1 -Database specification_db -PgPassword $env:DB_PASSWORD -Retain 30
  Backs up against a differently-configured environment, keeping 30 backups.

.NOTES
  To schedule daily backups on Windows:
    schtasks /create /tn "UNZA Spec System Backup" /sc daily /st 02:00 ^
      /tr "powershell.exe -NoProfile -ExecutionPolicy Bypass -File \"<full path to backup.ps1>\""
#>
param(
  [string]$PgHost = "localhost",
  [int]$PgPort = 5433,
  [string]$Database = "specification_db",
  [string]$PgUser = "postgres",
  [string]$PgPassword = "11111111",
  [string]$AttachmentsDir = (Join-Path $PSScriptRoot "..\data\attachments"),
  [string]$BackupRoot = (Join-Path $PSScriptRoot "..\backups"),
  [int]$Retain = 14
)

$ErrorActionPreference = "Stop"

function Assert-CommandExists([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name was not found on PATH. Install the PostgreSQL client tools (pg_dump/pg_restore/psql) first."
  }
}
Assert-CommandExists "pg_dump"

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$destination = Join-Path $BackupRoot $stamp
New-Item -ItemType Directory -Force -Path $destination | Out-Null

Write-Output "Backing up database '$Database' to $destination\database.dump ..."
$env:PGPASSWORD = $PgPassword
try {
  & pg_dump --host=$PgHost --port=$PgPort --username=$PgUser --format=custom --compress=9 `
    --file="$destination\database.dump" $Database
  if ($LASTEXITCODE -ne 0) { throw "pg_dump exited with code $LASTEXITCODE" }
} finally {
  Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

$attachmentsBackedUp = $false
if (Test-Path $AttachmentsDir) {
  $itemCount = (Get-ChildItem -Path $AttachmentsDir -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
  if ($itemCount -gt 0) {
    Write-Output "Backing up $itemCount attachment file(s) to $destination\attachments.zip ..."
    Compress-Archive -Path (Join-Path $AttachmentsDir "*") -DestinationPath (Join-Path $destination "attachments.zip") -Force
    $attachmentsBackedUp = $true
  } else {
    Write-Output "Attachments directory is empty - skipping attachments.zip."
  }
} else {
  Write-Output "Attachments directory '$AttachmentsDir' does not exist - skipping attachments.zip."
}

$manifest = [ordered]@{
  createdAt          = (Get-Date).ToUniversalTime().ToString("o")
  database           = $Database
  pgHost             = $PgHost
  pgPort             = $PgPort
  attachmentsBackedUp = $attachmentsBackedUp
  attachmentsSourceDir = $AttachmentsDir
}
$manifest | ConvertTo-Json | Set-Content -Path (Join-Path $destination "manifest.json") -Encoding utf8

Write-Output "Backup complete: $destination"

# Prune old backups beyond retention.
$allBackups = Get-ChildItem -Path $BackupRoot -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match '^\d{8}-\d{6}$' } |
  Sort-Object Name -Descending
if ($allBackups.Count -gt $Retain) {
  $toRemove = $allBackups | Select-Object -Skip $Retain
  foreach ($old in $toRemove) {
    Write-Output "Pruning old backup: $($old.FullName)"
    Remove-Item -Path $old.FullName -Recurse -Force
  }
}
