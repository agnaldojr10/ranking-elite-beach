# TEST_PLAN.md — Plano de Testes e Critérios de Aceite

> Base para o QA do PO. Cada módulo: objetivo, critérios de aceite, testes positivos/negativos, casos extremos.

---

## Estratégia geral
- **Unit** (domínio, sort-engine): Vitest/Jest — foco em regras e determinismo.
- **API/Integração**: Supertest contra a API + banco de teste.
- **E2E**: Playwright nos fluxos críticos (sorteio, resultado→ranking).
- Cobertura mínima no domínio de sorteio/ranking: ≥ 85% (RNF-03).

---

## Fase 1 — Fundação
**Critérios de aceite:** login retorna tokens válidos; rota protegida rejeita sem token (401) e sem papel (403); refresh renova; CI verde.
- **Positivo:** login correto → 200 + tokens; acesso com papel adequado.
- **Negativo:** senha errada → 401; token expirado → 401; papel insuficiente → 403.
- **Extremo:** brute force (rate limit); refresh reusado após logout → 401.

## Roteiro de QA — Sprint 1 (Fundação)

> Execute após `pnpm dev` com o banco no ar e o seed aplicado.

**Setup**
1. `docker compose up -d` sobe o Postgres.
2. `pnpm db:generate && pnpm db:migrate && pnpm db:seed` — deve criar clube + admin sem erro.
3. `pnpm dev` — API em :3333 e Web em :3000 sobem sem erro no console.

**Casos de teste**
- **QA-1 (health):** GET http://localhost:3333/api/v1/health → 200 `{status:"ok"}`.
- **QA-2 (swagger):** abrir http://localhost:3333/api/docs → lista `auth` e `health`.
- **QA-3 (login ok):** em /login, entrar com `admin@ranking-elite-beach.local` / `admin123` → redireciona para /dashboard mostrando e-mail e papel `ADMIN`.
- **QA-4 (login inválido):** senha errada → mensagem "E-mail ou senha inválidos"; permanece em /login.
- **QA-5 (proteção de rota):** abrir /dashboard sem estar logado (aba anônima) → redireciona para /login.
- **QA-6 (persistência):** logado, recarregar /dashboard → continua autenticado.
- **QA-7 (refresh transparente):** aguardar o access token expirar (15 min, ou reduzir `JWT_ACCESS_TTL` para 30 no .env) e navegar → segue logado sem novo login (middleware renova).
- **QA-8 (logout):** clicar "Sair" → volta ao /login; /dashboard volta a ser bloqueado.
- **QA-9 (me protegido):** GET /api/v1/auth/me sem header Authorization → 401.
- **QA-10 (CI):** `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` passam localmente.

**Critérios de aceite:** QA-1 a QA-10 verdes. Cookies `reb_access`/`reb_refresh` são httpOnly (checar no DevTools → Application → Cookies).

## Fase 2 — Jogadores
**Aceite:** CRUD completo; idade calculada correta; inativo não some do histórico.
- **Positivo:** criar/editar/listar/filtrar; foto por URL / avatar de iniciais.
- **Negativo:** nome vazio → 400; data futura → 400.
- **Extremo:** idade em aniversário (hoje); 10k jogadores (paginação/performance).

### Roteiro de QA — Sprint 2 (Jogadores)

> Pré: `pnpm db:migrate` (nova migration da tabela `player`) e `pnpm dev` (ou API + web em janelas separadas), logado como admin.

- **QA-P1 (migration):** `pnpm db:migrate` cria a tabela `player` sem erro (nomeie ex.: `add_player`).
- **QA-P2 (lista vazia):** acessar `/players` (ou card "Jogadores" no dashboard) → estado vazio com link "Cadastrar o primeiro".
- **QA-P3 (criar):** `/players/new` → preencher nome, nascimento, nível; salvar → volta à lista com o jogador; idade exibida corretamente.
- **QA-P4 (validação):** salvar com nome de 1 letra ou sem data → mensagem de erro, não cria.
- **QA-P5 (foto/avatar):** sem URL → avatar com iniciais; com URL válida → imagem aparece.
- **QA-P6 (busca/filtro):** buscar por parte do nome; filtrar por status e por nível → lista reflete os filtros; paginação funciona com >20 jogadores.
- **QA-P7 (perfil):** clicar no jogador → perfil com dados; bloco de estatísticas exibindo aviso "próximas sprints".
- **QA-P8 (editar):** editar dados e salvar → alterações refletidas no perfil e na lista.
- **QA-P9 (soft delete):** "Inativar" → status vira Inativo (jogador continua na base/histórico); "Ativar" reverte.
- **QA-P10 (RBAC):** com usuário sem permissão (papel VIEWER/PLAYER), `POST /api/v1/players` deve retornar 403. (Opcional — exige criar um usuário de teste.)

