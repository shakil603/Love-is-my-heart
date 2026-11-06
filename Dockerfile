# syntax=docker/dockerfile:1

# Love Is My Heart (LIMH) — production image
# The app runs on PostgreSQL. For a single-container demo you can omit
# DATABASE_URL and PGlite will store data in the mounted /app/.data volume.

FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time only: Better Auth wants a secret to exist while pages are compiled.
ENV BETTER_AUTH_SECRET=build-time-placeholder
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache libc6-compat \
  && addgroup -g 1001 -S nodejs \
  && adduser -S nextjs -u 1001

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/next.config.ts ./next.config.ts

RUN mkdir -p /app/.data /app/public/uploads \
  && chown -R nextjs:nodejs /app/.data /app/public/uploads

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npx", "next", "start", "-H", "0.0.0.0"]
