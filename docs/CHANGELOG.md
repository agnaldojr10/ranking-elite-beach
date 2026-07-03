# CHANGELOG.md

> Registro de todas as alterações. Nunca apagar histórico. Formato baseado em Keep a Changelog + SemVer.

---

## [0.4.1] — 2026-07-03 — DX: scripts de dev e Sprint 3 aprovada
**Descrição:** Sprint 3 validada e aprovada no QA do PO. Ajuste de developer experience.
**Adicionado:** scripts raiz `dev:api` e `dev:web` (reconstroem `@reb/contracts` antes de subir, evitando erros de exports desatualizados ao rodar serviços isoladamente) e `packages:build`.
**Aprovado:** Sprint 3 (Temporadas e Campeonatos).

## [0.4.0] — 2026-07-03 — Sprint 3: Temporadas e Campeonatos (para QA)
**Descrição:** Temporadas e campeonatos com configuração parametrizável (pontuação, desempate, pesos do sorteio, final).
**Adicionado:**
- Prisma: enums `SeasonStatus`/`ChampionshipStatus`; models `Season`, `Championship`, `ChampionshipConfig` (JSONB) + relações.
- `@reb/contracts`: schemas de Season e Championship, config com defaults (tabela de pontuação, desempate BR-29, pesos do sorteio), `STRUCTURAL_CONFIG_KEYS` e rótulos pt-BR.
- API: `SeasonsModule` (listar/criar/mudar status) e `ChampionshipsModule` (criar com config padrão, detalhar, editar dados, editar config com **lock estrutural** BR-05, transição de status DRAFT→ACTIVE→FINISHED); escopo por clube; RBAC.
- Web: telas de Temporadas (lista/criar/encerrar) e Campeonatos (lista, criar, detalhe com resumo de config, editar dados, **editor de configuração** com seções de pontuação/desempate/sorteio/final e bloqueio quando ativo); cards no dashboard.
- Testes (vitest) de schemas de campeonato e config.
**Migration:** tabelas `season`, `championship`, `championship_config` criadas pelo QA no `pnpm db:migrate`.
**Pendências:** QA do PO.

## [0.3.0] — 2026-07-03 — Sprint 2: Jogadores (para QA)
**Descrição:** Módulo de Jogadores completo (CRUD, busca/filtro, perfil, soft delete).
**Adicionado:**
- Prisma: enums `SkillLevel` e `PlayerStatus`, model `Player` (idade derivada, soft delete) + índices; relação em `Club`.
- `@reb/contracts`: schemas de Player (create/update/query/response), rótulos pt-BR, paginação e helper `computeAge`.
- API: `PlayersModule` — listagem paginada com busca (nome) e filtros (status, nível), get, create, update e mudança de status; escopo por `club_id`; RBAC (Admin/Organizador escrevem, demais leem).
- Web: página de lista (busca/filtros/paginação), formulário criar/editar via Server Actions, perfil do jogador com avatar de iniciais e placeholder de estatísticas; middleware passa a proteger `/players`; card "Jogadores" no dashboard.
- Testes (vitest) de `computeAge` e schemas de Player; roteiro de QA da Sprint 2 no TEST_PLAN.
**Migration:** a tabela `player` é criada pelo QA no `pnpm db:migrate`.
**Pendências:** foto real por upload (ficou por URL nesta sprint — ver BACKLOG); QA do PO.

## [0.2.1] — 2026-07-03 — Sprint 1: Correções durante o QA
**Descrição:** Ajustes de ambiente/build identificados no QA do PO até o login funcionar (banco Neon).
**Corrigido:**
- `@reb/db` passa a carregar o `.env` da raiz nos comandos Prisma via `dotenv-cli` (resolve `P1012: Environment variable not found: DATABASE_URL`).
- Adicionado `@types/node` em `@reb/db` (resolve `TS2580: Cannot find name 'process'`).
- `UsersService.findByEmail/findById` com tipo de retorno explícito `Promise<User | null>` (resolve `TS2742` de tipos do Prisma em monorepo).
- Removido o `ValidationPipe` global do NestJS (usamos validação com zod), eliminando a dependência de `class-validator`.
- CI cria um `.env` a partir do `.env.example` antes de gerar o Prisma Client.
**Config:** banco definido como PostgreSQL na nuvem (Neon). Docker deixou de ser necessário para o QA.
**Resultado:** QA-3 (login) aprovado — dashboard acessível.

