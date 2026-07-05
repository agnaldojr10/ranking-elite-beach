# CHANGELOG.md

> Registro de todas as alterações. Nunca apagar histórico. Formato baseado em Keep a Changelog + SemVer.

---

## [0.20.0] — 2026-07-05 — Fase 12 (fatia 3): Portal — Notificações Push (para QA) — encerra o épico
**Descrição:** Web Push no Portal do Jogador. **121 testes** (115 + 6). Migration `push_subscriptions` (nova tabela + `match.start_notified_at`).
**Backend (API):**
- Deps `web-push` + `@nestjs/schedule`; `ScheduleModule.forRoot()`.
- `PushModule`: `PushService` (assinaturas, `notifyPlayers`, purga assinatura morta 404/410; desativado sem VAPID), `PushController` (`GET /me/push/public-key`, `POST /me/push/subscribe|unsubscribe`, `@Roles('PLAYER')`), `PushScheduler` (`@Cron` de minuto → lembrete "vai começar" via helper puro `dueForStartReminder`, anti-duplicidade `startNotifiedAt`).
- Gatilhos em `matches.service`: **resultado lançado** e **mudança de horário/quadra** → `notifyPlayers` (best-effort). Env `VAPID_*`, `PUSH_START_LEAD_MIN`, `INVITE_TTL_DAYS`.
**Portal (`apps/portal`):**
- SW trata `push`/`notificationclick`; **toggle "Notificações"** no Perfil (`PushToggle`); BFF `/api/push/subscribe|unsubscribe`.
**Migration:** `push_subscriptions`. **Contratos:** aditivos (`PushSubscriptionInput`, `PushPublicKey`). **Smoke:** boot com Schedule+Push OK; `/me/push/public-key` retorna a chave (PLAYER) e 403 (admin).
**Caveat:** Web Push no iOS exige o PWA instalado (16.4+). **Pendências:** QA do PO. Com a aprovação, **encerra-se o épico do Portal do Jogador**.

## [0.19.0] — 2026-07-05 — Fase 12 (fatia 2): Portal — Meus Torneios + H2H + Conquistas (para QA)
**Descrição:** Amplia o Portal do Jogador com os módulos de acompanhamento. **Sem migration** e sem novos modelos (tudo derivado de dados existentes). **115 testes** (108 + 7).
**Backend (API):**
- Novos `/me/*` (`@Roles('PLAYER')`, escopados): `GET /me/tournaments` (campeonatos que jogo + colocação/campeão), `GET /me/tournaments/:championshipId` (minhas rodadas: meu grupo+classificação, minha chave, minha colocação), `GET /me/opponents`, `GET /me/h2h/:opponentId` (V/D + últimos jogos, BR-32), `GET /me/achievements` (conquistas derivadas de `PlayerStats`).
- `MeService` reusa `MatchesService`/`KnockoutService`/`RankingService`/`StatsService` (exportados agora em `RoundsModule`); helpers puros testáveis `buildAchievements` e `tallyH2H`.
- Correção: rótulo da rodada em jogos de fase de grupos (rodada via `group.round`) — antes caía em "Mata-mata".
**Portal (`apps/portal`):**
- Nav com **Torneios**; telas `/torneios` (lista) e `/torneios/[id]` (detalhe), `/h2h` (rivais) e `/h2h/[id]` (retrospecto); **Conquistas** no Perfil (grade de medalhas por tier) + atalho "Rivais".
- Primitivos: `AchievementBadge`, `StandingsMini`, `H2HBar`, `MatchRow` (extraído/reutilizado).
**Migration:** nenhuma. **Contratos:** aditivos. **Smoke:** claim → `/me/tournaments|/tournaments/:id|/opponents|/h2h/:id|/achievements` → 200 com dados reais; PLAYER em backoffice → 403.
**Pendências:** QA do PO. Próxima e última fatia do épico: **Push (PWA)**.

