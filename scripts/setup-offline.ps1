# Optional one-time local setup. Run from the project root:
# powershell -ExecutionPolicy Bypass -File scripts/setup-offline.ps1
# Downloads pinned browser libraries to vendor/. No account or backend required.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$vendor = Join-Path $root 'vendor'
New-Item -ItemType Directory -Force $vendor | Out-Null
New-Item -ItemType Directory -Force (Join-Path $vendor 'tessdata') | Out-Null
$items = @(
 @('pdf-lib.min.js','https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js'),
 @('pdf.min.js','https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'),
 @('pdf.worker.min.js','https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'),
 @('tesseract.min.js','https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'),
 @('tesseract-worker.min.js','https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js'),
 @('tesseract-core-simd.wasm.js','https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-simd.wasm.js'),
 @('tesseract-core-simd.wasm','https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-simd.wasm'),
 @('tesseract-core.wasm.js','https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core.wasm.js'),
 @('tesseract-core.wasm','https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core.wasm'),
 @('tesseract-core-lstm.wasm.js','https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-lstm.wasm.js'),
 @('tesseract-core-lstm.wasm','https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-lstm.wasm'),
 @('tesseract-core-simd-lstm.wasm.js','https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-simd-lstm.wasm.js'),
 @('tesseract-core-simd-lstm.wasm','https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-simd-lstm.wasm'),
 @('tessdata/eng.traineddata.gz','https://tessdata.projectnaptha.com/4.0.0_fast/eng.traineddata.gz'),
 @('tessdata/nep.traineddata.gz','https://tessdata.projectnaptha.com/4.0.0_fast/nep.traineddata.gz')
)
foreach($pair in $items){$destination=Join-Path $vendor $pair[0];if(Test-Path $destination){Write-Host "Already available: $($pair[0])";continue};try{Write-Host "Downloading $($pair[0])...";Invoke-WebRequest -Uri $pair[1] -OutFile $destination -UseBasicParsing -ErrorAction Stop}catch{Write-Warning "Optional library not fetched: $($pair[0]) - $($_.Exception.Message)";Remove-Item $destination -ErrorAction SilentlyContinue}}
try { py (Join-Path $PSScriptRoot 'generate-sw-assets.py') | Out-Host } catch { Write-Warning 'Could not regenerate precache list; documents still work locally when libraries exist in vendor.' }
Write-Host 'PDF offline setup attempted. Run py -m http.server 5500 and refresh.'
