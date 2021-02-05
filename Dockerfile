FROM node:alpine

COPY --from=library/docker:latest /usr/local/bin/docker /usr/bin/docker
COPY --from=docker/compose:latest /usr/local/bin/docker-compose /usr/bin/docker-compose

WORKDIR /bin/drone-docker-deploy
COPY package*.json ./
RUN npm ci --only=production

COPY src src

ENTRYPOINT [ "node", "/bin/drone-docker-deploy" ]