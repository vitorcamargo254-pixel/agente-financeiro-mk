@echo off
echo ========================================
echo   Instalador Sistema Financeiro Microkids
echo ========================================
echo.

cd /d "%~dp0backend"

echo [1/4] Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js nao encontrado!
    echo Por favor, instale o Node.js primeiro: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js encontrado

echo.
echo [2/4] Instalando dependencias...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao instalar dependencias
    pause
    exit /b 1
)
echo ✅ Dependencias instaladas

echo.
echo [3/4] Configurando banco de dados...
if not exist ".env" (
    echo ⚠️ Arquivo .env nao encontrado
    if exist ".env.example" (
        echo Copiando .env.example para .env...
        copy .env.example .env >nul
        echo ✅ Arquivo .env criado. Configure suas credenciais!
    ) else (
        echo ❌ Arquivo .env.example nao encontrado
    )
)

call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao gerar cliente Prisma
    pause
    exit /b 1
)

call npx prisma migrate deploy
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ Aviso: Erro ao executar migracoes (pode ser normal se o banco ja existe)
)

echo ✅ Banco de dados configurado

echo.
echo [4/4] Verificando arquivos...
if not exist "..\sistema.html.html" (
    echo ⚠️ Arquivo sistema.html.html nao encontrado na pasta raiz
)

echo.
echo ========================================
echo   ✅ Instalacao concluida!
echo ========================================
echo.
echo Proximos passos:
echo 1. Configure o arquivo backend\.env com suas credenciais
echo 2. Execute: iniciar-backend.bat
echo 3. Abra sistema.html.html no navegador
echo.
echo Veja README.md para mais informacoes
echo.
pause

