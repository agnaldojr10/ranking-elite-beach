# DATABASE.md — Modelagem de Dados

> Fase 0. Modelo conceitual/lógico. Fonte da verdade será o `schema.prisma`; este doc nunca deve divergir dele.

---

## 1. Diagrama Entidade-Relacionamento (conceitual)

```mermaid
erDiagram
    CLUB ||--o{ PLAYER : has
    CLUB ||--o{ SEASON : has
    CLUB ||--o{ VENUE : has
    CLUB ||--o{ USER : has
    SEASON ||--o{ CHAMPIONSHIP : contains
    CHAMPIONSHIP ||--o{ ROUND : has
    CHAMPIONSHIP ||--|| CHAMPIONSHIP_CONFIG : configures
    ROUND ||--o{ REGISTRATION : lists
    PLAYER ||--o{ REGISTRATION : enrolls
    ROUND ||--o{ TEAM : forms
    PLAYER ||--o{ TEAM_PLAYER : plays_in
    TEAM ||--o{ TEAM_PLAYER : includes
    ROUND ||--o{ GROUP : splits
    GROUP ||--o{ GROUP_TEAM : contains
    TEAM ||--o{ GROUP_TEAM : placed
    GROUP ||--o{ MATCH : schedules
    TEAM ||--o{ MATCH : "A/B"
    VENUE ||--o{ MATCH : hosts
    ROUND ||--o{ DRAW : produces
    CHAMPIONSHIP ||--o{ RANKING_ENTRY : ranks
    PLAYER ||--o{ RANKING_ENTRY : scored
    PLAYER ||--o{ PARTNER_HISTORY : partners
    PLAYER ||--o{ OPPONENT_HISTORY : faces
```

## 2. Entidades

### CLUB (tenant)
Raiz de tenancy. MVP: um único registro semeado.
| Campo | Tipo | Regras |
|---|---|---|
| id | UUID PK | |
| name | text | obrigatório |
| created_at | timestamptz | default now |

### USER
| Campo | Tipo | Regras |
|---|---|---|
| id | UUID PK | |
| club_id | UUID FK→CLUB | |
| email | citext unique | |
| password_hash | text | Argon2 |
| role | enum(ADMIN, ORGANIZER, PLAYER, VIEWER) | |
| player_id | UUID FK→PLAYER null | vincula login a jogador |

### PLAYER
| Campo | Tipo | Regras |
|---|---|---|
| id | UUID PK | |
| club_id | UUID FK | |
| name | text | obrigatório |
| photo_url | text null | |
| birth_date | date | idade calculada em runtime |
| phone | text null | opcional |
| skill_level | enum(BEGINNER, INTERMEDIATE, ADVANCED, PRO) | |
| status | enum(ACTIVE, INACTIVE) | soft delete |
| created_at | timestamptz | data de cadastro |

### SEASON
| id UUID PK · club_id FK · year int · name text · status enum(OPEN, CLOSED) |

### CHAMPIONSHIP
| id UUID PK · season_id FK · name text · rounds_count int · qualifiers_count int · status enum(DRAFT, ACTIVE, FINISHED) · start_date · created_at |

### CHAMPIONSHIP_CONFIG (JSONB parametrizável)
| Campo | Tipo | Descrição |
|---|---|---|
| championship_id | UUID FK (1:1) | |
| scoring_table | jsonb | pontos por colocação (ex.: `{"1":100,"2":70,...}`) |
| tiebreakers | jsonb | ordem de critérios de desempate |
| draw_weights | jsonb | pesos ranking/nível/parceiros/adversários |
| randomness | int | 0–100 |
| allow_repeat_partners | bool | |
| allow_repeat_opponents | bool | |
| final_config | jsonb | nº classificados, formato da final |

### ROUND
| id UUID PK · championship_id FK · number int · date · status enum(SCHEDULED, OPEN, DRAWN, IN_PROGRESS, FINISHED) |

### REGISTRATION
| id UUID PK · round_id FK · player_id FK · status enum(CONFIRMED, PENDING, ABSENT, WAITLIST) · created_at |
- Unique (round_id, player_id).

### DRAW
Snapshot de um sorteio confirmado (auditável).
| id UUID PK · round_id FK · seed text · config_snapshot jsonb · quality_score numeric · explanation jsonb · created_by FK→USER · created_at |

### TEAM (dupla)
| id UUID PK · round_id FK · draw_id FK · label text |

### TEAM_PLAYER
| team_id FK · player_id FK | (PK composta) — exatamente 2 por team.

### GROUP
| id UUID PK · round_id FK · name text |

### GROUP_TEAM
| group_id FK · team_id FK · seed int |

