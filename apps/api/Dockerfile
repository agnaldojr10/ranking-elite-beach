# syntax=docker/dockerfile:1
# Imagem da API (NestJS). Contexto de build = RAIZ do monorepo:
#   docker build -f apps/api/Dockerfile -t reb-api .
# Base Debian slim (não Alpine) para evitar problemas de OpenSSL/musl do Prisma.

# ---------- Stage 1: build ----------
FROM node:20-slim AS build
WORKDIR /app

# openssl + ca-certificates: exigidos pelo engine do Prisma.
# python3 + build-essential: compilar o módulo nativo argon2.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates python3 build-essential \
  && rm -rf /var/lib/apt/lists/*

# pnpm via corepack, na versão fixada no package.json raiz.
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

# Copia o monorepo (o .dockerignore exclui node_modules/dist/.next/.env).
COPY . .

# O build de @reb/db usa dotenv-cli lendo ../../.env; o Prisma generate NÃO
# conecta ao banco, então um .env fictício (a partir do exemplo) basta aqui.
RUN cp .env.example .env

RUN pnpm install --frozen-lockfile

# Ordem de build: contracts -> db (prisma generate + tsc) -> api.
RUN pnpm --filter @reb/contracts build \
  && pnpm --filter @reb/db build \
  && pnpm --filter @reb/api build

# ---------- Stage 2: runtime ----------
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# openssl (engine Prisma) + ca-certificates (TLS até o Neon).
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# pnpm disponível para rodar `prisma migrate deploy` no release (ver docs/DEPLOY.md).
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

# Traz o monorepo já construído (dist + node_modules com o Prisma Client gerado,
# schema e migrations). Remove o .env fictício: em produção as vars vêm do ambiente.
COPY --from=build /app /app
RUN rm -f /app/.env

# Usuário não-root.
RUN useradd --system --uid 1001 --create-home appuser \
  && chown -R appuser:appuser /app
USER appuser

EXPOSE 3333
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.API_PORT||3333)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/api/dist/main.js"]
