# Usa una imagen oficial de Node.js (en este ejemplo, versión 18-alpine)
FROM node:18-alpine
LABEL authors="c4rberus"


# Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia los archivos de configuración de npm
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código de la aplicación
COPY . .

# Expone el puerto definido en .env (por ejemplo, 3000)
EXPOSE ${PORT}

# Comando para iniciar la aplicación
CMD [ "npm", "run", "start" ]
# CMD ["node", "src/app.js"]
