# API.md — Contrato da API

> Fase 0. Estrutura REST (base). OpenAPI/Swagger será gerado na implementação.
> Base URL: `/api/v1` · Auth: `Authorization: Bearer <access_token>` · Formato: JSON.

---

## 1. Convenções
- Verbos REST; recursos no plural.
- Erros padronizados: `{ "error": { "code": "STRING", "message": "...", "details": [] } }`. Garantido pelo **filtro global** (`AllExceptionsFilter`) em **todas** as respostas — inclusive 401/404/429 padrão do Nest; erros inesperados viram `500 INTERNAL_ERROR` (mensagem genérica, sem stack).
- Paginação: `?page=1&pageSize=20` → `{ data, page, pageSize, total }`.
- Códigos: 200/201 ok, 400 validação, 401 não autenticado, 403 sem permissão, 404 inexistente, 409 conflito de regra, 422 regra de negócio, **429 rate-limit** (`RATE_LIMITED`).

### 1.1 Segurança (Fase 11 — hardening)
- **CORS** restrito a `WEB_ORIGIN` (com `credentials`).
- **Helmet**: cabeçalhos de segurança (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security`, `X-DNS-Prefetch-Control: off`, …). CSP desligado (Swagger em `/api/docs`); `Cross-Origin-Resource-Policy: cross-origin`. `trust proxy = 1` (IP real atrás de proxy).
- **Rate-limit** (por IP): global `THROTTLE_LIMIT`/`THROTTLE_TTL` (default 120 req/60s); estrito em `/auth/login` e `/auth/refresh` `AUTH_THROTTLE_LIMIT` (default 10 req/60s); `/health` isento. Estouro → `429 { error: { code: "RATE_LIMITED" } }`.

## 2. Autenticação
| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | `{email,password}` → `{accessToken, refreshToken, user}` |
| POST | `/auth/claim` | `{code,email,password}` → ativa a conta do atleta via convite (cria login PLAYER) e retorna tokens |
| POST | `/auth/refresh` | renova access token |
| GET | `/auth/me` | usuário atual + papel (`user.playerId` quando for atleta) |

## 2.1 Portal do Jogador (Fase 12)
Fluxo por **convite**: a organização gera um código para um `Player`; o atleta o usa em `/auth/claim`. O JWT passa a carregar `playerId`; os endpoints `/me/*` são escopados ao próprio atleta e exigem papel **PLAYER**.

| Método | Rota | Papel | Descrição |
|---|---|---|---|
| POST | `/players/:id/invite` | ADMIN/ORGANIZER | gera convite; retorna `{code, expiresAt}` (código em claro só aqui) |
| GET | `/me/profile` | PLAYER | dados do próprio atleta |
| GET | `/me/stats` | PLAYER | números completos (V/D, títulos, sequências, parceiro favorito…) |
| GET | `/me/ranking` | PLAYER | posição no campeonato ativo + variação (▲▼) |
| GET | `/me/matches` | PLAYER | todos os jogos do atleta (do ponto de vista dele) |
| GET | `/me/next-match` | PLAYER | próximo jogo (agendado mais próximo) |
| GET | `/me/tournaments` | PLAYER | campeonatos que participo (colocação, pontos, campeão) |
| GET | `/me/tournaments/:championshipId` | PLAYER | detalhe: minhas rodadas (meu grupo+classificação, minha chave, colocação) — `404 TOURNAMENT_NOT_FOUND` se não participo |
| GET | `/me/opponents` | PLAYER | adversários que já enfrentei (por nº de confrontos) |
| GET | `/me/h2h/:opponentId` | PLAYER | retrospecto direto (V/D + últimos jogos) |
| GET | `/me/achievements` | PLAYER | conquistas derivadas dos meus números |

Erros do convite: `INVALID_INVITE` (404/401), `INVITE_USED` (409), `INVITE_EXPIRED` (409), `EMAIL_EXISTS` (409), `PLAYER_ALREADY_CLAIMED` (409). As leituras de backoffice (`/players/:id/stats`, `/championships/:id/ranking`, `/rounds/*`, etc.) são **fechadas ao papel PLAYER** — o atleta usa apenas `/me/*`.

## 3. Jogadores
| Método | Rota | Papel | Descrição |
|---|---|---|---|
| GET | `/players` | Viewer+ | lista/filtra (`?status=&level=&q=`) |
| GET | `/players/:id` | Viewer+ | perfil + stats |
| POST | `/players` | Organizer+ | cria |
| PATCH | `/players/:id` | Organizer+ | edita |
| PATCH | `/players/:id/status` | Organizer+ | ativa/inativa |

## 4. Temporadas e Campeonatos
| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/seasons` | lista/cria temporada |
| GET/POST | `/championships` | lista/cria campeonato (com config) |
| GET | `/championships/:id` | detalhe + config |
| PATCH | `/championships/:id/config` | edita config (só DRAFT — BR-05) |

## 5. Rodadas e Inscrições ✅ (Sprint 4)
| Método | Rota | Papel | Descrição |
|---|---|---|---|
| GET | `/championships/:championshipId/rounds` | Viewer+ | lista rodadas (com resumo + prontidão) |
| POST | `/championships/:championshipId/rounds` | Organizer+ | cria rodada (numeração automática se omitida) |
| GET | `/rounds/:id` | Viewer+ | detalhe (inscritos, resumo, prontidão) |
| PATCH | `/rounds/:id` | Organizer+ | edita dados (número/data/grupo/formato) |
| PATCH | `/rounds/:id/status` | Organizer+ | abre/fecha inscrições (SCHEDULED↔OPEN) |
| POST | `/rounds/:id/registrations` | Organizer+ | inscreve jogador |
| PATCH | `/registrations/:id` | Organizer+ | muda situação / substitui (`substitutedById`) |
| DELETE | `/registrations/:id` | Organizer+ | remove inscrição |

Erros de negócio desta seção: `422 PLAYER_INACTIVE` (BR-03), `409 REGISTRATION_EXISTS` (BR-09), `409 ROUND_NUMBER_EXISTS`, `409 INVALID_STATUS_TRANSITION`, `409 INVALID_SUBSTITUTE`. A prontidão (`readiness`) exposta no detalhe/lista antecipa `ODD_PLAYER_COUNT`/`PLAYER_COUNT_OUT_OF_RANGE`, cujo enforcement ocorre no sorteio (§6, Sprint 5).

## 6. Sorteio
| Método | Rota | Papel | Descrição |
|---|---|---|---|
| POST | `/rounds/:id/draw/simulate` ✅ | Organizer+ | body: overrides de `SimulateDraw` (weights/randomness/allow*/groupSizePreference/seed, todos opcionais) → retorna `DrawResult` (**não persiste** — BR-19) |
| POST | `/rounds/:id/draw/confirm` ✅ | Organizer+ | body: `ConfirmDraw` (`seed` obrigatório + overrides) → persiste duplas/grupos/jogos + histórico; rodada vira `DRAWN` |
| GET | `/rounds/:id/draw` ✅ | Viewer+ | retorna `ConfirmedDraw` (duplas/grupos/jogos + score + métricas + explicações) |
| DELETE | `/rounds/:id/draw` ✅ | Organizer+ | descarta o sorteio, reverte o histórico e reabre a rodada (`OPEN`) |

