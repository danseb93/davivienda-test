FROM node:22-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código (incluyendo la carpeta prisma)
COPY . .

# Generar el cliente de Prisma adaptado al entorno Linux de Alpine
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:dev"]