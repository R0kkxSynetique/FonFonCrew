FROM --platform=$TARGETOS/$TARGETARCH node:20-alpine

RUN apk add --no-cache tini curl ca-certificates openssl git tar zip unzip bash

RUN adduser -D -h /home/container container

ENV USER=container HOME=/home/container
WORKDIR /home/container

COPY --chown=container:container package*.json ./
RUN npm ci

COPY --chown=container:container . .
RUN npx prisma generate

COPY --chown=container:container entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN rm -rf /home/container/.npm

USER container

EXPOSE 3001
ENTRYPOINT ["/sbin/tini", "-g", "--"]
CMD ["/entrypoint.sh"]
