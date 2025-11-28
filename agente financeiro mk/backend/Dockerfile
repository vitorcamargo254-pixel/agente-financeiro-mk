# Dockerfile para deploy (opcional)
FROM node:18-alpine

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instala dependências
RUN npm install

# Gera Prisma Client
RUN npx prisma generate

# Copia código fonte
COPY . .

# Compila TypeScript
RUN npm run build

# Expõe porta
EXPOSE 4000

# Comando de start
CMD ["npm", "run", "start"]

