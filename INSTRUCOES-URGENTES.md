# 🚨 INSTRUÇÕES URGENTES - Botão Enviar Planilha

## ❌ PROBLEMA ATUAL
O Render está mostrando a versão ANTIGA do código. O botão "Enviar Planilha" não aparece.

## ✅ SOLUÇÃO - FAÇA EXATAMENTE ISSO:

### PASSO 1: Abrir GitHub Desktop
1. Abra o **GitHub Desktop**
2. Se não aparecer mudanças, clique em **"Repository"** → **"Show in Explorer"**
3. Abra a pasta que aparecer
4. Volte ao GitHub Desktop e pressione **F5** para atualizar

### PASSO 2: Verificar se aparecem mudanças
- Deve aparecer `index.html` e `sistema.html.html` como modificados
- Se NÃO aparecer, vá para o PASSO ALTERNATIVO abaixo

### PASSO 3: Fazer Commit
1. Escreva a mensagem: `Força atualização: botão Enviar Planilha v3`
2. Clique em **"Commit to main"**
3. Clique em **"Push origin"**
4. **AGUARDE** até aparecer "Pushed to origin/main"

### PASSO 4: Deploy Manual no Render (OBRIGATÓRIO!)
1. Abra: https://dashboard.render.com
2. Faça login
3. Clique no serviço **`agente-financeiro-mk-1`** (frontend)
4. Procure o botão **"Manual Deploy"** (canto superior direito)
5. Clique em **"Manual Deploy"** → **"Deploy latest commit"**
6. **AGUARDE 2-5 MINUTOS** até aparecer "Deploy succeeded"

### PASSO 5: Limpar Cache do Navegador
1. Abra o site: https://agente-financeiro-mk-1.onrender.com
2. Pressione **Ctrl + Shift + Delete**
3. Selecione **"Imagens e arquivos em cache"**
4. Clique em **"Limpar dados"**
5. Feche e abra o navegador novamente
6. OU simplesmente pressione **Ctrl + F5** na página

---

## 🔧 PASSO ALTERNATIVO (se GitHub Desktop não detectar mudanças)

### Opção A: Forçar mudança manual
1. Abra: `C:\Users\rose-\OneDrive\Documentos\GitHub\agente-financeiro-mk`
2. Abra `index.html` no Bloco de Notas
3. Na linha 7, você verá: `<!-- Versão: 2025-01-08-16-00 - FORÇA DETECÇÃO GIT - Botão Enviar Planilha -->`
4. Adicione um espaço em branco no final da linha e salve
5. Faça o mesmo com `sistema.html.html`
6. Volte ao GitHub Desktop e pressione **F5**

### Opção B: Usar Git via linha de comando
1. Abra o PowerShell
2. Execute:
```powershell
cd "C:\Users\rose-\OneDrive\Documentos\GitHub\agente-financeiro-mk"
git add index.html sistema.html.html
git commit -m "Força atualização: botão Enviar Planilha v3"
git push origin main
```

---

## ✅ VERIFICAÇÃO FINAL

Após fazer tudo acima:
1. Abra: https://agente-financeiro-mk-1.onrender.com
2. Pressione **F12** (Console)
3. Procure por: `🌐 API_BASE configurado para: https://agente-financeiro-mk-backend.onrender.com`
4. Procure o botão verde **"Enviar Planilha"** ao lado do botão "Sincronizar"
5. Se aparecer, **SUCESSO!** ✅
6. Se NÃO aparecer, verifique:
   - Se o deploy no Render terminou (PASSO 4)
   - Se limpou o cache (PASSO 5)
   - Se o código está no GitHub (PASSO 3)

---

## 📞 SE AINDA NÃO FUNCIONAR

1. No Render, vá em **Settings** do serviço frontend
2. Procure por **"Clear build cache"**
3. Clique e depois faça **"Manual Deploy"** novamente
4. Aguarde e limpe o cache do navegador novamente

