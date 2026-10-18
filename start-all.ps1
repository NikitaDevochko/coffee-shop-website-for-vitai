# ==========================================================================
#  Запуск всех трёх сервисов «Кварты» в отдельных окнах PowerShell.
#
#  Использование (из корня репозитория):
#      .\start-all.ps1           # всё сразу
#      .\start-all.ps1 api       # только бэкенд
#      .\start-all.ps1 web       # только сайт
#      .\start-all.ps1 bot       # только бот
#
#  Каждый сервис открывается в своём окне: логи видно отдельно,
#  закрытие одного окна не роняет остальные.
# ==========================================================================

param(
    [ValidateSet("all", "api", "web", "bot")]
    [string]$Target = "all",

    # Отключить автоперезагрузку бэкенда (нужно, если окружение
    # запрещает запуск дочерних процессов).
    [switch]$NoReload
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$apiDir = Join-Path $root "website\api"
$webDir = Join-Path $root "website\web"
$botDir = Join-Path $root "telegram-bot"
$apiPython = Join-Path $apiDir ".venv\Scripts\python.exe"
$botPython = Join-Path $botDir ".venv\Scripts\python.exe"

# Node берём из PATH, иначе из рантайма DSH.
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCommand) {
    $node = $nodeCommand.Source
} else {
    $node = "C:\Users\user\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe"
}

function Start-ServiceWindow {
    param(
        [string]$Title,
        [string]$WorkDir,
        [string]$Command
    )

    # -NoExit оставляет окно открытым, чтобы были видны логи и ошибки.
    $inner = "`$Host.UI.RawUI.WindowTitle = '$Title'; Set-Location '$WorkDir'; " +
             "Write-Host '=== $Title ===' -ForegroundColor Cyan; $Command"
    $argumentList = @("-NoExit", "-Command", $inner)
    Start-Process -FilePath "powershell.exe" -ArgumentList $argumentList | Out-Null
    Write-Host "  запущен: $Title" -ForegroundColor Green
}

function Show-Checks {
    $problems = New-Object System.Collections.ArrayList

    if (-not (Test-Path $apiPython)) {
        [void]$problems.Add("нет venv бэкенда: $apiPython  ->  cd website\api; python -m venv .venv; .\.venv\Scripts\pip install -r requirements.txt")
    }
    if (-not (Test-Path $botPython)) {
        [void]$problems.Add("нет venv бота: $botPython  ->  cd telegram-bot; python -m venv .venv; .\.venv\Scripts\pip install -r requirements.txt")
    }
    if (-not (Test-Path (Join-Path $webDir "node_modules"))) {
        [void]$problems.Add("нет node_modules фронтенда: $webDir  ->  cd website\web; pnpm install")
    }
    if (-not (Test-Path (Join-Path $apiDir ".env"))) {
        [void]$problems.Add("нет website\api\.env  ->  скопируйте .env.example и задайте ADMIN_API_TOKEN")
    }
    if (-not (Test-Path (Join-Path $botDir ".env"))) {
        [void]$problems.Add("нет telegram-bot\.env  ->  скопируйте .env.example, впишите TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID")
    }

    if ($problems.Count -gt 0) {
        Write-Host "Не всё готово к запуску:" -ForegroundColor Yellow
        foreach ($problem in $problems) {
            Write-Host "  - $problem" -ForegroundColor Yellow
        }
        Write-Host ""
    }
}

Show-Checks

Write-Host "Запуск сервисов «Кварта»:" -ForegroundColor Cyan

if ($Target -eq "all" -or $Target -eq "api") {
    $reloadFlag = ""
    if (-not $NoReload) { $reloadFlag = " --reload" }
    Start-ServiceWindow `
        -Title "Kvarta API :8000" `
        -WorkDir $apiDir `
        -Command "& '$apiPython' -m uvicorn app.main:app --host 127.0.0.1 --port 8000$reloadFlag"
}

if ($Target -eq "all" -or $Target -eq "web") {
    Start-ServiceWindow `
        -Title "Kvarta WEB :3000" `
        -WorkDir $webDir `
        -Command "& '$node' '.\node_modules\next\dist\bin\next' dev --port 3000"
}

if ($Target -eq "all" -or $Target -eq "bot") {
    Start-ServiceWindow `
        -Title "Kvarta BOT" `
        -WorkDir $botDir `
        -Command "`$env:PYTHONIOENCODING = 'utf-8'; & '$botPython' -m app.main"
}

Write-Host ""
Write-Host "Адреса:" -ForegroundColor Cyan
Write-Host "  API:  http://127.0.0.1:8000/healthz"
Write-Host "  Сайт: http://localhost:3000"
Write-Host "  Бот:  уведомления в чате менеджеров (нужен токен в telegram-bot\.env)"
