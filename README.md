# Ranking Elite Beach 🏖️

WebApp de gerenciamento de campeonatos recorrentes de Beach Tennis.

Monorepo TypeScript: **Next.js** (web) + **NestJS** (api) + **PostgreSQL/Prisma**, com o **Motor Inteligente de Sorteio** isolado em pacote próprio (próximas sprints).

## Início rápido

```bash
pnpm install
cp .env.example .env
docker compose up -d          # Postgres
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm dev                      # web :3000 · api :3333
```

Login padrão: `admin@ranking-elite-beach.local` / `admin123`.

## Estrutura

```
apps/
  web/         Next.js (App Router, Tailwind) — login + dashboard
  api/         NestJS — auth JWT + RBAC, Prisma, Swagger
packages/
  contracts/   DTOs/tipos zod compartilhados (front ↔ back)
  db/          Prisma schema, client e seed
docs/          Documentação viva (PROJECT, ROADMAP, ARCHITECTURE, ...)
```

## Documentação

Toda a documentação viva está em [`/docs`](./docs) — comece por [PROJECT.md](./docs/PROJECT.md) e [ROADMAP.md](./docs/ROADMAP.md).

## Status

Sprint 1 (Fundação): monorepo, autenticação/RBAC, CI e migration inicial. Ver [CHANGELOG](./docs/CHANGELOG.md).