`simulate` e `confirm` aplicam o **enforcement de prontidão**: `409 ODD_PLAYER_COUNT` (ímpar) e `422 PLAYER_COUNT_OUT_OF_RANGE` (fora de [8,64]) — BR-07/08/11. `confirm` retorna `409 DRAW_EXISTS` se a rodada já tem sorteio; `GET`/`DELETE` retornam `404 DRAW_NOT_FOUND` se não há. Sem seed no `simulate`, a API gera uma nova a cada chamada (regenerar). Ambos carregam o histórico real de parceiros/adversários do clube.

**Exemplo — simulate (request):**
```json
{ "weights": {"ranking":0.4,"skill":0.2,"partner":0.3,"opponent":0.1},
  "randomness": 60, "allowRepeatPartners": false,
  "allowRepeatOpponents": true, "groupSizePreference": 3 }
```
**Response (resumo):**
```json
{ "seed":"a1b2c3", "qualityScore":96,
  "teams":[{"id":"t1","players":["p1","p2"]}],
  "groups":[{"name":"A","teams":["t1","t2","t3"]}],
  "matches":[{"groupId":"A","teamA":"t1","teamB":"t2"}],
  "metrics":{"repeatedPartners":0,"repeatedOpponents":2,"partnerDiversity":100,"avgRankingDiff":140,"groupBalance":0.12},
  "explanations":["Pedro foi pareado com Lucas para equilibrar o ranking (300 + 120)."] }
```