## [0.18.0] — 2026-07-04 — Fase 12 (fatia 1): Portal do Jogador — Fundação + Home + Perfil (para QA)
**Descrição:** Início do épico do **Portal do Jogador** — app **imersivo e separado** (`apps/portal`) onde o atleta reivindica a conta por **convite**, faz login e vê **só os seus dados**. Migration `player_portal` gerada/rodada pelo **QA**.
**Backend (API):**
- Schema: `User.playerId` vira **FK real** + `@@unique` (um login por atleta); novo model **`PlayerInvite`** (código de uso único, hash SHA-256, expiração).
- Auth: `playerId` no **JWT**; **`POST /auth/claim`** (reivindica via convite → cria usuário PLAYER + tokens); `UsersService.createAthlete` (transação user + consumo do convite).
- Convite (admin): **`POST /players/:id/invite`** (ADMIN/ORGANIZER) → retorna o código (em claro só na resposta).
- **`/me/*`** (`@Roles('PLAYER')`, escopado ao próprio atleta): `profile`, `stats`, `ranking` (posição + variação ▲▼), `matches`, `next-match`.
- **Gating**: leituras de backoffice (players/stats/ranking/rounds/matches) fechadas para o papel PLAYER — o atleta usa só `/me/*` e `/auth/*`.
- Testes: `invites` (hash/geração de código) + `auth.claim` (fluxo/erros). **108 testes** (102 + 6).
**Portal (`apps/portal`, Next 14 standalone):** skin imersiva dark-first (gradientes praianos, tipografia grande), BFF próprio (cookies `reb_p_*`), middleware só-PLAYER. Telas: **/claim** (código+credenciais), **/login**, **Home** (hero do atleta, próximo jogo com **contagem regressiva**, KPIs, posição no ranking), **Perfil** (números completos), **Jogos** (agenda + histórico), boundaries. **PWA dedicado** (manifest/SW/offline/ícones próprios).
**Deploy:** `apps/portal/Dockerfile` (Next standalone), serviço `portal` (3001) no `docker-compose.prod.yml`, job `docker` do CI builda também a imagem do portal; `.env.example`/`DEPLOY.md` atualizados (`INVITE_TTL_DAYS`, subdomínio próprio).
**Migration:** `player_portal` (QA). **Contratos:** aditivos (`playerId` no JWT, claim/invite/me).
**Pendências:** QA do PO. Próximas fatias: Meus Torneios (chave/grupos), H2H, gamificação, push.

## [0.17.1] — 2026-07-04 — Fase 11 encerrada (Deploy aprovado)
**Aprovado:** fatia C (Deploy) validada pelo PO. **Fase 11 concluída** (PWA + redesign + hardening + deploy). Projeto publicado em repositório privado; CI verde no `main` (typecheck/lint/testes/build + build das imagens Docker). **Próximo grande passo:** épico **Portal do jogador**.

## [0.17.0] — 2026-07-04 — Fase 11 (fatia C): Deploy — Docker + guia (para QA)
**Descrição:** Empacotamento para produção. Imagens Docker reproduzíveis (api + web), orquestração com Neon externo e guia de deploy. Sem migration; sem mudança de contratos. **Encerra a Fase 11** após aprovação.
**Adicionado:**
- **Dockerfiles multi-stage** (`apps/api/Dockerfile`, `apps/web/Dockerfile`) em `node:20-slim` (evita ciladas do Prisma no Alpine): API compila contracts→db(prisma generate)→api e roda `node dist/main.js` (usuário não-root, healthcheck); Web usa **Next standalone** (`output:'standalone'` + `outputFileTracingRoot` no `next.config.mjs`), servindo `server.js`.
- **`docker-compose.prod.yml`**: serviços `api` (3333) e `web` (3000) + serviço `migrate` (profile `tools`) para `prisma migrate deploy`. **Banco é o Neon** (externo); o `docker-compose.yml` de dev segue só com Postgres local.
- **`.dockerignore`** (contexto enxuto, sem segredos); **`docs/DEPLOY.md`** (Neon, checklist de env por app, migrations, subida, reverse proxy/TLS, health, rollback, alternativa PaaS).
- **CI**: job `docker` valida `docker build` das duas imagens a cada push/PR (**sem** publicar — push é da operação).
- `.env.example`: bloco de produção comentado (Neon SSL, segredos fortes, `API_URL` interno).
**Migration:** nenhuma. **Contratos/API:** inalterados (102 testes intactos).
**Verificação:** `next build` compila e gera as 17 páginas + build traces; a etapa de symlink do standalone falha **só no Windows** (privilégio de symlink) — em Linux (Docker/CI) conclui, coberto pelo job `docker`. Docker não instalado nesta máquina; validação das imagens fica pelo CI.
**Pendências:** QA do PO. Após aprovação, **Fase 11 encerrada**; próximo grande passo: épico Portal do jogador.

