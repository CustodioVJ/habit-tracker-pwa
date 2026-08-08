# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm
RUN corepack enable

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

# Install dependencies (including workspace)
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared packages/shared
COPY apps/api apps/api

# Build shared package first, then the API
RUN pnpm --filter @habit/shared run build
RUN pnpm --filter @habit/api run build

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable

# Copy workspace manifests and install production deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/prisma apps/api/prisma
COPY --from=build /app/node_modules/.pnpm node_modules/.pnpm

# Generate Prisma client for the runtime
RUN cd apps/api && npx prisma generate

EXPOSE 4000

WORKDIR /app/apps/api
CMD ["node", "dist/server.js"]
