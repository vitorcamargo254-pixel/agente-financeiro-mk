# 🔧 Como Remover ou Corrigir PATH_EXCEL no Render

## 📋 Passo a Passo Detalhado

### 1️⃣ Acesse o Render.com

1. Abra seu navegador
2. Vá para: https://dashboard.render.com
3. Faça login na sua conta

### 2️⃣ Encontre seu Backend

1. Na página inicial do Render, você verá uma lista de serviços
2. Procure pelo serviço do **BACKEND** (não o frontend)
   - Pode ter nomes como:
     - `agente-financeiro-mk`
     - `microkids-backend`
     - `agente-financeiro-mk-backend`
     - Ou outro nome que você escolheu
3. **Clique no nome do serviço do backend**

### 3️⃣ Acesse as Variáveis de Ambiente

1. No menu lateral esquerdo, procure por:
   - **"Environment"** ou
   - **"Environment Variables"** ou
   - **"Env"** ou
   - **"Config"**
2. **Clique nessa opção**

### 4️⃣ Encontre PATH_EXCEL

1. Você verá uma lista de variáveis de ambiente
2. Procure por uma variável chamada **`PATH_EXCEL`**
3. Ela pode ter um valor como:
   - `C:/Users/rose-/OneDrive/Nova Pasta/Financeiro_ETC-.xlsm`
   - Ou outro caminho do Windows

### 5️⃣ Remover ou Corrigir

#### ✅ OPÇÃO A: REMOVER (RECOMENDADO)

1. Encontre a linha com `PATH_EXCEL`
2. Procure por um ícone de **lixeira** 🗑️ ou botão **"Delete"** ao lado
3. Clique para **remover** a variável
4. Confirme a remoção se pedido
5. **Salve** as alterações (pode ter um botão "Save" ou "Save Changes")

**Por que remover?**
- O código agora encontra o arquivo automaticamente
- Não precisa configurar manualmente
- Menos chance de erro

#### ✅ OPÇÃO B: CORRIGIR

Se preferir manter a variável:

1. Encontre a linha com `PATH_EXCEL`
2. Clique no **valor** (a parte direita, onde está o caminho)
3. **Apague** o caminho antigo do Windows
4. Digite o novo valor: `./Financeiro_ETC-.xlsm`
5. **Salve** as alterações

**Valor correto:**
```
./Financeiro_ETC-.xlsm
```

### 6️⃣ Verificar se Salvou

1. Após salvar, a página pode recarregar
2. Verifique se:
   - A variável foi removida (se escolheu remover), OU
   - O valor está correto: `./Financeiro_ETC-.xlsm` (se escolheu corrigir)

### 7️⃣ Aguardar Deploy

1. O Render pode fazer um **redeploy automático** após mudanças nas variáveis
2. Aguarde 1-2 minutos
3. Ou vá em **"Manual Deploy"** → **"Deploy latest commit"** para forçar

## 🎯 Resumo Visual

```
Render Dashboard
    ↓
Clique no Backend
    ↓
Menu Lateral → Environment
    ↓
Encontre PATH_EXCEL
    ↓
OPÇÃO A: Remover (🗑️)  OU  OPÇÃO B: Corrigir (./Financeiro_ETC-.xlsm)
    ↓
Salvar
    ↓
Aguardar Deploy
```

## ⚠️ Importante

- **Não precisa** configurar `PATH_EXCEL` se o arquivo estiver no repositório
- O código agora encontra automaticamente em múltiplos lugares
- Se remover, o código usa: `./Financeiro_ETC-.xlsm` automaticamente

## 🔍 Se Não Encontrar a Opção

Se não encontrar "Environment" no menu:

1. Procure por **"Settings"** (Configurações)
2. Dentro de Settings, procure por **"Environment Variables"**
3. Ou procure por **"Env Vars"** ou **"Environment"**

## ✅ Depois de Configurar

1. Aguarde o deploy terminar
2. Teste a sincronização no site
3. Se ainda der erro, veja os logs do Render:
   - Render → Backend → Logs
   - Procure por "Caminhos testados" e "Usando caminho"

## 🆘 Precisa de Ajuda?

Se tiver dificuldade:
1. Me envie um screenshot da tela do Render
2. Ou me diga em qual passo está travado
3. Vou te ajudar a encontrar!



