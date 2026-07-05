# ROADMAP.md — Plano de Desenvolvimento

> Desenvolvimento incremental. Nenhuma fase inicia sem aprovação da anterior (QA do PO).
> Legenda: ✔ Concluído · ▶ Em andamento · ⏳ Pendente · ⛔ Bloqueado

---

## Visão de fases

| Fase | Módulo | Status | Depende de |
|---|---|---|---|
| 0 | Planejamento (este pacote) | ✔ Concluído e aprovado | — |
| 1 | Fundação (monorepo, auth, RBAC, CI) | ✔ Concluído e aprovado | Fase 0 |
| 2 | Jogadores (CRUD + perfil) | ✔ Concluído e aprovado | Fase 1 |
| 3 | Temporadas e Campeonatos (+ config) | ✔ Concluído e aprovado | Fase 2 |
| 4 | Rodadas e Inscrições | ✔ Concluído e aprovado | Fase 3 |
| 5 | **Motor de Sorteio** (simulação + score + explicação) | ✔ Concluído e aprovado | Fase 4 |
| 6 | Grupos, Jogos e Resultados | ✔ Concluído e aprovado | Fase 5 |
| 7 | Classificação, Pontuação e Ranking | ✔ Concluído e aprovado | Fase 6 |
| 8 | Estatísticas e Dashboard | ✔ Concluído e aprovado | Fase 7 |
| 9 | Quadras e Agenda | ✔ Concluído e aprovado | Fase 6 |
| 10 | Fase Final (chaveamento) | ✔ Concluído e aprovado | Fase 7 |
| 11 | Polimento, PWA, hardening, deploy | ✔ Concluído e aprovado — PWA + redesign UI + hardening + deploy (Docker/Neon + CI) | Fases 1–10 |
| 12 | **Portal do jogador** (app imersivo do atleta) | ▶ Em andamento — fatias 1 e 2 ✔ aprovadas; fatia 3 (Push/PWA) p/ QA → encerra o épico | Fase 11 |

## Ordem recomendada de implementação
Fundação → dados de base (jogadores/campeonatos/rodadas) → **sorteio** → jogos/resultados → ranking/stats → periféricos (quadras/agenda/final) → polimento. O sorteio vem cedo (Fase 5) por ser o maior risco/diferencial, mas depende de ter jogadores e rodadas para operar.

## Detalhe por sprint (sugestão, ~1–2 semanas cada)

**Sprint 1 — Fundação**
- Monorepo (pnpm+turbo), apps `web`/`api`, `packages/contracts`.
- Prisma + Postgres, migration inicial (Club seed, User).
- Auth JWT + refresh + RBAC; tela de login; guard de rotas.
- CI (lint, test, build). Documentação inicial de execução.

**Sprint 2 — Jogadores**
- CRUD jogador + upload de foto; cálculo de idade; soft delete.
- Lista com busca/filtro; perfil básico.

**Sprint 3 — Campeonatos**
- Temporadas; campeonato + `CHAMPIONSHIP_CONFIG` (JSONB); UI de configuração (pontuação, desempate, pesos, aleatoriedade).

**Sprint 4 — Rodadas/Inscrições**
- Rodadas; inscrições e status; validação par/8–64; lista de espera.

**Sprint 5 — Motor de Sorteio** *(fatiado)*
- 5a: `packages/sort-engine` — emparelhamento greedy + testes determinísticos.
- 5b: agrupamento + round-robin + métricas + score.
- 5c: explicabilidade + endpoint simulate/confirm + tela de simulação.

**Sprint 6 — Jogos/Resultados**
- Registro de sets/games; validação de vencedor; auditoria; standings do grupo.

**Sprint 7 — Ranking/Pontuação**
- scoring_table aplicada; ranking por escopo; desempates; evolução.

**Sprint 8 — Estatísticas/Dashboard**
- Stats por jogador; dashboard com KPIs e gráficos.

**Sprint 9 — Quadras/Agenda** · **Sprint 10 — Fase Final** · **Sprint 11 — Polimento/Deploy**

## Checklist obrigatório por entrega
Cada fase só é "concluída" após: ✔ código ✔ revisão ✔ docs atualizadas ✔ casos de teste ✔ CHANGELOG ✔ ROADMAP ✔ RELEASE_NOTES ✔ próximos passos → **e aprovação do PO**.
