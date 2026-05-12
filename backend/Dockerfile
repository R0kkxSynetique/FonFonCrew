FROM node:20-alpine

RUN apk add --no-cache tini curl ca-certificates openssl git tar zip unzip bash

RUN adduser -D -h /home/container container

ENV USER=container HOME=/home/container
WORKDIR /home/container

COPY --chown=container:container package*.json ./
RUN npm ci

COPY --chown=container:container . .
RUN npx prisma generate

RUN chmod +x docker-entrypoint.sh
RUN cp docker-entrypoint.sh /entrypoint.sh

USER container

EXPOSE 3001
ENTRYPOINT ["/usr/bin/tini", "-g", "--"]
CMD ["/entrypoint.sh"]
