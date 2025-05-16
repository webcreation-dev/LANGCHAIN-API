FROM node:20-alpine

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm install

# Copie des fichiers du projet
COPY . .

# Création du dossier uploads
RUN mkdir -p uploads

# Exposition du port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]