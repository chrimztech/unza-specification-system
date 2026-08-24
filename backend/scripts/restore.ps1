<#
.SYNOPSIS
  Restores the specification_db Postgres database and the attachments
  directory from a backup folder produced by backup.ps1.

.DESCRIPTION
  DESTRUCTIVE: this overwrites the target database's objects (via
  `pg_restore --clean --if-exists`, which drops existing objects before
  recreating them from the dump) and replaces the contents of the target
  attachments directory. It will not run without -Force, and always prints
  what it is about to do first.

.PARAMETER BackupPath
  Path to a specific backup folder (e.g. backend/backups/20260811-020000),
  or a timestamp under -BackupRoot (e.g. "20260811-020000"). If omitted, the
  most recent backup under -BackupRoot is used.

.PARAMETER Force
  Required to actually perform the restore. Without it, the script only
  reports what it would do and exits.

.EXAMPLE
  ./restore.ps1
  Shows which backup would be restored (the most recent one) without doing anything.

.EXAMPLE
  ./restore.ps1 -BackupPath 20260811-020000 -Force
  Actually restores that backup over the configured database and attachments directory.
#>
param(
  [string]$BackupPath = "",
  [string]$PgHost = "localhost",
  [int]$PgPort = 5433,
  [string]$Database = "specification_db",
  [string]$PgUser = "postgres",
  [string]$PgPassword = "11111111",
  [string]$AttachmentsDir = (Join-Path $PSScriptRoot "..\data\attachments"),
  [string]$BackupRoot = (Join-Path $PSScriptRoot "..\backups"),
  [switch]$Force
)

$ErrorActionPreference = "Stop"

function Assert-CommandExists([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name was not found on PATH. Install the PostgreSQL client tools (pg_dump/pg_restore/psql) first."
  }
}
Assert-CommandExists "pg_restore"

if ([string]::IsNullOrWhiteSpace($BackupPath)) {
  $latest = Get-ChildItem -Path $BackupRoot -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '^\d{8}-\d{6}$' } |
    Sort-Object Name -Descending |
    Select-Object -First 1
  if (-not $latest) { throw "No backups found under $BackupRoot. Pass -BackupPath explicitly." }
  $resolvedPath = $latest.FullName
} elseif (Test-Path $BackupPath) {
  $resolvedPath = (Resolve-Path $BackupPath).Path
} else {
  $resolvedPath = Join-Path $BackupRoot $BackupPath
  if (-not (Test-Path $resolvedPath)) { throw "Backup not found: $BackupPath (looked in $resolvedPath)" }
}

$dumpFile = Join-Path $resolvedPath "database.dump"
$attachmentsZip = Join-Path $resolvedPath "attachments.zip"
if (-not (Test-Path $dumpFile)) { throw "No database.dump found in $resolvedPath - is this a valid backup folder?" }

Write-Output "Restore plan:"
Write-Output "  Backup:          $resolvedPath"
Write-Output "  Target database: $Database on ${PgHost}:${PgPort} (existing objects will be DROPPED and recreated)"
if (Test-Path $attachmentsZip) {
  Write-Output "  Target attachments dir: $AttachmentsDir (existing contents will be REPLACED)"
} else {
  Write-Output "  No attachments.zip in this backup - attachments directory will be left untouched."
}

if (-not $Force) {
  Write-Output ""
  Write-Output "Dry run only - no changes made. Re-run with -Force to actually restore."
  exit 0
}

Write-Output "Restoring database from $dumpFile ..."
$env:PGPASSWORD = $PgPassword
try {
  & pg_restore --host=$PgHost --port=$PgPort --username=$PgUser --dbname=$Database `
    --clean --if-exists --no-owner $dumpFile
  if ($LASTEXITCODE -ne 0) { throw "pg_restore exited with code $LASTEXITCODE" }
} finally {
  Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
Write-Output "Database restored."

if (Test-Path $attachmentsZip) {
  Write-Output "Restoring attachments to $AttachmentsDir ..."
  if (Test-Path $AttachmentsDir) {
    Remove-Item -Path $AttachmentsDir -Recurse -Force
  }
  New-Item -ItemType Directory -Force -Path $AttachmentsDir | Out-Null
  Expand-Archive -Path $attachmentsZip -DestinationPath $AttachmentsDir -Force
  Write-Output "Attachments restored."
}

Write-Output "Restore complete."
