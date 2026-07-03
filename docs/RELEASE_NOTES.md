# RELEASE_NOTES.md

> Uma nota por módulo/fase finalizada.

---

## v0.4.0 — Sprint 3: Temporadas e Campeonatos (2026-07-03)

**Novidades**
- Temporadas (ex.: 2026) com criação e encerramento.
- Campeonatos com número de rodadas, classificados e ciclo de vida (Rascunho → Ativo → Encerrado).
- Configuração parametrizável: tabela de pontuação por colocação, critérios de desempate, pesos do motor de sorteio, aleatoriedade e regras da fase final — tudo sem valores fixos no código.
- Proteção de integridade: ao ativar o campeonato, a config estrutural é bloqueada (só os pesos do sorteio continuam ajustáveis).

**Próximos passos**
- Sprint 4 — Rodadas e Inscrições (lista de inscritos, presença, validação par/8–64).

---

## v0.3.0 — Sprint 2: Jogadores (2026-07-03)

**Novidades**
- Cadastro completo de jogadores: nome, foto (URL) com avatar de iniciais, nascimento, telefone, nível técnico e status.
- Idade calculada automaticamente.
- Lista com busca por nome, filtros por status e nível, e paginação.
- Perfil do jogador (com espaço reservado para estatísticas futuras).
- Ativar/Inativar sem apagar o histórico (soft delete).

**Melhorias**
- Escopo por clube em todas as consultas (pronto para multi-clube).
- Controle de acesso: apenas Admin/Organizador criam e editam.

**Pendências**
- Upload de foto de arquivo (nesta sprint a foto é por URL) — no backlog.
- QA do PO conforme roteiro (QA-P1 a QA-P10).

**Próximos passos**
- Sprint 3 — Temporadas e Campeonatos (configuração: pontuação, desempate, pesos do sorteio).

---

## v0.2.0 — Sprint 1: Fundação (2026-07-03)

**Novidades**
- Monorepo TypeScript com web (Next.js), api (NestJS), contracts e db.
- Autenticação completa: login, refresh e `/me` com JWT (access + refresh) e Argon2.
- Controle de acesso por papel (RBAC): Admin, Organizador, Jogador, Visitante.
- Login web com sessão via cookies httpOnly e renovação transparente.
- Banco PostgreSQL via Prisma + seed do clube e do admin.
- Pipeline de CI (typecheck, lint, test, build) e Swagger da API.

**Melhorias**
- Tipos/validações compartilhados (zod) entre front e back — menos divergência de contrato.

**Correções**
- N/A (primeira entrega de código).

**Pendências**
- QA do PO conforme roteiro no TEST_PLAN (QA-1 a QA-10).

**Próximos passos**
- Após aprovação: Sprint 2 — módulo de Jogadores (CRUD, foto, perfil, soft delete).

---

## v0.1.0 — Fase 0: Planejamento (2026-07-02)

**Novidades**
- Planejamento completo do projeto Ranking Elite Beach.
- Documentação viva criada em `/docs` (14 documentos).
- Arquitetura e stack definidas; estratégia do Motor de Sorteio especificada.

**Melhorias**
- Schema modelado já preparado para evolução multi-clube (SaaS) sem migração dolorosa.
- Configurações (pontuação, pesos, desempate) parametrizáveis — sem hardcode.

**Correções**
- N/A (sem código nesta fase).

**Pendências**
- 8 regras de negócio a validar com o PO (ver BUSINESS_RULES.md).
- Aprovação da Fase 0 para iniciar a Fase 1 (Fundação).

**Próximos passos**
- Após aprovação: Sprint 1 — monorepo, auth/RBAC, CI e migration inicial.