## [0.16.0] — 2026-07-04 — Fase 11 (fatia B): Hardening da API ✅ aprovado no QA
**Descrição:** Reforço de segurança da API antes do deploy. Sem migration; sem mudança de contratos (escopo só na API). 102 testes verdes (97 + 5 do novo filtro).
**Adicionado:**
- **Helmet** (`main.ts`): cabeçalhos de segurança (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `X-DNS-Prefetch-Control`, etc.). CSP desligado para não quebrar o Swagger (`/api/docs`); `Cross-Origin-Resource-Policy: cross-origin` para o consumo pelo BFF. `trust proxy = 1` para o rate-limit enxergar o IP real atrás de proxy.
- **Rate-limit** (`@nestjs/throttler`): guard global por IP (`THROTTLE_LIMIT`/`THROTTLE_TTL`, default 120 req/60s) via `APP_GUARD`; limite estrito nas credenciais (`AUTH_THROTTLE_LIMIT`, default 10 req/60s) com `@Throttle` em `POST /auth/login` e `/auth/refresh`; `/health` isento (`@SkipThrottle`). Estouro → `429 RATE_LIMITED`.
- **Filtro global de exceções** `AllExceptionsFilter` (`APP_FILTER`) com helper puro `toErrorResponse`: garante o formato `{ error: { code, message, details? } }` em 100% das respostas (repassa erros já no formato; mapeia `HttpException` cru para code do status, ex. 404→`NOT_FOUND`; `ThrottlerException`→`429 RATE_LIMITED`; erro inesperado→`500 INTERNAL_ERROR` sem vazar stack, logando a causa só no servidor).
- **Env**: `THROTTLE_TTL`/`THROTTLE_LIMIT`/`AUTH_THROTTLE_LIMIT` (com defaults) em `config/env.ts` e `.env.example`.
**Migration:** nenhuma. **Contratos/API:** formato de erro inalterado (agora garantido também para 401/404/429/500 padrão do Nest).
**Pendências:** QA do PO (roteiro QA-H no TEST_PLAN). Falta Deploy (fatia C) para encerrar a Fase 11. Épico Portal do jogador registrado.

## [0.15.2] — 2026-07-04 — Redesign aprovado (todas as telas)
**Aprovado:** redesign Bento "Praiano moderno" (claro+escuro) em todo o app, validado no QA do PO. **Próxima:** Fase 11 fatia B (Hardening da API).

## [0.15.1] — 2026-07-04 — Redesign: rollout a todas as telas (light+dark)
**Descrição:** Aplicação do design Bento "Praiano moderno" (claro+escuro) ao restante das telas, reusando os primitivos. Sem migration; só apresentação.
**Adicionado/alterado:**
- Todas as telas migradas para os tokens semânticos (funcionam nos 2 temas): Jogadores (lista/perfil/novo/editar), Temporadas, Campeonatos (lista/detalhe/novo/editar/config), Rodadas (nova/sorteio/resultados/mata-mata), Ranking, Quadras, Agenda, Help, boundaries.
- Cards elevados a tiles (`rounded-3xl` + `shadow-tile`), headers translúcidos (`sticky` + `backdrop-blur`), botões em pílula; `LineChart` tokenizado (grade/eixos via tokens); formulários e `Avatar` tokenizados.
**Migration:** nenhuma. **Contratos/API:** inalterados (118 testes intactos).
**Pendências:** QA visual (claro+escuro, mobile+desktop) em todo o app. Refino opcional: adotar `AppShell` formal em todas as páginas. (Hardening/Deploy da Fase 11 seguem pendentes; épico Portal do jogador registrado.)

## [0.15.0] — 2026-07-04 — Redesign UI/UX Bento "Praiano moderno" — fundação + vitrine (para QA)
**Descrição:** Redesenho sério da interface (pedido do PO), estilo Bento Box inspirado em apps Apple, mobile-first, com **tema claro + escuro**. Fundação do design system + telas-vitrine; demais telas no rollout seguinte. Sem migration; puramente apresentação.
**Adicionado:**
- **Design system**: tokens semânticos (CSS vars light/dark) em `globals.css`, Tailwind `darkMode:'class'` + cores/raios/sombras/fonte; script sem-flash de tema e `theme-color` por tema no `layout.tsx`.
- **Primitivos** `components/ui/`: `Tile`, `AppShell`, `Button`/`ButtonLink`, `Badge`, `StatTile`, `SectionTitle`, `EmptyState`, `ThemeToggle`, `icons` (SVG, sem emoji).
- **Telas redesenhadas (light+dark)**: **Login** (tile de marca, senha com toggle), **Dashboard** (vitrine bento — KPIs, próxima rodada, últimos campeões, top ranking, navegação por ícones), **Detalhe da rodada** (AppShell + tiles + prontidão em destaque + inscritos como lista mobile-friendly).
- `docs/DESIGN_SYSTEM.md` (novo) — fonte da verdade do rollout.
**Migration:** nenhuma. **Contratos/API:** inalterados (118 testes intactos).
**Pendências:** QA do visual (claro+escuro, mobile+desktop). Rollout do restante das telas ao novo estilo. (Hardening/Deploy da Fase 11 seguem pendentes.)

