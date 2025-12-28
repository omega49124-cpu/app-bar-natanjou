# Dockerfile pour le Frontend React
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json yarn.lock ./

# Installer les dépendances
RUN yarn install --frozen-lockfile

# Copier le code source
COPY . .

# Build de production (optionnel)
# RUN yarn build

# Exposer le port
EXPOSE 3000

# Commande de démarrage (mode développement)
CMD ["yarn", "start"]
