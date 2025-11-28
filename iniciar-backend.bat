@echo off
echo ========================================
echo   Iniciando Backend do Sistema Financeiro
echo ========================================
echo.

cd /d "%~dp0backend"

echo Verificando se Node.js esta instalado...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale o Node.js primeiro.
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit /b 1
)

echo.
echo Iniciando servidor backend...
echo Pressione Ctrl+C para parar o servidor
echo.

npm run start:dev

