# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm
RUN corepack enable

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/

# Install dependencies (including workspace)
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared packages/shared
COPY apps/web apps/web

# Build shared package first, then the web app
RUN pnpm --filter @habit/shared run build
RUN pnpm --filter @habit/web run build

# ---- Runtime stage ----
FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
