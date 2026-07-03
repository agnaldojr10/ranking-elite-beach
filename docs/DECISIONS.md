# DECISIONS.md — Registro de Decisões Arquiteturais (ADR)

> Cada decisão importante: Contexto · Problema · Alternativas · Decisão · Consequências.

---

## ADR-001 — Stack tecnológica: Node + React (TypeScript full-stack)

- **Contexto:** projeto novo (greenfield). O time tem background em C#/.NET/Firebird (SIGECOM), mas o PO pediu explicitamente uma stack **inovadora e disruptiva** em relação ao legado.
- **Problema:** escolher uma stack moderna, com bom ecossistema para WebApp, PWA e futura evolução para SaaS.
- **Alternativas:** (a) .NET/Blazor — reaproveita conhecimento, mas mantém o time preso ao mesmo paradigma; (b) React + API .NET — meio-termo, 2 linguagens; (c) Full TypeScript (Node + React).
- **Decisão:** **Full TypeScript** — Next.js (front) + NestJS (back), tipos compartilhados no monorepo.
- **Consequências:** curva de aprendizado inicial; em troca, uma linguagem única em toda a stack, domínio compartilhável entre front/back, ecossistema web enorme e alinhamento com o pedido de inovação.

## ADR-002 — Banco de dados: PostgreSQL + Prisma

- **Contexto:** dados relacionais fortes (jogadores, duplas, jogos, ranking) + configurações flexíveis (pesos do sorteio, tabela de pontuação).
- **Problema:** precisamos de integridade relacional e, ao mesmo tempo, campos de configuração variáveis por campeonato.
- **Alternativas:** MySQL, SQL Server, MongoDB.
- **Decisão:** **PostgreSQL** (relacional + colunas **JSONB** para configs) com **Prisma** como ORM.
- **Consequências:** migrations versionadas, type-safety ponta a ponta; JSONB evita "hardcode" de tabelas de pontuação/pesos (atende à regra de "nunca deixar valores fixos no código").

## ADR-003 — Backend NestJS com Clean Architecture + DDD modular

- **Contexto:** sistema deve evoluir por anos, com módulos independentes (sorteio, ranking, estatísticas).
- **Problema:** evitar acoplamento e "código rápido só para funcionar".
- **Alternativas:** Express minimalista, Fastify puro, Next.js API routes.
- **Decisão:** **NestJS** com camadas (Domain / Application / Infrastructure / Interface) e módulos por bounded context.
- **Consequências:** mais boilerplate inicial; em troca, DI, testabilidade, fronteiras claras e escalabilidade de time.

## ADR-004 — Motor de Sorteio como pacote isolado e puro

- **Contexto:** o sorteio é o principal diferencial e precisa ser testável, determinístico e reutilizável.
- **Problema:** lógica de sorteio não pode depender de banco/HTTP nem ser não-determinística em testes.
- **Alternativas:** implementar dentro do módulo de rodadas do backend.
- **Decisão:** pacote **`packages/sort-engine`** em TS puro, sem I/O, com **RNG semeável (seed)** para reprodutibilidade.
- **Consequências:** o backend só fornece dados e persiste o resultado; o motor pode ser testado com milhares de cenários e evoluir sem tocar no restante.

## ADR-005 — Tenancy: single-tenant no MVP, schema multi-tenant-ready

- **Contexto:** PO quer validar com **um clube**, mas manter possibilidade de expandir para SaaS.
- **Problema:** migração futura para multi-clube pode ser cara se ignorada agora.
- **Alternativas:** ignorar multi-tenancy; já implementar multi-tenant completo.
- **Decisão:** incluir `club_id` nas entidades-raiz desde já, com **um clube semeado** e filtro de tenant na camada de repositório; sem UI de gestão de clubes no MVP.
- **Consequências:** custo marginal baixo agora; evita migração dolorosa depois. RLS/isolamento avançado fica no backlog.

## ADR-006 — Autenticação própria com JWT (sem lock-in de fornecedor)

- **Contexto:** deploy em nuvem gerenciada; queremos controle e custo previsível.
- **Alternativas:** Clerk/Auth0 (rápido, mas custo recorrente e lock-in).
- **Decisão:** **JWT** (access curto + refresh) com Passport e hashing **Argon2**; RBAC com papéis Admin/Organizador/Jogador/Visitante.
- **Consequências:** um pouco mais de código de auth; sem custo por usuário e sem dependência externa.

## ADR-007 — Deploy em nuvem gerenciada

- **Decisão:** front na **Vercel**, API + Postgres gerenciados (**Railway/Render/Neon**).
- **Consequências:** backups e SSL automáticos, acesso de qualquer lugar; custo mensal recorrente (aceito pelo PO).

> Nota de alinhamento com preferências do PO: mantivemos a arquitetura **modular monolítica** (não microsserviços). "Disruptivo" aqui = stack moderna, não complexidade distribuída desnecessária.
