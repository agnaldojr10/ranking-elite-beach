# syntax=docker/dockerfile:1
# Imagem do Portal do Jogador (Next.js 14, BFF). Contexto de build = RAIZ do monorepo:
#   docker build -f apps/portal/Dockerfile -t reb-portal .
# Usa a saída "standalone" do Next (ver output em apps/portal/next.config.mjs).

# ---------- Stage 1: build ----------
FROM node:20-slim AS build
WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

COPY . .

# Instala apenas o necessário para o portal (+ contracts); evita módulos nativos da API.
RUN pnpm install --frozen-lockfile --filter @reb/portal...

# contracts tem entry em dist/ -> precisa ser compilado antes do next build.
RUN pnpm --filter @reb/contracts build \
  && pnpm --filter @reb/portal build

# ---------- Stage 2: runtime ----------
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Saída standalone (server.js + node_modules traçado, preservando o layout do monorepo).
COPY --from=build /app/apps/portal/.next/standalone ./
COPY --from=build /app/apps/portal/.next/static ./apps/portal/.next/static
COPY --from=build /app/apps/portal/public ./apps/portal/public

RUN useradd --system --uid 1001 --create-home appuser \
  && chown -R appuser:appuser /app
USER appuser

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/portal/server.js"]
