FROM node:20-alpine

WORKDIR /app

# Copiar package.json primero para aprovechar cache de Docker
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto del código
COPY . .

# Exponer puertos
EXPOSE 8081 8082

# Comando de inicio
CMD ["npm", "start"]