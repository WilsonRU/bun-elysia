FROM oven/bun:1.3.14 AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY tsconfig.json biome.json ./
COPY src ./src

RUN bun run build

FROM debian:bookworm-slim AS production

WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates curl \
	&& groupadd --system app \
	&& useradd --system --gid app --home-dir /app --shell /usr/sbin/nologin app \
	&& rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY --from=build --chown=app:app /app/server ./server

USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
	CMD curl --fail http://127.0.0.1:3000/ready || exit 1

CMD ["./server"]
