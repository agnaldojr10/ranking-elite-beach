# MEETING_NOTES.md — Memória do Projeto

> Registro ao final de cada interação: data, resumo, decisões, aprovados, pendentes, próximas tarefas.

---

## 2026-07-03 — Sprint 3 aprovada + migração para VS Code

**Resumo:** QA da Sprint 3 concluído e **aprovado** pelo PO (temporadas, campeonatos e config funcionando). Projeto versionado no GitHub (repo privado `agnaldojr10/ranking-elite-beach`). PO segue o desenvolvimento no VS Code.

**Ajuste técnico:** criados scripts `pnpm dev:api` e `pnpm dev:web` (reconstroem `@reb/contracts` antes de subir) para evitar o erro de exports desatualizados ao rodar serviços isoladamente.

**Aprovado:** Sprint 3.

**Próxima tarefa:** Sprint 4 — Rodadas e Inscrições (lista de inscritos, presença, validação par/8–64, lista de espera). Base direta para o motor de sorteio (Sprint 5).

**Como rodar (lembrete):** Terminal 1 `pnpm db:migrate` + `pnpm dev:api`; Terminal 2 `pnpm dev:web`. Banco: Neon. Login: admin@ranking-elite-beach.local / admin123.

---

## 2026-07-03 — Sprint 3: Temporadas e Campeonatos entregue

**Resumo:** Sprint 2 aprovada (cadastro de jogadores funcionando). Implementadas Temporadas e Campeonatos com configuração parametrizável.

**Decisão de UX/UI (registrada):** função primeiro; polimento visual só na Fase 11.

**Entregue**
- Models Season/Championship/ChampionshipConfig + migration; contracts com defaults; API (CRUD, config, lock BR-05, transições de status); telas de temporadas e campeonatos com editor de config; testes; docs.

**Itens aprovados**
- Sprint 2 (Jogadores).

**Itens pendentes**
- QA da Sprint 3 (QA-C1 a QA-C9). Rodar `pnpm db:migrate` para criar as novas tabelas.

**Próximas tarefas**
- PO: QA de temporadas/campeonatos.
- Dev: após aprovação, Sprint 4 (Rodadas e Inscrições).

---

## 2026-07-03 — Sprint 2: Jogadores entregue

**Resumo:** Sprint 1 aprovada (QA completo). Implementado o módulo de Jogadores.

**Decisão de negócio:** foto do jogador por **URL + avatar de iniciais** nesta sprint (upload real fica no backlog).

**Entregue**
- Model `Player` + migration; contracts zod; API CRUD com busca/filtro/paginação e RBAC; telas de lista, cadastro/edição e perfil; testes; docs atualizados.

**Itens aprovados**
- Sprint 1 (Fundação).

**Itens pendentes**
- QA da Sprint 2 pelo PO (QA-P1 a QA-P10 no TEST_PLAN). Rodar `pnpm db:migrate` para criar a tabela `player`.

**Próximas tarefas**
- PO: QA do módulo de Jogadores.
- Dev: após aprovação, Sprint 3 (Temporadas e Campeonatos).

---

## 2026-07-03 — Sprint 1: Fundação entregue

**Resumo:** PO aprovou a Fase 0 e as 3 regras de borda. Implementada a fundação do sistema.

**Entregue**
- Monorepo (web/api/contracts/db), auth JWT + RBAC, Prisma + seed, login web protegido, CI, Swagger.
- Documentação atualizada (PROJECT com "como executar", ROADMAP, CHANGELOG, RELEASE_NOTES, TEST_PLAN com roteiro de QA).

**Itens aprovados**
- Fase 0 (planejamento) e regras de borda.

**Itens pendentes**
- QA da Sprint 1 pelo PO (roteiro QA-1 a QA-10 no TEST_PLAN).

**Próximas tarefas**
- PO: rodar o setup e executar o roteiro de QA; reportar bugs/ajustes.
- Dev: após aprovação, iniciar Sprint 2 (Jogadores).

---

## 2026-07-02 — Fase 0: Validação das pendências de regra

**Resumo:** PO respondeu as 8 pendências de regra de negócio. Documentação atualizada e criado FORMATS.md.

**Decisões tomadas**
- Formato de rodada dinâmico; grupo preferencial 3; matriz mapeada em FORMATS.md.
- Classificação intra-rodada: vencedores + melhores 2ºs até fechar potência de 2.
- Partida padrão 1 set (configurável).
- W.O. é exceção (substituição/lesão); não penaliza aproveitamento do lesionado.
- Desempate: pontos → saldo games → confronto direto → sorteio.
- Fase final: pós-última rodada, por pontos acumulados, novo sorteio ignorando histórico, grupos + mata-mata.
- Lista de espera: promoção manual.
- Config após ATIVO: bloqueio estrutural, sorteio ajustável por rodada.
- "Melhor parceiro" por taxa de vitória adiado; manter "parceiro favorito" por frequência.

**Pendências remanescentes (menores)**
- Placar padrão do W.O. por lesão (sugestão 6/0).
- Confirmar em QA os casos de borda de FORMATS.md (G=1 e G=2: forçar final?).

**Próximas tarefas**
- PO: revisar FORMATS.md + BUSINESS_RULES atualizado e dar aprovação final da Fase 0.
- Dev: iniciar Sprint 1 (Fundação) após aprovação.

---

## 2026-07-02 — Kickoff / Fase 0

**Resumo da conversa**
- PO apresentou o brief completo do WebApp de gerenciamento de campeonatos de Beach Tennis (Ranking Elite Beach).
- Definido modelo de trabalho incremental: entregas pequenas, PO faz QA, avanço só após aprovação.
- Respondidas 3 perguntas de arquitetura antes do planejamento.

**Decisões tomadas**
- Stack: full TypeScript — Next.js (front) + NestJS (back) + PostgreSQL/Prisma; fugindo do legado C#/.NET/Firebird (pedido de inovação).
- Tenancy: single-tenant no MVP, schema preparado para multi-clube.
- Deploy: nuvem gerenciada.
- Arquitetura modular monolítica (sem microsserviços).

**Itens aprovados**
- (Nenhum ainda) — Fase 0 aguardando validação do PO.

**Itens pendentes**
- Validação da Fase 0 (planejamento).
- 8 pendências de regra de negócio (BUSINESS_RULES.md): tamanho de grupo, formato de partida, W.O., ordem de desempate, formato da final, lista de espera, edição de config em ACTIVE, mínimo de jogos p/ "melhor parceiro".

**Próximas tarefas**
- PO: revisar `/docs` e aprovar ou apontar ajustes; responder as 8 pendências.
- Dev: após aprovação, iniciar Sprint 1 (Fundação).