## [0.14.0] — 2026-07-04 — Fase 11 (fatia A): PWA + Polimento mobile-first + Guia do admin (para QA)
**Descrição:** Acabamento com foco em usabilidade mobile-first e onboarding de administradores. Sem migration; mudanças de web/estáticos.
**Adicionado:**
- **PWA**: `public/manifest.webmanifest`, service worker (`public/sw.js`, network-first + `public/offline.html`), ícones SVG (normal + maskable), registro via `ServiceWorkerRegister`; `layout.tsx` com `metadata.manifest/icons/appleWebApp` e `viewport` (themeColor `#0e7490`, device-width). App instalável e com shell offline.
- **Mobile-first**: inputs 16px (evita zoom iOS), `safe-area` no body, headers com `flex-wrap`, tabelas em `overflow-x-auto`.
- **Boundaries**: `loading.tsx`, `error.tsx`, `not-found.tsx` globais; favicon `app/icon.svg`.
- **Guia do administrador**: `/help` (passo a passo do fluxo + regras-chave); atalho "Como funciona" no dashboard.
**Migration:** nenhuma.
**Pendências:** QA do PO. Faltam Hardening da API (fatia B) e Deploy (fatia C) para encerrar a Fase 11.

## [0.13.1] — 2026-07-04 — Fase 10 aprovada + rótulo da fase final
**Descrição:** Fase Final validada no QA do PO. Refinamento incluído: a fase final é rotulada como **"Fase Final — {campeonato}"** (em vez de "Rodada N") em todas as telas, diferenciando-a das rodadas regulares.
**Adicionado:** helper `roundLabel` (contracts); `Round` expõe `championshipName`; dashboard expõe `kind` de próxima rodada/últimos resultados.
**Aprovado:** Fase 10 (Fase Final do campeonato). **Próxima:** Fase 11 (Polimento, PWA, hardening, deploy).

## [0.13.0] — 2026-07-03 — Fase 10: Fase Final do campeonato (para QA)
**Descrição:** Desfecho do campeonato — classifica os melhores por pontuação acumulada e disputa a fase final com novo sorteio ignorando o histórico de parceiros (BR-34). Sem migration (reusa `RoundKind.FINAL_PHASE`).
**Adicionado:**
- `@reb/contracts`: `finals.ts` (`FinalState`).
- API: `FinalsModule` — `POST /championships/:id/finals/generate` (classifica os `qualifiers_count` melhores jogadores por pontos e cria a rodada `FINAL_PHASE` com eles CONFIRMED) e `GET /championships/:id/finals` (estado + campeão). `DrawService` no modo final ignora histórico (allowRepeatPartners, peso de parceiro 0, sem deltas). `RankingService` passa a **excluir** rodadas `FINAL_PHASE` (ranking = temporada regular).
- Web: seção "Fase final" no detalhe do campeonato — "Gerar fase final" (quando ativo), link para a rodada final e selo do campeão quando encerrada. A rodada final reusa as telas de sorteio/resultados/mata-mata.
- Testes: `FinalStateSchema` — total 118 no monorepo.
**Migration:** nenhuma.
**Pendências:** QA do PO. Resta a Fase 11 (Polimento, PWA, hardening, deploy).

## [0.12.1] — 2026-07-03 — Fase 9 aprovada
**Descrição:** Quadras e Agenda validadas no QA do PO.
**Aprovado:** Fase 9 (Quadras e Agenda). **Próxima:** Fase 10 (Fase Final do campeonato).

