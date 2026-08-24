# Backup & restore

Two PowerShell scripts, no extra dependencies beyond the PostgreSQL client
tools (`pg_dump`/`pg_restore`) already installed on this machine.

## Back up

```powershell
cd backend/scripts
./backup.ps1
```

Writes `backend/backups/<yyyyMMdd-HHmmss>/` containing:
- `database.dump` — a `pg_dump --format=custom` dump of `specification_db`, restorable with `pg_restore`
- `attachments.zip` — a snapshot of `backend/data/attachments` (skipped if that directory is empty or missing)
- `manifest.json` — what was backed up and when

Old backup folders beyond the retention count (default 14) are pruned automatically after each successful run. Override any connection detail or path — run `Get-Help ./backup.ps1 -Full` for all parameters.

Backups are **not** committed to git (`backend/backups/` and `backend/data/` are in `.gitignore`) — treat the `backups/` folder itself as sensitive and store it somewhere durable (a second disk, network share, or cloud storage), since a copy that only ever lives next to the database it backs up doesn't protect against disk failure.

## Restore

```powershell
cd backend/scripts
./restore.ps1                                    # dry run: shows what would happen
./restore.ps1 -BackupPath 20260811-020000 -Force  # actually restores that backup
```

This is destructive: it drops and recreates the target database's objects and replaces the attachments directory. It **always dry-runs by default** — nothing happens until you pass `-Force`. Stop the backend application before restoring, since `pg_restore` needs exclusive access to the objects it's replacing.

## Scheduling automatic backups (Windows Task Scheduler)

```powershell
schtasks /create /tn "UNZA Spec System Backup" /sc daily /st 02:00 `
  /tr "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$PWD\backup.ps1`""
```

Adjust `/st` for the desired time. Verify it ran by checking `backend/backups/` the next morning, and periodically test a restore against a scratch database — a backup you've never restored from is not a verified backup.
