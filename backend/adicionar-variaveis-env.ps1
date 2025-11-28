# Script para adicionar variáveis de E-mail e Twilio ao .env
# Execute: .\adicionar-variaveis-env.ps1

$envFile = ".env"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Adicionando Variáveis ao .env" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se o arquivo existe
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Arquivo .env não encontrado!" -ForegroundColor Red
    exit 1
}

# Lê o conteúdo atual
$content = Get-Content $envFile -Raw

# Variáveis a adicionar
$newVars = @"
# ============================================
# E-MAIL - LEMBRETES E NOTIFICAÇÕES
# ============================================
# Opção 1: Gmail (Recomendado para testes)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-de-app
EMAIL_FROM=seu-email@gmail.com

# ============================================
# TWILIO - LIGAÇÕES AUTOMÁTICAS
# ============================================
# Obtenha suas credenciais em: https://console.twilio.com/
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=seu_auth_token_aqui
TWILIO_FROM_NUMBER=+5511999999999
BASE_URL=http://localhost:4000
"@

# Verifica se as variáveis já existem
if ($content -match "EMAIL_HOST") {
    Write-Host "⚠️  Variáveis de E-mail já existem no .env" -ForegroundColor Yellow
} else {
    Write-Host "✅ Adicionando variáveis de E-mail..." -ForegroundColor Green
    $content += "`n`n$newVars"
}

if ($content -match "TWILIO_ACCOUNT_SID") {
    Write-Host "⚠️  Variáveis do Twilio já existem no .env" -ForegroundColor Yellow
} else {
    if (-not ($content -match "EMAIL_HOST")) {
        Write-Host "✅ Adicionando variáveis do Twilio..." -ForegroundColor Green
        $content += "`n`n$newVars"
    }
}

# Salva o arquivo
$content | Set-Content $envFile -Encoding UTF8

Write-Host ""
Write-Host "✅ Arquivo .env atualizado!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Edite o arquivo .env e preencha:" -ForegroundColor White
Write-Host "   - EMAIL_USER, EMAIL_PASSWORD (Gmail)" -ForegroundColor White
Write-Host "   - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER" -ForegroundColor White
Write-Host ""
Write-Host "2. Para Gmail, obtenha a senha de app em:" -ForegroundColor White
Write-Host "   https://myaccount.google.com/apppasswords" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Para Twilio, crie conta em:" -ForegroundColor White
Write-Host "   https://www.twilio.com/try-twilio" -ForegroundColor Yellow
Write-Host ""