### MATCH (jogo)
| Campo | Tipo | Regras |
|---|---|---|
| id | UUID PK | |
| group_id | UUID FK | |
| team_a_id / team_b_id | UUID FK→TEAM | |
| venue_id | UUID FK→VENUE null | |
| scheduled_at | timestamptz null | |
| sets | jsonb | ex.: `[{"a":6,"b":4},{"a":6,"b":2}]` |
| winner_team_id | UUID null | calculado/validado |
| status | enum(PENDING, PLAYED, WALKOVER) | |

### STANDING (classificação do grupo — pode ser materializada)
| group_id FK · team_id FK · wins int · losses int · sets_balance int · games_balance int · position int |

### RANKING_ENTRY
| id · championship_id FK (ou season/global scope) · player_id FK · points int · position int · rounds int · wins int · losses int · win_rate numeric · scope enum(CHAMPIONSHIP, SEASON, GLOBAL) |

### PARTNER_HISTORY
| club_id · player_a_id · player_b_id · times_together int · last_round_id | (par não ordenado, normalizado a<b).

### OPPONENT_HISTORY
| club_id · player_a_id · player_b_id · times_faced int · last_round_id |

### VENUE (quadra)
| id · club_id · name · number · location · availability jsonb |

### CALENDAR_EVENT (agenda)
| id · club_id · type enum(ROUND, FINAL, EVENT, TRAINING) · title · date · ref_id null |

### AUDIT_LOG
| id · user_id · entity · entity_id · action · before jsonb · after jsonb · created_at |

## 3. Índices recomendados
- `player(club_id, status)`, `player(name)` (busca).
- `registration(round_id, status)`.
- `match(group_id, status)`.
- `ranking_entry(scope, championship_id, points DESC)`.
- `partner_history(club_id, player_a_id, player_b_id)` unique.
- `opponent_history(club_id, player_a_id, player_b_id)` unique.

## 3a. Implementado

- **Sprint 1:** `Club`, `User` (enum `Role`).
- **Sprint 2:** `Player` (enums `SkillLevel` = BEGINNER/INTERMEDIATE/ADVANCED/PRO e `PlayerStatus` = ACTIVE/INACTIVE). Colunas: `club_id`, `name`, `photo_url` (nullable), `birth_date` (date; idade derivada — BR-01), `phone` (nullable), `skill_level`, `status`, `created_at`, `updated_at`. Índices: `(club_id, status)` e `(club_id, name)`. Sem exclusão física (soft delete via `status=INACTIVE` — BR-02).
- **Sprint 3:** `Season` (enum `SeasonStatus` = OPEN/CLOSED; `year` único por clube) e `Championship` (enum `ChampionshipStatus` = DRAFT/ACTIVE/FINISHED; `rounds_count`, `qualifiers_count`, `start_date`). `ChampionshipConfig` (1:1) com JSONB: `scoring_table`, `tiebreakers`, `draw_weights`, `final_config` + `randomness` (int), `allow_repeat_partners`, `allow_repeat_opponents`. Lock estrutural (scoring/tiebreakers/final/rounds/qualifiers) fora de DRAFT — BR-05.
- **Fase 9 (quadras/agenda):** enum `CalendarEventType` (ROUND/FINAL/EVENT/TRAINING); `Venue` (`clubId`, `name`, `number?`, `location?`, `availability` JSONB) e `CalendarEvent` (`clubId`, `type`, `title`, `date`, `refId?`). `Match.venueId` (FK→Venue, `SetNull` ao excluir a quadra). Agenda = rodadas/finais derivadas de `Round.date` + eventos manuais (EVENT/TRAINING) da `CalendarEvent`.
- **Sprint 7 (ranking):** sem novas tabelas — o ranking por escopo (campeonato/temporada/geral) é **computado em runtime** a partir de `RoundResult` (pontos) e `Match` (V/D, saldo, `walkover_injury`), agregando por jogador via `TeamPlayer`. `RANKING_ENTRY` (materialização) permanece opcional/futuro.
- **Sprint 6 (fatia B — mata-mata):** enum `MatchPhase` = GROUP/KNOCKOUT. `Match` ganha `phase` (default GROUP), `round_id` (FK→Round, usado no mata-mata), `stage` (`F/SF/QF/R16/3P`), `slot`; `group_id` passa a **nullable** (jogos de mata-mata não têm grupo). Novo `RoundResult` (BR-30): `round_id`, `team_id`, `final_position`, `points_awarded`, unique `(round_id, team_id)`. Geração progressiva do chaveamento (uma fase por vez); ao encerrar final + 3º lugar, grava colocação 1..D + pontos (via `scoring_table`) e rodada → `FINISHED`.
- **Sprint 6 (fatia A — resultados):** `Match` ganha `updated_at`, `updated_by` (FK→User, "último a alterar"), `created_at`. Novo `MatchResultLog` (auditoria de resultado — `match_id`, `changed_by` FK→User, `before`/`after` JSONB, `created_at`; índice por `match_id`). Classificação do grupo é **computada em runtime** a partir dos `Match` (sem tabela `Standing` — materialização fica como otimização futura). Registro de resultado grava `sets`/`winner_team_id`/`status`/W.O. transacionalmente + linha de auditoria; 1º resultado leva a rodada para `IN_PROGRESS`.
- **Sprint 5 (persistência do sorteio):** enum `MatchStatus` = PENDING/PLAYED/WALKOVER. `Draw` (1:1 com Round via `round_id` único; `seed`, `config_snapshot` JSONB, `quality_score`, `metrics` JSONB, `explanations` JSONB, `created_by` FK→User — BR-20). `Team` (`round_id`, `draw_id`, `label`, `strength`) + `TeamPlayer` (PK `team_id,player_id`; 2 por dupla). `Group` (`round_id`, `draw_id`, `name`) + `GroupTeam` (PK `group_id,team_id`, `seed`). `Match` (`group_id`, `team_a_id`, `team_b_id`, `scheduled_at?`, `sets?`, `winner_team_id?`, `status`, `is_walkover`, `walkover_injury` — colunas de resultado prontas p/ Sprint 6; venue p/ Sprint 9). `PartnerHistory`/`OpponentHistory` (`club_id`, par normalizado `player_a_id<player_b_id`, `times_together`/`times_faced`, `last_round_id`; unique por `(club_id, a, b)`). Confirmar sorteio grava tudo transacionalmente e incrementa o histórico; descartar apaga (cascade a partir de `Draw`) e reverte o histórico.
- **Sprint 4:** `Round` (enums `RoundStatus` = SCHEDULED/OPEN/DRAWN/IN_PROGRESS/FINISHED e `RoundKind` = REGULAR/FINAL_PHASE). Colunas: `championship_id`, `number`, `date` (nullable), `status`, `kind`, `match_format` (JSONB — `{sets,gamesPerSet,tieBreakAt,matchTieBreak,walkoverGames}`, default 1 set — BR-26), `group_size_pref` (default 3 — BR-23), `created_at`/`updated_at`. Único `(championship_id, number)`; índice `(championship_id)`. `Registration` (enum `RegistrationStatus` = CONFIRMED/PENDING/ABSENT/WAITLIST). Colunas: `round_id`, `player_id`, `status`, `substituted_by` (FK→Player nullable — BR-10/BR-27), `created_at`/`updated_at`. Único `(round_id, player_id)`; índice `(round_id, status)`. *Nesta sprint o ciclo usa SCHEDULED/OPEN; DRAWN+ entram com o sorteio (Sprint 5).*

