# Perbaiki tanda hubung yang berubah jadi tanda tanya di dokumen plan/spec

# PowerShell 5.1 membaca berkas UTF-8 sebagai ANSI kalau -Encoding UTF8 tidak
# dipakai, sehingga em-dash dan en-dash berubah jadi "?" setiap kali berkas
# ditulis ulang. Skrip ini hanya menyentuh baris di luar blok kode, karena
# tanda "?" di dalam kode adalah ternary yang memang harus ada.

param(
  [Parameter(Mandatory = $true)][string[]]$Path
)

foreach ($file in $Path) {
  $lines = Get-Content -LiteralPath $file -Encoding UTF8
  $inFence = $false
  $fixed = 0

  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\s*```') { $inFence = -not $inFence; continue }
    if ($inFence) { continue }

    $before = $lines[$i]
    # " ? " di antara dua kata = em-dash yang rusak. Backtick di sebelahnya
    # bukan alasan untuk dilewati, kode sebaris sangat sering dipakai di sini.
    $after = $before -replace ' \? ', ' — '
    # Rentang angka seperti 85?100 adalah en-dash rusak, tanpa spasi.
    $after = $after -replace '(\d)\?(\d)', '$1–$2'
    if ($after -ne $before) { $lines[$i] = $after; $fixed++ }
  }

  $text = $lines -join "`r`n"
  $full = Join-Path (Get-Location).Path $file
  [System.IO.File]::WriteAllText($full, $text, (New-Object System.Text.UTF8Encoding($false)))
  Write-Output "$file -> $fixed baris diperbaiki, BOM dihapus"
}