## [0.12.0] — 2026-07-03 — Fase 9: Quadras e Agenda (para QA)
**Descrição:** Cadastro de quadras + vínculo de quadra/horário aos jogos (RF-29) e agenda com rodadas, finais, eventos e treinos (RF-30).
**Adicionado:**
- Prisma: enum `CalendarEventType`; models `Venue` e `CalendarEvent`; `Match.venueId` (FK→Venue, SetNull).
- `@reb/contracts`: `venue.ts` (`CreateVenue`/`UpdateVenue`/`Venue`, `AvailabilitySlot`, `ScheduleMatch`) e `calendar.ts` (`CalendarEventType`+rótulos, `CreateCalendarEvent`, `CalendarItem`, `CalendarQuery`); `MatchView`/`KnockoutMatchView` ganham `venueId`/`venueName`/`scheduledAt`.
- API: `VenuesModule` (CRUD), `CalendarModule` (`GET/POST/DELETE /calendar`), `PATCH /matches/:id/schedule`. Escopo por clube + RBAC.
- Web: telas de Quadras (lista/criar/editar/excluir) e Agenda (lista mensal com navegação, badges por tipo, criar/remover treino/evento); vínculo de quadra/horário por jogo na tela de resultados e no mata-mata; atalhos "Quadras" e "Agenda" no dashboard. Middleware passa a proteger `/rounds`, `/venues`, `/calendar`.
- Testes: 13 casos de schemas de quadra/agenda — total 115 no monorepo.
**Migration:** `venues_calendar` (Venue + CalendarEvent + Match.venueId) criada pelo QA no `pnpm db:migrate`.
**Pendências:** QA do PO. Restam Fase 10 (Fase Final do campeonato) e Fase 11 (Polimento/PWA/deploy).

## [0.11.1] — 2026-07-03 — Sprint 8 aprovada
**Descrição:** Estatísticas por jogador e dashboard validados no QA do PO.
**Aprovado:** Sprint 8 (Estatísticas e Dashboard). **Próxima:** Fase 9 (Quadras e Agenda).

## [0.11.0] — 2026-07-03 — Sprint 8: Estatísticas e Dashboard (para QA)
**Descrição:** Estatísticas por jogador (RF-27) e dashboard (RF-28), tudo derivado dos dados existentes. Sem migration. Gráficos em SVG inline (sem dependência), seguindo boas práticas de dataviz.
**Adicionado:**
- `@reb/contracts`: `stats.ts` — `PlayerStats`, `DashboardSummary` e helper puro `computeStreaks` (maiores sequências V/D).
- API: `StatsModule` — `GET /players/:id/stats` (pontos, aproveitamento, média, melhor/pior colocação, títulos, finais, sequências, parceiro favorito, adversário mais enfrentado; W.O. por lesão não penaliza — BR-32) e `GET /dashboard` (KPIs, próxima rodada, últimos resultados, top ranking). Reutiliza `RankingService`.
- Web: perfil do jogador com estatísticas reais (substitui o placeholder da Sprint 2); dashboard com KPIs, próxima rodada, últimos campeões e top do ranking (gráfico de barras); gráfico de linha da evolução na tela de ranking. Componentes `charts/BarChartH` e `charts/LineChart` (SVG/HTML, responsivos, acessíveis).
- Testes: 7 casos de `computeStreaks`/schemas — total 102 no monorepo.
**Migration:** nenhuma.
**Pendências:** QA do PO. Restam Quadras/Agenda (Fase 9), Fase Final do campeonato (Fase 10) e Polimento/PWA/deploy (Fase 11).

## [0.10.1] — 2026-07-03 — Sprint 7 aprovada
**Descrição:** Ranking por escopo (campeonato/temporada/geral), aproveitamento, desempates e evolução validados no QA do PO.
**Aprovado:** Sprint 7 (Classificação, Pontuação e Ranking). **Próxima:** Sprint 8 (Estatísticas e Dashboard).

## [0.10.0] — 2026-07-03 — Sprint 7: Classificação, Pontuação e Ranking (para QA)
**Descrição:** Ranking de jogadores por escopo (campeonato/temporada/geral) somando os pontos das rodadas, com aproveitamento, desempates (BR-31/32/33) e evolução por rodada. Sem migration — computado sob demanda.
**Adicionado:**
- `@reb/contracts`: `ranking.ts` — `RankingScope` + rótulos, `Ranking`/`RankingEntry`, `RankingEvolution`, e helpers puros `rankPlayers` (ordena por pontos → saldo → aproveitamento → nome) e `computeWinRate` (exclui W.O. por lesão na origem).
- API: `RankingModule` — `GET /championships/:id/ranking?scope=CHAMPIONSHIP|SEASON|GLOBAL` e `GET /championships/:id/ranking/evolution`. Agrega `RoundResult` (pontos) e `Match` (V/D, saldo; ignora derrota por W.O. de lesão — BR-32) por jogador via `TeamPlayer`.
- Web: tela `/championships/:id/ranking` com seletor de escopo, tabela (posição, pontos, jogos, V/D, saldo, aproveitamento) e **evolução** (acumulado por rodada); botão "Ranking" no detalhe do campeonato.
- Testes: 8 casos de `rankPlayers`/`computeWinRate`/schemas — total 95 no monorepo.
**Migration:** nenhuma.
**Pendências:** QA do PO. Estatísticas por jogador e dashboard com gráficos são a Sprint 8.

