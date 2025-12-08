FROM oven/bun:1 AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json and lockfile
COPY package.json bun.lock ./

# Copy ALL Prisma schemas for generation
COPY prisma ./prisma
COPY src/services/citizen/prisma ./src/services/citizen/prisma
COPY src/services/business/prisma ./src/services/business/prisma
COPY src/services/gov/prisma ./src/services/gov/prisma

# Install dependencies
RUN bun install --frozen-lockfile

# Generate Prisma Clients for ALL schemas
RUN bunx --bun prisma generate --schema=./prisma/schema.prisma
RUN bunx --bun prisma generate --schema=./src/services/citizen/prisma/schema.prisma
RUN bunx --bun prisma generate --schema=./src/services/business/prisma/schema.prisma
RUN bunx --bun prisma generate --schema=./src/services/gov/prisma/schema.prisma

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set Env vars for build time
# Set Env vars for build time
ENV NEXT_TELEMETRY_DISABLED 1
ENV BETTER_AUTH_SECRET="build_time_secret_placeholder"
# Note: Database URLs are NOT needed for build unless specific pages compel it (we fixed that with static/dynamic config)
# But if Next.js tries to connect during build, it might be an issue. 
# We assume 'bun runs build' works without DB if pages are properly dynamic or static.

RUN bun run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install netcat for database health check script and adduser for user creation
RUN apt-get update && apt-get install -y netcat-openbsd adduser && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy essential files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src

# Copy any other config files needed for runtime
COPY --from=builder /app/next.config.ts ./

# Copy test payload for ML predictions
COPY --from=builder /app/test_payload_2024.json ./test_payload_2024.json

# Helper script for migrations
COPY docker-entrypoint.sh /usr/local/bin/
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["bun", "run", "start"]
