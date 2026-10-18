# Buat paket review untuk satu task SDD

# Jalankan: powershell -File scripts/sdd-review-package.ps1 -Base 3980140 -Head eabdcfa -Name hrview-task-1
param(
  [Parameter(Mandatory = $true)][string]$Base,
  [Parameter(Mandatory = $true)][string]$Head,
  [Parameter(Mandatory = $true)][string]$Name
)

$root = git rev-parse --show-toplevel
$outDir = Join-Path $root ".superpowers\sdd"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$out = Join-Path $outDir "$Name-review-package.md"

$fence = '```'
$log = git log --oneline "$Base..$Head"
$stat = git diff --stat $Base $Head
$diff = git diff -U10 $Base $Head

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("# Review Package - $Name")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("Range: ${Base}..${Head}")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("## Commits")
[void]$sb.AppendLine($fence)
foreach ($l in $log) { [void]$sb.AppendLine([string]$l) }
[void]$sb.AppendLine($fence)
[void]$sb.AppendLine("")
[void]$sb.AppendLine("## Diff stat")
[void]$sb.AppendLine($fence)
foreach ($l in $stat) { [void]$sb.AppendLine([string]$l) }
[void]$sb.AppendLine($fence)
[void]$sb.AppendLine("")
[void]$sb.AppendLine("## Full diff (-U10)")
[void]$sb.AppendLine("${fence}diff")
foreach ($l in $diff) { [void]$sb.AppendLine([string]$l) }
[void]$sb.AppendLine($fence)

Set-Content -LiteralPath $out -Value $sb.ToString() -Encoding UTF8
Write-Output $out