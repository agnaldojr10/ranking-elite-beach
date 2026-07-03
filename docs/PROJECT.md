# PROJECT.md — Ranking Elite Beach

> Documento principal do projeto. Sempre atualizado.
> Última atualização: 2026-07-02 · Fase 0 (Planejamento) · Status: aguardando validação do PO

---

## 1. Objetivo do sistema

WebApp para **gerenciamento completo de campeonatos recorrentes de Beach Tennis**, controlando todo o ciclo: cadastro de jogadores, campeonatos e temporadas, inscrição em rodadas, **sorteio inteligente das duplas**, formação automática de grupos, geração de confrontos, registro de resultados, classificação, ranking, estatísticas e fase final.

O diferencial central é o **Motor Inteligente de Sorteio**, que gera a melhor combinação de duplas/grupos com base em regras configuráveis (histórico de parceiros/adversários, ranking, nível técnico, aleatoriedade), com simulação, score de qualidade e explicação das decisões.

Referência de UX: LetzPlay — porém com regras próprias e motor de sorteio muito mais inteligente.

## 2. Escopo

**Dentro do escopo (visão de produto):**
- Jogadores, Temporadas, Campeonatos, Rodadas, Inscrições, Duplas, Grupos, Jogos, Classificação, Ranking, Estatísticas, Quadras, Agenda, Dashboard.
- Motor de sorteio com simulação, score e explicabilidade.
- Administração do campeonato e histórico completo.

**Fora do escopo do MVP (arquitetura preparada, implementação futura):**
- Multi-clube (SaaS multi-tenant) — o schema já nasce preparado, mas o MVP opera com **um único clube**.
- Envio real de notificações (WhatsApp/E-mail/Push) — apenas a arquitetura de eventos é preparada.
- Pagamentos/mensalidades, app mobile nativo.

## 3. Visão geral

- **Tenancy:** single-tenant no MVP, **estruturado para evoluir para multi-clube** (coluna `club_id` presente desde o início).
- **Deploy:** nuvem gerenciada.
- **Perfis de acesso:** Admin, Organizador, Jogador, Visitante.

## 4. Tecnologias utilizadas

| Camada | Tecnologia | Motivo resumido |
|---|---|---|
| Monorepo | pnpm + Turborepo | Compartilhar tipos/domínio entre front e back |
| Frontend | Next.js 14 (App Router) + React 18 + TypeScript | SSR/ISR, PWA, ecossistema maduro |
| UI | TailwindCSS + shadcn/ui + Recharts | Design system rápido, acessível e moderno |
| Estado/Dados | TanStack Query + Zustand | Cache de servidor + estado de UI leve |
| Backend | NestJS (TypeScript) | Modular, DI, favorece Clean Architecture + DDD |
| ORM/DB | Prisma + PostgreSQL | Type-safety, migrations, JSONB para configs |
| Auth | JWT (access+refresh) + Passport + Argon2 | Padrão, sem dependência de fornecedor |
| Sort Engine | Módulo TS puro (domain service) | Testável, determinístico, sem I/O |
| Infra | Vercel (front) + Railway/Render + Postgres gerenciado (Neon) | Nuvem gerenciada, backups automáticos |
| Testes | Vitest/Jest + Supertest + Playwright | Unit, API e E2E |
| Qualidade | ESLint + Prettier + Husky + GitHub Actions | CI e padronização |

> Justificativa completa em [DECISIONS.md](./DECISIONS.md).

## 5. Organização das pastas (proposta)

```
ranking-elite-beach/
├── apps/
│   ├── web/                 # Next.js (frontend)
│   └── api/                 # NestJS (backend)
├── packages/
│   ├── domain/              # Entidades, value objects, regras puras (compartilhável)
│   ├── sort-engine/         # Motor Inteligente de Sorteio (TS puro)
│   ├── contracts/           # DTOs/tipos compartilhados front↔back (zod)
│   └── ui/                  # Componentes compartilhados (opcional)
├── docs/                    # Documentação viva (este diretório)
├── prisma/                  # schema.prisma + migrations
└── turbo.json / pnpm-workspace.yaml
```

## 6. Como executar (Sprint 1 — Fundação)

Pré-requisitos: **Node 20+**, **pnpm 9+**, **Docker** (para o Postgres) — ou um Postgres próprio.

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente (copiar e ajustar se necessário)
cp .env.example .env

# 3. Subir o banco (Postgres via Docker)
docker compose up -d

# 4. Gerar client, aplicar migration inicial e semear clube + admin
pnpm db:generate
pnpm db:migrate           # cria as tabelas (primeira vez: nomeie a migration, ex. "init")
pnpm db:seed              # cria o clube padrão e o usuário admin

# 5. Rodar tudo (API :3333 e Web :3000)
pnpm dev
```

Acessos após subir:
- Web: http://localhost:3000 (login) → http://localhost:3000/dashboard
- API: http://localhost:3333/api/v1/health · Swagger: http://localhost:3333/api/docs
- Login padrão (do seed): `admin@ranking-elite-beach.local` / `admin123`

> Guia de QA da Sprint 1 em [TEST_PLAN.md](./TEST_PLAN.md#roteiro-de-qa--sprint-1-fundação).

## 7. Convenções

- Commits: **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`...).
- Branches: `main` (estável), `feature/*`, `fix/*`.
- Nomenclatura de código em **inglês**; documentação e comunicação com o cliente em **português**.
- Toda entrega segue o checklist de [ROADMAP.md](./ROADMAP.md) e atualiza [CHANGELOG.md](./CHANGELOG.md).

## 8. Índice da documentação

`PROJECT` · [REQUIREMENTS](./REQUIREMENTS.md) · [ROADMAP](./ROADMAP.md) · [ARCHITECTURE](./ARCHITECTURE.md) · [DATABASE](./DATABASE.md) · [BUSINESS_RULES](./BUSINESS_RULES.md) · [FORMATS](./FORMATS.md) · [USE_CASES](./USE_CASES.md) · [API](./API.md) · [SORT_ENGINE](./SORT_ENGINE.md) · [UI_UX](./UI_UX.md) · [TEST_PLAN](./TEST_PLAN.md) · [DECISIONS](./DECISIONS.md) · [BACKLOG](./BACKLOG.md) · [CHANGELOG](./CHANGELOG.md) · [RELEASE_NOTES](./RELEASE_NOTES.md) · [MEETING_NOTES](./MEETING_NOTES.md)
