FROM node:22-bookworm-slim AS deps
WORKDIR /app

COPY package*.json ./
COPY scripts/ ./scripts/
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/public
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

LABEL org.opencontainers.image.title="ERDB"
LABEL org.opencontainers.image.description="ERDB generates poster, backdrop, and logo images with dynamic ratings on the fly."
LABEL org.opencontainers.image.source="https://github.com/IbbyLabs/erdb"

RUN apt-get update \
		&& apt-get install -y --no-install-recommends \
			fontconfig \
			fonts-dejavu-core \
			fonts-freefont-ttf \
			fonts-noto-core \
		&& rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN mkdir -p /app/data && chown -R node:node /app
USER node
VOLUME ["/app/data"]

EXPOSE 3000
CMD ["node", "server.js"]
