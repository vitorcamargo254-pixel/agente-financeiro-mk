@echo off
echo ========================================
echo   Copiando Arquivos para GitHub
echo ========================================
echo.
echo Onde o GitHub Desktop salvou o repositorio?
echo.
echo Normalmente esta em:
echo   C:\Users\rose-\Documents\GitHub\agente-financeiro-mk
echo   OU
echo   C:\Users\rose-\OneDrive\Documents\GitHub\agente-financeiro-mk
echo.
echo No GitHub Desktop, clique em "Show in Explorer"
echo e copie o caminho da pasta que abrir.
echo.
set /p PASTA_DESTINO="Cole o caminho completo aqui: "

if not exist "%PASTA_DESTINO%" (
    echo.
    echo ERRO: Pasta nao encontrada!
    echo Verifique o caminho e tente novamente.
    pause
    exit /b 1
)

echo.
echo Copiando arquivos...
echo.

REM Copia arquivos individuais
copy "sistema.html.html" "%PASTA_DESTINO%\" >nul 2>&1
copy "README.md" "%PASTA_DESTINO%\" >nul 2>&1
copy "COMO_COMPARTILHAR.md" "%PASTA_DESTINO%\" >nul 2>&1
copy "DEPLOY_WHATSAPP.md" "%PASTA_DESTINO%\" >nul 2>&1
copy ".gitignore" "%PASTA_DESTINO%\" >nul 2>&1
copy "instalar.bat" "%PASTA_DESTINO%\" >nul 2>&1
copy "iniciar-backend.bat" "%PASTA_DESTINO%\" >nul 2>&1

REM Copia pasta backend (mas exclui node_modules e .env)
echo Copiando pasta backend...
xcopy "backend" "%PASTA_DESTINO%\backend\" /E /I /Y /EXCLUDE:excluir.txt >nul 2>&1

REM Cria arquivo de exclusao temporario
echo node_modules > excluir.txt
echo .env >> excluir.txt
echo *.db >> excluir.txt

xcopy "backend" "%PASTA_DESTINO%\backend\" /E /I /Y /EXCLUDE:excluir.txt

del excluir.txt >nul 2>&1

echo.
echo ========================================
echo   CONCLUIDO!
echo ========================================
echo.
echo Proximos passos:
echo 1. Volte para o GitHub Desktop
echo 2. Voce vera os arquivos em "Changes"
echo 3. Digite: "Initial commit" no campo Summary
echo 4. Clique em "Commit to main"
echo 5. Clique em "Publish branch"
echo.
pause