## [0.9.1] — 2026-07-03 — Sprint 6 aprovada (rodada completa)
**Descrição:** Fatia B (mata-mata + colocação + pontos) validada no QA do PO: fase final gerada pós-grupos e pontos lançados. Migration `knockout_placement` aplicada. Sprint 6 concluída.
**Aprovado:** Sprint 6 (Grupos, Jogos e Resultados). **Próxima:** Sprint 7 (Classificação, Pontuação e Ranking).

## [0.9.0] — 2026-07-03 — Sprint 6 (fatia B): Mata-mata da rodada + colocação + pontos (para QA)
**Descrição:** Fecha a rodada: mata-mata intra-rodada a partir dos classificados (FORMATS.md), disputa de 3º lugar, colocação final 1..D e pontos por colocação via `scoring_table` (BR-30). Conclui a Sprint 6.
**Adicionado:**
- Prisma: enum `MatchPhase`; `Match` ganha `phase`/`round_id`/`stage`/`slot` (`group_id` nullable); novo `RoundResult` (colocação + pontos).
- `@reb/contracts`: `knockout.ts` — helpers puros `selectQualifiers`, `firstRoundPairings`/`nextStagePairings`/`seedOrder`, `computeRoundPlacement`, `pointsForPlacement`, `stageCode`/`STAGE_LABELS`; views `KnockoutView`/`RoundResultView`.
- API: `KnockoutService` — `POST /rounds/:id/knockout/generate`, `GET /rounds/:id/knockout`, `GET /rounds/:id/result`; **geração progressiva** (uma fase por vez) e **finalização** (grava `RoundResult` + rodada `FINISHED`). `PATCH /matches/:id/result` passa a aceitar jogos de mata-mata e avança a chave. Erros `GROUP_STAGE_INCOMPLETE`/`KNOCKOUT_EXISTS`/`KNOCKOUT_NOT_READY`.
- Web: tela `/rounds/:id/knockout` — "Gerar mata-mata", chave por fase com lançamento de placar (reusa `MatchResultForm`) e **colocação final + pontos**; links "Resultados"/"Mata-mata" na rodada.
- Testes: 9 casos de classificados/chaveamento/colocação/pontos — total 87 no monorepo.
**Migration:** `knockout_placement` (Match + RoundResult) criada pelo QA no `pnpm db:migrate`.
**Pendências:** QA do PO. Ranking do campeonato (agregação por escopo, desempates, evolução) é a Sprint 7.

## [0.8.1] — 2026-07-03 — Correção: sorteio bloqueado após resultados
**Descrição:** Ajuste identificado no QA da fatia A. A tela de sorteio voltava a exibir o simulador quando a rodada estava `IN_PROGRESS` (após lançar resultados), permitindo re-simular.
**Corrigido:**
- Web: `/rounds/:id/draw` trata `DRAWN`/`IN_PROGRESS`/`FINISHED` como sorteio confirmado (somente leitura); botão "Descartar sorteio" só aparece enquanto `DRAWN` (sem resultados).
- API: `DELETE /rounds/:id/draw` bloqueia com `409 DRAW_HAS_RESULTS` se já houver jogos com resultado (evita apagar jogos/resultados e reverter histórico).
**Regra confirmada com o PO:** após o sorteio, as duplas estão confirmadas; não há alteração/refazer enquanto a rodada tem resultados.

