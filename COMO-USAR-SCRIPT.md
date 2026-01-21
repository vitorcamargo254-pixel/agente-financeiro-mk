# 🚀 Como Usar o Script de Commit Automático

## ⚠️ PROBLEMA
O GitHub Desktop não está detectando as mudanças ou o Render não está atualizando.

## ✅ SOLUÇÃO: Script PowerShell Automático

### PASSO 1: Executar o Script
1. Abra o **PowerShell** (Windows + X → Windows PowerShell)
2. Execute este comando:
```powershell
cd "C:\Users\rose-\OneDrive\Documentos\GitHub\agente-financeiro-mk"
.\fazer-commit-automatico.ps1
```

### PASSO 2: Se der erro de permissão
Se aparecer erro de "execução de scripts desabilitada", execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Depois execute o script novamente.

### PASSO 3: Deploy Manual no Render (OBRIGATÓRIO!)
1. Acesse: https://dashboard.render.com
2. Clique no serviço **`agente-financeiro-mk-1`** (frontend)
3. Clique em **"Manual Deploy"** (canto superior direito)
4. Selecione **"Deploy latest commit"**
5. **AGUARDE 2-5 MINUTOS** até aparecer "Deploy succeeded"

### PASSO 4: Limpar Cache do Navegador
1. Abra o site: https://agente-financeiro-mk-1.onrender.com
2. Pressione **Ctrl + Shift + Delete**
3. Selecione **"Imagens e arquivos em cache"**
4. Clique em **"Limpar dados"**
5. OU pressione **Ctrl + F5** na página

---

## 🔍 VERIFICAÇÃO

Após fazer tudo:
1. Abra o site no Render
2. Pressione **F12** (Console)
3. Procure por: `🌐 API_BASE configurado para: https://agente-financeiro-mk-backend.onrender.com`
4. Procure o botão verde **"Enviar Planilha"** entre "Limpar" e "Sincronizar"
5. Se aparecer, **SUCESSO!** ✅

---

## 📞 SE AINDA NÃO FUNCIONAR

1. No Render, vá em **Settings** do serviço frontend
2. Procure por **"Clear build cache"**
3. Clique e depois faça **"Manual Deploy"** novamente
4. Aguarde e limpe o cache do navegador novamente







