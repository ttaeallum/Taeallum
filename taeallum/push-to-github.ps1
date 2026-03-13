# رفع أحدث نسخة من المشروع إلى GitHub
# Run this script in PowerShell from the project root (Learn-Platform-Updated-2zip)
# You will be prompted for GitHub credentials (use Personal Access Token as password)

$ErrorActionPreference = "Stop"
$repoRoot = $PSScriptRoot

Set-Location $repoRoot

Write-Host "=== Git status ===" -ForegroundColor Cyan
git status -s
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`n=== Staging all changes ===" -ForegroundColor Cyan
git add -A
$status = git status --porcelain
if ($status) {
    Write-Host "Committing changes..." -ForegroundColor Yellow
    git commit -m "chore: prepare latest for GitHub (cross-env, push script, docs)"
    if ($LASTEXITCODE -ne 0) { exit 1 }
} else {
    Write-Host "No changes to commit (working tree clean)." -ForegroundColor Green
}

Write-Host "`n=== Pushing to GitHub (origin main) ===" -ForegroundColor Cyan
Write-Host "If prompted: use your GitHub username and a Personal Access Token as password." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nPush failed. If branches diverged, try one of:" -ForegroundColor Red
    Write-Host "  git pull --rebase origin main" -ForegroundColor White
    Write-Host "  git push origin main" -ForegroundColor White
    Write-Host "Or to overwrite remote with your local: git push --force-with-lease origin main" -ForegroundColor White
    exit 1
}

Write-Host "`nDone. Latest code is on GitHub." -ForegroundColor Green
