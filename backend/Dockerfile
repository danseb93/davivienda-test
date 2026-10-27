FROM node:22-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código (incluyendo la carpeta prisma)
COPY . .

RUN npx prisma generate dev

RUN npx prisma migrate dev

EXPOSE 3000

CMD ["npm", "run", "start:dev"]