## 3b. Ajustes de modelagem (regras resolvidas 2026-07-02)

- **CHAMPIONSHIP.status** e lock de config: ao virar `ACTIVE`, campos estruturais (`scoring_table`, `tiebreakers`, `rounds_count`, `qualifiers_count`, `final_config`) tornam-se imutáveis (BR-05). `draw_weights`/`randomness` podem ser sobrescritos por rodada (ver `DRAW.config_snapshot`).
- **ROUND.match_format** (jsonb): formato de partida da rodada — `{"sets":1,"gamesPerSet":6,"tieBreakAt":6,"matchTieBreak":false}` (default 1 set — BR-26).
- **ROUND.kind** enum(`REGULAR`, `FINAL_PHASE`): distingue rodadas regulares da fase final; na `FINAL_PHASE` o sorteio ignora histórico de parceiros (BR-34).
- **ROUND.group_size_pref** int default 3 (BR-23 / FORMATS.md).
- **MATCH.is_walkover** bool + **MATCH.walkover_injury** bool: W.O.; se `walkover_injury=true`, os games não penalizam o aproveitamento do jogador lesionado (BR-27). Placar padrão do W.O. = **6/0** (em `ROUND.match_format`).
- **REGISTRATION.substituted_by** UUID FK→PLAYER null: registra substituição (lesão/desistência) — promoção manual da lista de espera (BR-10).
- **ROUND_RESULT** (nova, por dupla): `round_id`, `team_id`, `final_position` int, `points_awarded` int — colocação final na rodada (grupos+mata-mata) e pontos atribuídos (BR-30). Alimenta `RANKING_ENTRY`.

## 4. Regras de integridade
- TEAM sempre com exatamente 2 jogadores.
- REGISTRATION única por (round, player).
- Histórico (partner/opponent) atualizado transacionalmente ao confirmar sorteio e ao registrar resultado.
- Nenhuma exclusão física de jogadores/histórico (soft delete + auditoria).