**Critérios de aceite:** QA-P1 a QA-P9 verdes (QA-P10 opcional nesta sprint).

## Fase 3 — Campeonatos
**Aceite:** config salva em JSONB; edição bloqueada fora de DRAFT (BR-05).
- **Negativo:** editar config de campeonato ACTIVE → 409 `CONFIG_LOCKED`.
- **Extremo:** scoring_table com muitas colocações; pesos somando ≠ 1 (normalizar).

### Roteiro de QA — Sprint 3 (Temporadas e Campeonatos)

> Pré: `pnpm db:migrate` (cria `season`, `championship`, `championship_config`), reiniciar API, `pnpm dev`, logado como admin.

- **QA-C1 (migration):** `pnpm db:migrate` cria as 3 tabelas sem erro (ex.: nome `seasons_championships`).
- **QA-C2 (temporada):** em `/seasons`, criar "2026" → aparece na lista; criar o mesmo ano de novo → erro "já existe temporada".
- **QA-C3 (campeonato):** em `/championships/new`, escolher a temporada, definir 10 rodadas e 8 classificados → criar → abre o detalhe com a config padrão (pontuação, desempate iniciando por Pontos, pesos do sorteio).
- **QA-C4 (editar config em DRAFT):** em "Editar configuração", alterar pesos do sorteio e a tabela de pontuação → salvar → detalhe reflete os novos valores.
- **QA-C5 (editar dados):** "Editar dados" → mudar nº de rodadas/classificados (permitido em rascunho) → salva.
- **QA-C6 (ativar):** "Ativar campeonato" → status vira Ativo.
- **QA-C7 (lock estrutural):** com o campeonato Ativo, abrir "Editar configuração" → campos de pontuação/desempate/final aparecem bloqueados; alterar só os pesos do sorteio e salvar → funciona. (Via API: `PATCH /championships/:id/config` com `scoringTable` → 409 `CONFIG_LOCKED`.)
- **QA-C8 (encerrar):** "Encerrar" → status vira Encerrado; não permite voltar.
- **QA-C9 (escopo):** a lista mostra só campeonatos do clube; contagem de campeonatos por temporada confere.

**Critérios de aceite:** QA-C1 a QA-C9 verdes.

## Fase 4 — Rodadas/Inscrições
**Aceite:** status transita corretamente; validação de par e [8,64].
- **Positivo:** confirmar presença; promover da lista de espera.
- **Negativo:** inscrever jogador inativo → 422; duplicar inscrição → 409.
- **Extremo:** exatamente 8 e 64 confirmados; 7 (mín-1) e 65 (máx+1); nº ímpar → sorteio bloqueado (409 `ODD_PLAYER_COUNT`).

## Fase 5 — Motor de Sorteio *(crítico)*
**Aceite:** mesma seed ⇒ mesmo resultado; todo jogador em 1 dupla; grupos round-robin completos; score e explicações presentes; respeita `allowRepeatPartners/Opponents`.
- **Positivo:** randomness 100 minimiza repetições e equilibra ranking; simulate não persiste; confirm persiste.
- **Negativo:** nº ímpar → recusa; pesos inválidos → 400.
- **Extremo:** histórico saturado (todos já jogaram com todos) e `allowRepeatPartners=false` → fallback à menor repetição sem travar; randomness 0 vs 100 produzem distribuições esperadas; 64 jogadores em < 2s (RNF-01).
- **Propriedade (property-based):** para qualquer entrada válida, invariantes de integridade nunca violadas.

## Fase 6 — Jogos/Resultados
**Aceite:** vencedor coerente com sets; standings recalculadas; auditoria registrada.
- **Negativo:** placar sem vencedor claro → 422; editar resultado sem permissão → 403.
- **Extremo:** W.O.; empate de sets conforme formato configurado.

## Fase 7 — Classificação/Ranking
**Aceite:** pontos conforme scoring_table; desempates na ordem configurada; ranking por escopo correto.
- **Extremo:** empate total resolvido por último critério; recomputo idempotente.

## Fase 8 — Estatísticas/Dashboard
**Aceite:** sequências, parceiro favorito/melhor, adversário mais enfrentado corretos; dashboard carrega < 2s.
- **Extremo:** jogador sem jogos (empty state); divisão por zero em aproveitamento.

## Fases 9–11 — Quadras/Agenda/Final/Polimento
**Aceite:** jogo vinculado a quadra; agenda exibe eventos; final gera N classificados e chaveamento; PWA instalável; auditoria e logs ativos.

---

## Formato de reporte de bug (para o QA)
`[Fase][Severidade] Título` · Passos · Esperado · Obtido · Evidência (print) · Ambiente.
