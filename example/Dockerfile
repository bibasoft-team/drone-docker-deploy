FROM node:alpine



WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY index.js index.js

ENTRYPOINT [ "node", "." ]