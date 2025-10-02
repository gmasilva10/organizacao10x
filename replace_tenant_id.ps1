# Script para substituir .eq('tenant_id' por .eq('org_id' em todos os arquivos de API

$files = Get-ChildItem -Path "web\app\api" -Recurse -Filter "*.ts"

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName
    $newContent = $content -replace "\.eq\('tenant_id'", ".eq('org_id'"
    $newContent | Set-Content -Path $file.FullName
}

Write-Host "Substituição concluída em $($files.Count) arquivos."