## [0.8.0] — 2026-07-03 — Sprint 6 (fatia A): Jogos e Resultados — fase de grupos (para QA)
**Descrição:** Registro de resultados dos jogos de grupo, com vencedor derivado do placar (BR-25), W.O. (BR-27), classificação do grupo com desempates (BR-28/29) e auditoria de alterações.
**Adicionado:**
- Prisma: `Match` ganha `updated_at`/`updated_by`/`created_at`; novo `MatchResultLog` (auditoria antes/depois). Classificação computada em runtime.
- `@reb/contracts`: `match.ts` — `SetScoreSchema`, `RegisterMatchResultSchema` (sets **ou** W.O.), `MatchViewSchema`, `StandingSchema`/`GroupStandingsSchema`, e helpers puros `computeMatchWinner` (BR-25) e `computeGroupStandings` (BR-28/29).
- API: `MatchesModule` — `GET /rounds/:id/matches`, `GET /rounds/:id/standings`, `PATCH /matches/:id/result` (valida escopo/rodada, deriva vencedor, trata W.O., grava auditoria transacional; 1º resultado → rodada `IN_PROGRESS`). Erros `INVALID_SCORE`/`INVALID_WALKOVER`/`ROUND_NOT_DRAWN`.
- Web: tela `/rounds/:id/results` — classificação por grupo + lançamento de placar por jogo (sets conforme formato) e opção W.O. (com "por lesão"); botão "Resultados" na rodada e no sorteio confirmado.
- Testes: 15 casos de `computeMatchWinner`/`computeGroupStandings`/schema — total 78 no monorepo.
**Migration:** `match_results` (Match + MatchResultLog) criada pelo QA no `pnpm db:migrate`.
**Pendências:** QA do PO. Mata-mata intra-rodada + colocação final/pontos vêm na próxima fatia (ponte para a Sprint 7).

## [0.7.1] — 2026-07-03 — Sprint 5 aprovada (Motor de Sorteio completo)
**Descrição:** Fatia "confirmar sorteio" validada no QA do PO; sorteio confirmado e persistido com sucesso. Migration `draw_persistence` aplicada. Sprint 5 concluída (motor + simular + confirmar/persistência/histórico).
**Aprovado:** Sprint 5 (Motor de Sorteio). **Próxima:** Sprint 6 (Jogos e Resultados).

## [0.7.0] — 2026-07-03 — Sprint 5: Confirmar sorteio + persistência + histórico (para QA)
**Descrição:** Fecha o ciclo do Motor de Sorteio — gravar o sorteio escolhido e alimentar o histórico de parceiros/adversários, para que as próximas rodadas evitem repetições (BR-13/14/20).
**Adicionado:**
- Prisma: enum `MatchStatus`; models `Draw`, `Team`, `TeamPlayer`, `Group`, `GroupTeam`, `Match`, `PartnerHistory`, `OpponentHistory` (+ relações/índices). Ver DATABASE.md §3a.
- `@reb/contracts`: `ConfirmDrawSchema` (seed obrigatória), `ConfirmedDrawSchema`/`ConfirmedMatchSchema`, `MatchStatusSchema` + rótulos.
- API: `POST /rounds/:id/draw/confirm` (re-roda o motor com a seed exibida e **persiste** duplas/grupos/jogos numa transação; rodada → `DRAWN`; **incrementa** histórico), `GET /rounds/:id/draw` (sorteio confirmado), `DELETE /rounds/:id/draw` (descarta, **reverte** histórico, rodada → `OPEN`). `409 DRAW_EXISTS` bloqueia re-sorteio até descartar. `HistoryService` com loader e deltas transacionais; `simulate`/`confirm` passam a **carregar o histórico real**.
- Web: botão "Confirmar este sorteio" na simulação; tela de sorteio mostra o resultado gravado (com status dos jogos) + "Descartar sorteio"; na rodada, o botão vira "Ver sorteio" quando `DRAWN`.
- Testes: 7 casos puros de deltas de histórico (incremento/acúmulo/reversão simétrica/produto cruzado) — total 63 no monorepo.
**Migration:** `draw_persistence` (Draw/Team/TeamPlayer/Group/GroupTeam/Match + histórico) criada pelo QA no `pnpm db:migrate`.
**Pendências:** QA do PO. Registro de resultados dos jogos entra na Sprint 6. Ranking segue por proxy de `skillLevel` até a Sprint 7.

## [0.6.1] — 2026-07-03 — Sprint 5 (fatia motor + simular) aprovada
**Descrição:** Fatia "motor + simular" da Sprint 5 validada no QA do PO e aprovada. Sem migration.
**Aprovado:** motor de sorteio (`@reb/sort-engine`) + endpoint `simulate` + tela de simulação. **Próxima fatia:** confirmar sorteio + persistência + histórico.

