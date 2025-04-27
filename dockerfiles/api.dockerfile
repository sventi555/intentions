FROM node:22-alpine AS base

################################################################################
FROM base AS installer

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app

RUN pnpm add -g turbo@2
COPY . .

RUN turbo prune api --docker

################################################################################
FROM base AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=installer /app/out/json/ .
RUN pnpm install --frozen-lockfile --prod --ignore-scripts 

COPY --from=installer /app/out/full/ .

################################################################################
FROM oven/bun:1 AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono
USER hono

COPY --from=builder --chown=hono:nodejs /app .

CMD bun run --filter api start
