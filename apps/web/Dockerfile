# syntax=docker/dockerfile:1
# Imagem da Web (Next.js 14, BFF). Contexto de build = RAIZ do monorepo:
#   docker build -f apps/web/Dockerfile -t reb-web .
# Usa a saída "standalone" do Next (ver output em apps/web/next.config.mjs).

# ---------- Stage 1: build ----------
FROM node:20-slim AS build
WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

COPY . .

# Instala apenas o necessário para a web (+ contracts); evita compilar módulos
# nativos da API (argon2), que não fazem parte deste closure.
RUN pnpm install --frozen-lockfile --filter @reb/web...

# contracts tem entry em dist/ -> precisa ser compilado antes do next build.
RUN pnpm --filter @reb/contracts build \
  && pnpm --filter @reb/web build

# ---------- Stage 2: runtime ----------
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Saída standalone (server.js + node_modules traçado, preservando o layout do
# monorepo a partir da raiz -> apps/web/server.js).
COPY --from=build /app/apps/web/.next/standalone ./
# Assets estáticos e públicos não entram no standalone: copiados à parte.
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

RUN useradd --system --uid 1001 --create-home appuser \
  && chown -R appuser:appuser /app
USER appuser

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/web/server.js"]
