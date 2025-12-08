# 📊 Como Configurar o Arquivo Excel no Render

## ✅ O que foi feito

1. ✅ Arquivo Excel copiado para `backend/Financeiro_ETC-.xlsm`
2. ✅ Código atualizado para usar o arquivo na pasta backend/
3. ✅ Removidos caminhos hardcoded do Windows

## 🔧 Configurar no Render.com

### Opção 1: Usar arquivo do repositório (RECOMENDADO)

O arquivo já está na pasta `backend/`, então você pode:

1. **Não precisa configurar PATH_EXCEL** - O código vai usar automaticamente `backend/Financeiro_ETC-.xlsm`

2. **OU configure no Render:**
   - Vá em render.com → Seu Backend → Environment
   - Adicione variável:
     - **Key:** `PATH_EXCEL`
     - **Value:** `./Financeiro_ETC-.xlsm`
   - Salve

### Opção 2: Upload manual (se necessário)

Se o arquivo não aparecer no deploy:

1. Vá em render.com → Seu Backend → Settings
2. Procure por "File Upload" ou use o terminal
3. Faça upload do arquivo `Financeiro_ETC-.xlsm` para a pasta raiz do backend

## ✅ Verificar se funcionou

1. Faça commit e push do arquivo Excel
2. Aguarde o deploy no Render
3. Teste a sincronização no site
4. Se der erro, verifique os logs do Render

## 📝 Importante

- O arquivo Excel agora está no repositório GitHub
- Ele será incluído no deploy automático
- Não precisa mais de caminhos locais do Windows