## 7. Jogos, Classificação, Ranking, Stats
| Método | Rota | Papel | Descrição |
|---|---|---|---|
| GET | `/rounds/:id/matches` ✅ | Viewer+ | jogos da rodada (duplas resolvidas, placar, status) |
| GET | `/rounds/:id/standings` ✅ | Viewer+ | classificação por grupo (BR-28/29) |
| PATCH | `/matches/:id/result` ✅ | Organizer+ | lança/corrige placar (grupo **ou** mata-mata); vencedor derivado; avança a chave; grava auditoria |
| POST | `/rounds/:id/knockout/generate` ✅ | Organizer+ | gera o mata-mata a partir dos classificados (após a fase de grupos) |
| GET | `/rounds/:id/knockout` ✅ | Viewer+ | chave (fases + jogos) |
| GET | `/rounds/:id/result` ✅ | Viewer+ | colocação final 1..D + pontos (quando `FINISHED`) |
| GET | `/championships/:id/ranking?scope=CHAMPIONSHIP\|SEASON\|GLOBAL` ✅ | Viewer+ | ranking de jogadores por escopo (computado sob demanda) |
| GET | `/championships/:id/ranking/evolution` ✅ | Viewer+ | pontos acumulados por rodada (evolução, escopo campeonato) |
| GET | `/players/:id/stats` ✅ | Viewer+ | estatísticas do jogador (RF-27, computado sob demanda) |
| GET | `/dashboard` ✅ | Viewer+ | KPIs, próxima rodada, últimos resultados, top ranking (RF-28) |

Resultado (§7): o **vencedor é derivado do placar** (BR-25) — não é informado manualmente. Erros: `404 MATCH_NOT_FOUND`, `422 INVALID_SCORE`, `409 INVALID_WALKOVER`, `409 ROUND_NOT_DRAWN`. W.O. grava placar padrão `walkoverGames/0` (BR-27); `injury=true` marca `walkover_injury`. Cada alteração registra `MatchResultLog` (antes/depois). Mata-mata: `generate` exige a fase de grupos concluída (`409 GROUP_STAGE_INCOMPLETE`) e chave inexistente (`409 KNOCKOUT_EXISTS`); resultados do mata-mata avançam a chave progressivamente e, ao fim (final + 3º lugar), a rodada é **encerrada** com colocação 1..D e pontos (`scoring_table`, BR-30) em `RoundResult`. A agregação em ranking do campeonato é a Sprint 7.

## 8. Quadras e Agenda ✅ (Fase 9)
| Método | Rota | Papel | Descrição |
|---|---|---|---|
| GET | `/venues` · `GET /venues/:id` | Viewer+ | lista/detalha quadras |
| POST | `/venues` · `PATCH /venues/:id` · `DELETE /venues/:id` | Organizer+ | cria/edita/exclui (exclusão desvincula jogos) |
| PATCH | `/matches/:id/schedule` | Organizer+ | vincula quadra/horário ao jogo (`{venueId?, scheduledAt?}`; null desvincula) |
| GET | `/calendar?from=&to=` | Viewer+ | itens da agenda (rodadas/finais derivadas + eventos/treinos manuais) |
| POST | `/calendar` · `DELETE /calendar/:id` | Organizer+ | cria/remove evento manual (EVENT/TRAINING) |

## 9. Fase final ✅ (Fase 10)
| Método | Rota | Papel | Descrição |
|---|---|---|---|
| POST | `/championships/:id/finals/generate` | Organizer+ | classifica os `qualifiers_count` melhores jogadores por pontos e cria a rodada `FINAL_PHASE` (com eles CONFIRMED) |
| GET | `/championships/:id/finals` | Viewer+ | estado da final (rodada + campeão quando `FINISHED`) |

A fase final é uma **rodada `FINAL_PHASE`**: reusa simular/confirmar/resultados/mata-mata. No modo final o sorteio **ignora o histórico de parceiros** (`allowRepeatPartners=true`, peso de parceiro 0 — BR-34) e **não** alimenta `PartnerHistory`/`OpponentHistory`. O **ranking do campeonato exclui** rodadas `FINAL_PHASE`. Erros: `409 FINAL_EXISTS`, `409 CHAMPIONSHIP_NOT_ACTIVE`, `422 NO_RANKING`.

## 10. Erros de negócio (exemplos)
- `409 ODD_PLAYER_COUNT` — sorteio bloqueado por nº ímpar (BR-08).
- `422 PLAYER_COUNT_OUT_OF_RANGE` — fora de [8,64] (BR-07).
- `409 CONFIG_LOCKED` — tentativa de editar config de campeonato ACTIVE (BR-05).
