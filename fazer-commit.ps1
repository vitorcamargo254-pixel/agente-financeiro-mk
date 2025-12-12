# Script para fazer commit e push das mudanças
# Execute este script no PowerShell

Write-Host "🚀 Fazendo commit e push das mudanças..." -ForegroundColor Yellow
Write-Host ""

cd "C:\Users\rose-\OneDrive\Documentos\GitHub\agente-financeiro-mk"

# Verifica se é um repositório Git
if (-not (Test-Path ".git")) {
    Write-Host "❌ Erro: Não é um repositório Git!" -ForegroundColor Red
    exit 1
}

# Adiciona todos os arquivos
Write-Host "📦 Adicionando arquivos..." -ForegroundColor Cyan
git add index.html sistema.html.html .gitforce

# Verifica status
Write-Host ""
Write-Host "📋 Status do Git:" -ForegroundColor Cyan
git status --short

# Faz commit
Write-Host ""
Write-Host "💾 Fazendo commit..." -ForegroundColor Cyan
git commit -m "Adiciona botão Enviar Planilha e corrige API_BASE"

# Faz push
Write-Host ""
Write-Host "📤 Fazendo push..." -ForegroundColor Cyan
git push origin main

Write-Host ""
Write-Host "✅ Concluído! Agora faça Manual Deploy no Render." -ForegroundColor Green