## [0.6.0] — 2026-07-03 — Sprint 5: Motor de Sorteio — motor + simular (para QA)
**Descrição:** Coração do produto — o Motor Inteligente de Sorteio (pacote TS puro, determinístico) e a simulação de sorteio de uma rodada. Fatia 5a+5b+5c-simular; o "confirmar sorteio" (persistência) vem a seguir.
**Adicionado:**
- Pacote **`packages/sort-engine`** (`@reb/sort-engine`): PRNG semeável (mulberry32), emparelhamento greedy + 2-opt, agrupamento balanceado, round-robin, métricas, score de qualidade (0–100) e explicações — tudo determinístico via seed. 21 testes (8/16/32/64 jogadores, determinismo, invariantes, histórico saturado, randomness 0×100).
- `@reb/contracts`: `draw.ts` — `DrawConfig`, `SimulateDraw`, `DrawResult`/`DrawMetrics`, `SKILL_STRENGTH`, `pairKey`; `RoundFormatSchema` exportado.
- API: `DrawService` + **`POST /rounds/:id/draw/simulate`** (não persiste — BR-19). **Enforcement** `409 ODD_PLAYER_COUNT` / `422 PLAYER_COUNT_OUT_OF_RANGE` (BR-07/08/11) — prometido na Sprint 4, aterrissa aqui.
- Web: tela **`/rounds/:id/draw`** com score, métricas, duplas, grupos/confrontos e explicações; slider de aleatoriedade e botão "Regenerar"; botão "Simular sorteio" na rodada (habilitado só quando pronta).
**Migration:** nenhuma (sem mudança de schema nesta fatia).
**Pendências:** QA do PO. Ranking usa proxy por `skillLevel` até a Sprint 7. Histórico de parceiros/adversários é suportado pelo motor, porém vazio em runtime até a fatia de "confirmar".

## [0.5.1] — 2026-07-03 — Sprint 4 aprovada
**Descrição:** Sprint 4 (Rodadas e Inscrições) validada no QA do PO e aprovada. Migration `rounds_registrations` aplicada no banco (Neon).
**Aprovado:** Sprint 4 (Rodadas e Inscrições). **Próxima:** Sprint 5 (Motor de Sorteio).

## [0.5.0] — 2026-07-03 — Sprint 4: Rodadas e Inscrições (para QA)
**Descrição:** Criação/gestão de rodadas dentro do campeonato e fluxo de inscrições (presença, lista de espera manual, substituição), com a validação de prontidão que prepara o sorteio (Sprint 5).
**Adicionado:**
- Prisma: enums `RoundStatus` (SCHEDULED/OPEN/DRAWN/IN_PROGRESS/FINISHED), `RoundKind` (REGULAR/FINAL_PHASE), `RegistrationStatus` (CONFIRMED/PENDING/ABSENT/WAITLIST); models `Round` (nº único por campeonato, `match_format` JSONB, `group_size_pref`, `kind`) e `Registration` (única por rodada+jogador, `substituted_by`) + relações e índices.
- `@reb/contracts`: `round.ts` com schemas de rodada e inscrição, `MatchFormatSchema` (default 1 set — BR-26), rótulos pt-BR, e helpers puros `computeRoundReadiness` (par/8–64 — BR-07/08/11), `partitionGroups` e `describeRoundFormat` (prévia de formato espelhando FORMATS.md — BR-23).
- API: `RoundsModule` — `RoundsController` (listar/criar rodada sob o campeonato, detalhar, editar, abrir/fechar inscrições, inscrever) e `RegistrationsController` (mudar situação, substituir, remover); escopo por clube; RBAC (Admin/Organizador escrevem). Regras: jogador INACTIVE → 422 `PLAYER_INACTIVE` (BR-03), inscrição duplicada → 409 `REGISTRATION_EXISTS` (BR-09), numeração automática com unicidade.
- Web: seção "Rodadas" no detalhe do campeonato, tela de nova rodada (`RoundForm`) e detalhe da rodada com **banner de prontidão**, **prévia de formato**, resumo de inscrições e gestão de inscritos (confirmar/pendente/ausente/lista de espera, substituir, remover) via Server Actions.
- Testes (vitest): 18 casos de schemas/helpers de rodada (formato de partida, prontidão, partição de grupos, matriz de formato); roteiro de QA da Sprint 4 no TEST_PLAN.
**Migration:** tabelas `round` e `registration` (+ enums) criadas pelo QA no `pnpm db:migrate`.
**Pendências:** QA do PO. Transição `DRAWN` e enforcement de `ODD_PLAYER_COUNT`/`PLAYER_COUNT_OUT_OF_RANGE` ficam no endpoint de sorteio (Sprint 5); a prontidão já é calculada/exibida.

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