## [0.2.0] — 2026-07-03 — Sprint 1: Fundação (para QA)
**Descrição:** Base técnica do projeto implementada e pronta para QA.
**Motivo:** Estabelecer monorepo, autenticação/RBAC, banco e CI antes dos módulos de domínio.
**Adicionado:**
- Monorepo pnpm + Turborepo (`apps/web`, `apps/api`, `packages/contracts`, `packages/db`).
- `packages/contracts` — schemas zod compartilhados (auth, roles, tokens).
- `packages/db` — Prisma (models `Club`, `User`, enum `Role`) + seed idempotente (clube + admin).
- `apps/api` (NestJS) — `AuthModule` (login/refresh/me com JWT access+refresh e Argon2), RBAC (`@Roles` + `RolesGuard`), `PrismaModule`, `HealthController`, Swagger em `/api/docs`, validação com zod pipe.
- `apps/web` (Next.js App Router) — tela de login, BFF de auth com cookies httpOnly, middleware de proteção com refresh transparente, dashboard lendo `/auth/me`, Tailwind.
- CI (GitHub Actions): install → prisma generate → typecheck → lint → test → build.
- `docker-compose.yml` (Postgres 16), `.env.example`, README, roteiro de QA da Sprint 1 no TEST_PLAN.
**Arquivos:** raiz do monorepo + `apps/**`, `packages/**`, `.github/workflows/ci.yml`, docs atualizadas.
**Pendências:** validação (QA) do PO. Migration inicial é gerada pelo QA no primeiro `pnpm db:migrate`.

## [0.1.2] — 2026-07-03 — Fase 0: Regras de borda finalizadas
**Descrição:** PO confirmou os 3 pontos de borda; Fase 0 com regras 100% definidas.
**Arquivos alterados:** `FORMATS.md`, `BUSINESS_RULES.md` (BR-23b, BR-27), `DATABASE.md`.
**Decisões:** W.O. por lesão = placar 6/0; 1 grupo (8/10 jog.) → Final entre top-2; 2 grupos (12/14/16) → top-2 de cada grupo em Semifinal + Final.

## [0.1.1] — 2026-07-02 — Fase 0: Pendências de regra resolvidas
**Descrição:** PO validou as 8 pendências de regra de negócio; documentação atualizada.
**Motivo:** Destravar o design dos módulos de rodada, sorteio, resultados e final.
**Arquivos alterados:**
- `BUSINESS_RULES.md` — BR-05, BR-10, BR-23/23a/23b, BR-26, BR-27, BR-29, BR-34, BR-36 resolvidas; tabela de status.
- `FORMATS.md` — **novo**: matriz completa de formatos de rodada (8–64 jogadores) com grupos, classificação e mata-mata.
- `SORT_ENGINE.md` — fase final (novo sorteio ignorando histórico) e formação de grupos dinâmica.
- `DATABASE.md` — lock de config, `match_format`, `ROUND.kind`, W.O./substituição, `ROUND_RESULT`.
**Decisões:** config estrutural congela ao ficar ATIVO (sorteio ajustável por rodada); classificação = vencedores + melhores 2ºs até fechar potência de 2; partida padrão 1 set; W.O. não penaliza lesionado; final por pontos acumulados com novo sorteio sem histórico.

## [0.1.0] — 2026-07-02 — Fase 0: Planejamento
**Descrição:** Entrega do planejamento completo do projeto (Fase 0), sem código.
**Motivo:** Definir escopo, arquitetura e plano antes da implementação, conforme metodologia incremental.
**Arquivos criados (`/docs`):**
- `PROJECT.md` — visão, escopo, stack, estrutura.
- `REQUIREMENTS.md` — requisitos funcionais e não funcionais.
- `DECISIONS.md` — ADR-001 a ADR-007 (stack, DB, arquitetura, sorteio, tenancy, auth, deploy).
- `ARCHITECTURE.md` — camadas, bounded contexts, fluxos, padrões.
- `DATABASE.md` — modelo conceitual/ER e entidades.
- `BUSINESS_RULES.md` — regras BR-01..BR-37 + pendências para o PO.
- `USE_CASES.md` — casos de uso e fluxos.
- `SORT_ENGINE.md` — estratégia do Motor Inteligente de Sorteio.
- `API.md` — contrato REST base.
- `UI_UX.md` — wireframes em texto das telas.
- `TEST_PLAN.md` — plano de testes e critérios de aceite.
- `ROADMAP.md` — fases e sprints.
- `BACKLOG.md` — melhorias futuras.
- `RELEASE_NOTES.md`, `MEETING_NOTES.md` — inicializados.

**Decisões-chave:** stack full-TypeScript (Next.js + NestJS + Postgres/Prisma); single-tenant multi-tenant-ready; deploy em nuvem gerenciada.

**Pendências:** aguardando validação do PO e respostas às 8 pendências de regra de negócio.
