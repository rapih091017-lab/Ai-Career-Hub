

# Jalankan: powershell -File scripts/sdd-task-brief.ps1 -Plan <plan.md> -Task 1 -Prefix hrview
param(
  [Parameter(Mandatory = $true)][string]$Plan,
  [Parameter(Mandatory = $true)][int]$Task,
  [Parameter(Mandatory = $true)][string]$Prefix
)

$lines = Get-Content -LiteralPath $Plan -Encoding UTF8
$start = ($lines | Select-String -Pattern "^### Task ${Task}:" | Select-Object -First 1).LineNumber
if (-not $start) { throw "Task $Task tidak ditemukan di $Plan" }

# Task berikutnya adalah "### Task N+1:"; batas bawah jugaincludes penutup file.
$next = ($lines | Select-String -Pattern "^### Task $($Task + 1):" | Select-Object -First 1).LineNumber
$end = if ($next) { $next - 1 } else { $lines.Count }
$section = $lines[($start - 1)..($end - 1)]

$outDir = Join-Path (git rev-parse --show-toplevel) ".superpowers\sdd"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$outFile = Join-Path $outDir "$Prefix-task-$Task-brief.md"

$header = @(
  "# Brief Task $Task",
  "",
  "Sumber: ``$Plan`` (bagian Task $Task)",
  "",
  "Semua nilai, nama file, dan cuplikan kode di bawah diambil langsung dari plan.",
  "Jadikan isi brief ini acuan requirements; jangan mengarang nilai lain.",
  ""
)
($header + $section) | Set-Content -LiteralPath $outFile -Encoding UTF8
Write-Output $outFile