# Onboarding — Ranking Elite Beach 🏖️🎾

Guia de entrada para desenvolvedores (e para o Claude Code deles). Leia isto primeiro; ele aponta para os docs detalhados em `docs/`.

---

## 1. O que é

Plataforma de campeonatos de **Beach Tennis** de um clube. Tem dois públicos:

- **Backoffice** (organização): cadastra jogadores, temporadas, campeonatos, rodadas; faz o **sorteio das duplas**, lança **placares**, gera o **mata-mata** e o **ranking**; gerencia a equipe e convites.
- **Portal do Jogador** (atletas): acompanha ranking, seus jogos, torneios, head-to-head, conquistas, recebe push — e pode **operar a rodada do dia** (sortear, lançar placares, gerar relatório de WhatsApp).

**Está em produção** (nuvem, custo zero). Idioma do produto e da comunicação: **português (pt-BR)**.

---

## 2. Stack & arquitetura

Monorepo **pnpm 9.7 + Turborepo**, **TypeScript** em tudo. Node **>= 20**.

**Apps**
- `apps/api` — **NestJS 10** (REST, prefixo `/api/v1`). JWT + RBAC, rate-limit, Swagger em `/api/docs`.
- `apps/web` — **Next.js 14** (App Router) — backoffice da organização.
- `apps/portal` — **Next.js 14** — portal do jogador (PWA, tema dark-first).

**Packages**
- `packages/contracts` (`@reb/contracts`) — **schemas Zod + tipos + funções puras** (regras testáveis: pontuação, formato do mata-mata, ranking, relatório…). É a **fonte da verdade** compartilhada entre API e front-ends. **Sempre buildar após alterar** (`pnpm --filter @reb/contracts build`) — os apps consomem o `dist`.
- `packages/db` (`@reb/db`) — **Prisma 5.22** (schema, migrations, client, seeds).
- `packages/sort-engine` (`@reb/sort-engine`) — motor de **sorteio determinístico** (pairing + agrupamento + round-robin + métricas). Ver `docs/SORT_ENGINE.md`.

**Padrão BFF:** o navegador **nunca** fala direto com a API. Ele chama o servidor Next (web/portal), que chama a API por baixo via `API_URL` (server-side, com o cookie de auth). Só a API acessa o banco.

```
Navegador ──► Next (web/portal, Vercel) ──► API (NestJS, Render) ──► Postgres (Neon)
                     (BFF)                       /api/v1
```

Leia: `docs/ARCHITECTURE.md`.

---

## 3. Estrutura

```
apps/
  api/     NestJS — módulos por domínio (auth, users, players, seasons,
           championships, rounds [draw/matches/knockout/registrations],
           ranking, stats, venues, calendar, finals, me [portal], push, invites)
  web/     Next backoffice — app/ (rotas), components/, lib/ (fetchers + BFF)
  portal/  Next portal do jogador — app/, components/, lib/, middleware.ts
packages/
  contracts/  Zod + tipos + regras puras (index.ts reexporta tudo)
  db/         Prisma (prisma/schema.prisma, migrations/, seed*.ts)
  sort-engine/ motor de sorteio
docs/         documentação detalhada (ver seção 12)
```

---

## 4. Rodar localmente

Pré-requisitos: Node ≥ 20, `pnpm@9.7.0` (`corepack enable`), um Postgres (recomendado: um banco **Neon** de desenvolvimento próprio).

```bash
pnpm install
# crie o .env na raiz (veja .env.example) com DATABASE_URL, segredos JWT etc.
pnpm packages:build          # builda @reb/contracts e @reb/db (prisma generate)
pnpm --filter @reb/db prisma migrate deploy   # aplica o schema no seu banco
pnpm db:seed                 # clube + admin base
# (opcional) dados de exemplo: veja packages/db/prisma/*.ts
```

Subir os três (em terminais separados, ou `pnpm dev` para todos via turbo):
```bash
pnpm --filter @reb/api dev      # http://localhost:3333/api/v1  (docs em /api/docs)
pnpm --filter @reb/web dev      # http://localhost:3000
pnpm --filter @reb/portal dev   # http://localhost:3001
```

Os front-ends leem `API_URL` (default `http://localhost:3333`). Variáveis: veja `.env.example`.

---

## 5. Banco de dados & Prisma

- Schema em `packages/db/prisma/schema.prisma`; migrations em `packages/db/prisma/migrations/`.
- Local (dev): `pnpm db:migrate` (cria migration) / `prisma migrate deploy` (aplica) / `pnpm db:studio`.
- **Produção:** scripts `*:prod` no `packages/db` leem um `.env.production` (gitignored) e operam o banco de produção: `prisma:prod`, `seed:prod`, `seed:real:prod`, `gen:invites:prod`. Migrations usam a URL **direct** do Neon; a API em runtime usa a **pooled**.
- Seeds: `seed.ts` (clube + admin), `seed-real.ts` (temporada/campeonato reais + rodada 1), `gen-invites.ts` (códigos de convite). Ver `docs/DATABASE.md`.

---

## 6. Domínio & regras (resumo)

Clube → Temporadas → Campeonatos (config: `scoringTable`, `participationPoints`, `qualifiersCount`) → Rodadas → Inscrições → **Sorteio** (duplas + grupos) → Jogos de grupo → **Mata-mata** → `RoundResult` (colocação + pontos) → **Ranking**.

