# Script para fazer commit e push AUTOMÁTICO
# Execute este script no PowerShell

Write-Host "🚀 Fazendo commit e push AUTOMÁTICO..." -ForegroundColor Yellow
Write-Host ""

$repoPath = "C:\Users\rose-\OneDrive\Documentos\GitHub\agente-financeiro-mk"

# Verifica se é um repositório Git
if (-not (Test-Path "$repoPath\.git")) {
    Write-Host "❌ Erro: Não é um repositório Git!" -ForegroundColor Red
    exit 1
}

# Navega para o repositório
Set-Location $repoPath

# Adiciona um espaço em branco no final dos arquivos para forçar mudança
Write-Host "📝 Forçando detecção de mudanças..." -ForegroundColor Cyan
$files = @("index.html", "sistema.html.html")
foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content.TrimEnd() + "`n"
        Set-Content $file -Value $content -NoNewline
        Write-Host "  ✓ $file atualizado" -ForegroundColor Green
    }
}

# Adiciona todos os arquivos
Write-Host ""
Write-Host "📦 Adicionando arquivos ao Git..." -ForegroundColor Cyan
& git add index.html sistema.html.html

# Verifica status
Write-Host ""
Write-Host "📋 Status do Git:" -ForegroundColor Cyan
& git status --short

# Faz commit
Write-Host ""
Write-Host "💾 Fazendo commit..." -ForegroundColor Cyan
$commitMessage = "Adiciona botão Upload de Planilha entre Limpar e Sincronizar - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
& git commit -m $commitMessage

# Faz push
Write-Host ""
Write-Host "📤 Fazendo push para GitHub..." -ForegroundColor Cyan
& git push origin main

Write-Host ""
Write-Host "✅ Concluído! Agora faça Manual Deploy no Render." -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Acesse: https://dashboard.render.com" -ForegroundColor White
Write-Host "2. Clique no serviço 'agente-financeiro-mk-1'" -ForegroundColor White
Write-Host "3. Clique em 'Manual Deploy' → 'Deploy latest commit'" -ForegroundColor White
Write-Host "4. Aguarde 2-5 minutos" -ForegroundColor White
Write-Host "5. Limpe o cache do navegador (Ctrl + Shift + Delete)" -ForegroundColor White


