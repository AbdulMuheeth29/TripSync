# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Production deps only (server bundle externalizes some packages)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Built server + client static
COPY --from=builder /app/dist ./dist
# Migrations for deploy-time db:migrate
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/drizzle.config.ts ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O- http://localhost:3000/api/health || exit 1

CMD ["node", "dist/index.cjs"]