Destaques:
- **Pontuação**: `scoringTable` por colocação + piso de **participação** (ex.: 10 pts só por jogar) via `pointsForPlacement(table, pos, participationPoints)`.
- **Mata-mata flexível automático** por nº de duplas (`planKnockout` em `packages/contracts/src/knockout.ts`): ≥6 duplas → 6 classificados (2 melhores vão direto à semi + 3º–6º nas quartas, evitando revanche de grupo); 4–5 → semi direta; 2–3 → final.
- **Histórico de parceria/adversário** alimenta o sorteio (evita repetir duplas/confrontos).
- **Fase final**, quadras, agenda, stats, head-to-head, push.

Regras completas: `docs/BUSINESS_RULES.md`, `docs/FORMATS.md`, `docs/USE_CASES.md`.

---

## 7. Autenticação & RBAC

- Login e-mail/senha (**argon2**), JWT **access + refresh**. Payload carrega `sub`, `email`, `role`, `clubId`, `playerId?`.
- Papéis: **ADMIN**, **ORGANIZER**, **PLAYER**, **VIEWER**. `@Roles(...)` + `RolesGuard` (usa `getAllAndOverride` → método sobrescreve a classe).
- Backoffice: controllers fecham para PLAYER (`@Roles('ADMIN','ORGANIZER','VIEWER')`); atleta usa as rotas `me/*`.
- Portal opera rodada via `me/rounds/*` (`@Roles('PLAYER','ADMIN','ORGANIZER')`).
- Gestão de equipe: `/users` (`@Roles('ADMIN')`) — ADMIN cria outros ADMIN/ORGANIZER.
- Atletas entram por **convite** (código com hash SHA-256, uso único) → `/claim` no portal. O backoffice gera o convite na tela do jogador.

---

## 8. Testes & qualidade

```bash
pnpm typecheck     # tsc --noEmit em todos os pacotes (turbo)
pnpm test          # vitest (regras puras dos contracts + lógica da API)
pnpm build         # build de tudo
```
Os testes vivem em `*.spec.ts` (ex.: `apps/api/src/**/**.contracts.spec.ts`, `packages/sort-engine/src/draw.spec.ts`). Priorize testar **funções puras** em `@reb/contracts`.

---

## 9. Fluxo de trabalho & convenções

- **Branch → PR → CI → squash merge.** Nunca commitar direto na `main`.
- CI (GitHub Actions): `build` (typecheck + lint + test + build) e `docker` (imagens); a Vercel builda previews do web/portal no PR.
- Mensagens de commit terminam com:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- Corpo de PR termina com o rodapé do Claude Code.
- Cada mudança de contrato → rebuildar `@reb/contracts` antes de typecheck/test.
- Código em pt-BR para textos de usuário; identificadores em inglês. Mantenha o estilo do arquivo vizinho.

---

## 10. Deploy (produção — custo zero)

- **Vercel**: `apps/web` e `apps/portal` (2 projetos; Root Directory na pasta do app; `API_URL` aponta para a API).
- **Render**: `apps/api` via Docker (`render.yaml`, plano free → hiberna ~15min; cold start ~1min no 1º acesso — há um loader temático que disfarça isso).
- **Neon**: Postgres (produção us-east-2).
- **Auto-deploy**: merge na `main` → Render + Vercel publicam sozinhos.
- Passo a passo completo: `docs/DEPLOY_PROD.md`.

---

## 11. Notas de ambiente (gotchas)

- **Windows**: `prisma generate` (no build de `@reb/db`) dá `EPERM` se um dev server estiver rodando (trava a DLL do query engine). **Encerre os processos node** (portas 3000/3333/3001) antes de buildar/gerar. Em Linux/CI não ocorre.
- **Next standalone**: o `output: 'standalone'` só liga fora da Vercel (Docker/self-host). A etapa de symlink do standalone falha só no Windows.
- **Segredos** (JWT, VAPID, senha do banco/admin) **não** ficam no repo: vivem no `.env`/`.env.production` (gitignored) e nos painéis da Vercel/Render. Peça ao dono do projeto os que precisar.

---

## 12. Mapa da documentação (`docs/`)

| Arquivo | Conteúdo |
|---|---|
| `PROJECT.md` / `REQUIREMENTS.md` | visão, escopo e requisitos |
| `ARCHITECTURE.md` | arquitetura, BFF, decisões estruturais |
| `BUSINESS_RULES.md` / `FORMATS.md` / `USE_CASES.md` | regras, formatos de rodada/mata-mata, casos de uso |
| `DATABASE.md` | modelo de dados e migrations |
| `API.md` | endpoints |
| `SORT_ENGINE.md` | motor de sorteio |
| `PLAYER_PORTAL.md` | portal do jogador |
| `DESIGN_SYSTEM.md` / `UI_UX.md` | linguagem visual (Bento "Praiano") |
| `DEPLOY.md` / `DEPLOY_PROD.md` | deploy (Docker genérico / produção custo zero) |
| `DECISIONS.md` / `ROADMAP.md` / `BACKLOG.md` | decisões, roadmap e backlog |
| `CHANGELOG.md` / `RELEASE_NOTES.md` | histórico de entregas |
| `TEST_PLAN.md` | plano de testes |

---

## 13. Estado atual

Produto **no ar em produção**. Entregue: cadastro completo, sorteio, jogos, mata-mata flexível, ranking, stats, quadras, agenda, fase final, portal do jogador (com operação de rodada + relatório WhatsApp), push, gestão de equipe, convites pelo backoffice e loaders temáticos. Veja `docs/CHANGELOG.md` para o detalhe por versão.

**Dica para o Claude Code:** rode `/init` para gerar/atualizar o `CLAUDE.md`, e use os docs acima como contexto. Antes de qualquer mudança: `pnpm typecheck && pnpm test`. Trabalhe sempre em branch + PR.
