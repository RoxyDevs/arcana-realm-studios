# Built with the repo root as build context (not apps/api) — this Dockerfile
# needs the whole pnpm workspace (packages/database, packages/types) to install
# and build correctly. On Railway: Root Directory stays unset/".", Dockerfile
# Path is set to "apps/api/Dockerfile".

FROM node:20-slim

# Prisma's query/schema engines need OpenSSL to detect the right engine
# variant — node:20-slim (Debian slim) doesn't ship it by default.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

# Install deps first (better layer caching) — only the manifests needed to
# resolve the workspace graph for @arcana/api.
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/database/package.json packages/database/package.json
COPY packages/types/package.json packages/types/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --no-frozen-lockfile

# Now bring in the actual source and build.
COPY packages/database packages/database
COPY packages/types packages/types
COPY apps/api apps/api

RUN pnpm --filter @arcana/database db:generate
RUN pnpm --filter @arcana/types build
RUN pnpm --filter @arcana/database build
RUN pnpm --filter @arcana/api build

ENV NODE_ENV=production
WORKDIR /app/apps/api

CMD ["pnpm", "start"]
