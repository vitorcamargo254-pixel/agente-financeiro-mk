# Script para fazer commit e push das mudancas
# Execute este script no PowerShell

Write-Host "Fazendo commit e push das mudancas..." -ForegroundColor Yellow
Write-Host ""

cd "C:\Users\rose-\OneDrive\Documentos\GitHub\agente-financeiro-mk"

# Verifica se e um repositorio Git
if (-not (Test-Path ".git")) {
    Write-Host "Erro: Nao e um repositorio Git!" -ForegroundColor Red
    exit 1
}

# Adiciona todos os arquivos
Write-Host "Adicionando arquivos..." -ForegroundColor Cyan
git add index.html sistema.html.html .gitforce

# Verifica status
Write-Host ""
Write-Host "Status do Git:" -ForegroundColor Cyan
git status --short

# Faz commit
Write-Host ""
Write-Host "Fazendo commit..." -ForegroundColor Cyan
git commit -m "Adiciona botao Enviar Planilha e corrige API_BASE"

# Faz push
Write-Host ""
Write-Host "Fazendo push..." -ForegroundColor Cyan
git push origin main

Write-Host ""
Write-Host "Concluido! Agora faca Manual Deploy no Render." -ForegroundColor Green
