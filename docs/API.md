# API.md — Contrato da API

> Fase 0. Estrutura REST (base). OpenAPI/Swagger será gerado na implementação.
> Base URL: `/api/v1` · Auth: `Authorization: Bearer <access_token>` · Formato: JSON.

---

## 1. Convenções
- Verbos REST; recursos no plural.
- Erros padronizados: `{ "error": { "code": "STRING", "message": "...", "details": [] } }`.
- Paginação: `?page=1&pageSize=20` → `{ data, page, pageSize, total }`.
- Códigos: 200/201 ok, 400 validação, 401 não autenticado, 403 sem permissão, 404 inexistente, 409 conflito de regra, 422 regra de negócio.

## 2. Autenticação
| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | `{email,password}` → `{accessToken, refreshToken}` |
| POST | `/auth/refresh` | renova access token |
| POST | `/auth/logout` | invalida refresh |
| GET | `/auth/me` | usuário atual + papel |

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

## 5. Rodadas e Inscrições
| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/championships/:id/rounds` | lista/cria rodada |
| GET | `/rounds/:id` | detalhe (inscritos, status) |
| POST | `/rounds/:id/registrations` | inscreve jogador |
| PATCH | `/registrations/:id` | muda status (confirm/absent/waitlist) |

## 6. Sorteio
| Método | Rota | Descrição |
|---|---|---|
| POST | `/rounds/:id/draw/simulate` | body: `DrawConfig` → retorna `DrawResult` (não persiste) |
| POST | `/rounds/:id/draw/confirm` | body: `{seed, config}` → persiste duplas/grupos/jogos |
| GET | `/rounds/:id/draw` | retorna sorteio confirmado + score + explicações |

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
| Método | Rota | Descrição |
|---|---|---|
| GET | `/rounds/:id/matches` | jogos da rodada |
| PATCH | `/matches/:id/result` | lança sets/games; recalcula classificação |
| GET | `/groups/:id/standings` | classificação do grupo |
| GET | `/championships/:id/ranking?scope=CHAMPIONSHIP\|SEASON\|GLOBAL` | ranking |
| GET | `/players/:id/stats` | estatísticas do jogador |

## 8. Quadras e Agenda
| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/venues` | quadras |
| GET | `/calendar?from=&to=` | eventos/rodadas/finais/treinos |

## 9. Fase final
| Método | Rota | Descrição |
|---|---|---|
| POST | `/championships/:id/finals/generate` | gera classificados + chaveamento |
| GET | `/championships/:id/finals` | estado da final |

## 10. Erros de negócio (exemplos)
- `409 ODD_PLAYER_COUNT` — sorteio bloqueado por nº ímpar (BR-08).
- `422 PLAYER_COUNT_OUT_OF_RANGE` — fora de [8,64] (BR-07).
- `409 CONFIG_LOCKED` — tentativa de editar config de campeonato ACTIVE (BR-05).
