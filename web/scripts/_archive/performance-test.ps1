# Script de teste de performance para GATE 9.6
$BaseUrl = "http://localhost:3000"
$Routes = @(
    "/api/students/summary",
    "/api/occurrences?page=1&page_size=20", 
    "/api/occurrences/1",
    "/api/kanban/board"
)

Write-Host "🚀 Iniciando teste de performance GATE 9.6..." -ForegroundColor Green
Write-Host "📅 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan

$Results = @{}

foreach ($Route in $Routes) {
    Write-Host "`n🔍 Testando $Route (25 iterações)..." -ForegroundColor Yellow
    
    $Times = @()
    $SuccessCount = 0
    
    for ($i = 1; $i -le 25; $i++) {
        try {
            $StartTime = Get-Date
            $Response = Invoke-WebRequest -Uri "$BaseUrl$Route" -UseBasicParsing -TimeoutSec 10
            $EndTime = Get-Date
            $Duration = ($EndTime - $StartTime).TotalMilliseconds
            
            if ($Response.StatusCode -eq 200) {
                $Times += [int]$Duration
                $SuccessCount++
                
                $QueryTime = $Response.Headers['X-Query-Time']
                $RowCount = $Response.Headers['X-Row-Count']
                
                Write-Host "  $i`: $([int]$Duration)ms (Query: $QueryTime ms, Rows: $RowCount)" -ForegroundColor Gray
            } else {
                Write-Host "  $i`: ERRO $($Response.StatusCode) - $($Response.StatusDescription)" -ForegroundColor Red
            }
        } catch {
            Write-Host "  $i`: ERRO - $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Start-Sleep -Milliseconds 100
    }
    
    if ($Times.Count -eq 0) {
        Write-Host "  ❌ Nenhuma requisição bem-sucedida" -ForegroundColor Red
        $Results[$Route] = $null
        continue
    }
    
    # Calcular estatísticas
    $Times = $Times | Sort-Object
    $P50 = $Times[[Math]::Floor($Times.Count * 0.5)]
    $P95 = $Times[[Math]::Floor($Times.Count * 0.95)]
    $P99 = $Times[[Math]::Floor($Times.Count * 0.99)]
    $Avg = ($Times | Measure-Object -Average).Average
    
    Write-Host "  📊 Estatísticas:" -ForegroundColor Cyan
    Write-Host "     Média: $([Math]::Round($Avg, 1))ms" -ForegroundColor White
    Write-Host "     P50: $P50 ms" -ForegroundColor White
    Write-Host "     P95: $P95 ms" -ForegroundColor White
    Write-Host "     P99: $P99 ms" -ForegroundColor White
    Write-Host "     Sucessos: $($Times.Count)/25" -ForegroundColor White
    
    $Results[$Route] = @{
        Avg = $Avg
        P50 = $P50
        P95 = $P95
        P99 = $P99
        Success = $Times.Count
        Total = 25
    }
}

Write-Host "`n📋 RESUMO DOS RESULTADOS:" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green

foreach ($Route in $Routes) {
    $Stats = $Results[$Route]
    if ($Stats) {
        Write-Host "$Route`:" -ForegroundColor Yellow
        Write-Host "  P50: $($Stats.P50)ms | P95: $($Stats.P95)ms | P99: $($Stats.P99)ms" -ForegroundColor White
        Write-Host "  Sucesso: $($Stats.Success)/$($Stats.Total)" -ForegroundColor White
    } else {
        Write-Host "$Route`: FALHOU" -ForegroundColor Red
    }
}

Write-Host "`n🎯 VERIFICAÇÃO DAS METAS GATE 9.6:" -ForegroundColor Green
Write-Host "P95 < 400ms local | P99 < 650ms local" -ForegroundColor Cyan

$AllTargetsMet = $true
foreach ($Route in $Routes) {
    $Stats = $Results[$Route]
    if ($Stats) {
        $P95Ok = $Stats.P95 -lt 400
        $P99Ok = $Stats.P99 -lt 650
        $Status = if ($P95Ok -and $P99Ok) { "✅" } else { "❌" }
        Write-Host "$Status $Route`: P95=$($Stats.P95)ms, P99=$($Stats.P99)ms" -ForegroundColor $(if ($P95Ok -and $P99Ok) { "Green" } else { "Red" })
        if (-not $P95Ok -or -not $P99Ok) { $AllTargetsMet = $false }
    }
}

Write-Host "`n$(if ($AllTargetsMet) { '🎉' } else { '⚠️' }) Metas $(if ($AllTargetsMet) { 'ATINGIDAS' } else { 'NÃO ATINGIDAS' })" -ForegroundColor $(if ($AllTargetsMet) { "Green" } else { "Red" })
