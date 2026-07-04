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

### Roteiro de QA — Sprint 4 (Rodadas e Inscrições)

> Pré: `pnpm db:migrate` (cria `round` e `registration` + enums), reiniciar API, `pnpm dev`, logado como admin. Ter ao menos 1 campeonato **Ativo** e ~10 jogadores ativos cadastrados (Sprint 2/3).

- **QA-R1 (migration):** `pnpm db:migrate` cria `round` e `registration` sem erro (ex.: nome `rounds_registrations`).
- **QA-R2 (criar rodada):** no detalhe de um campeonato Ativo, "Nova rodada" → número já sugerido; salvar → abre o detalhe da rodada como **Agendada**. (Em campeonato Rascunho, a criação de rodadas fica bloqueada com aviso.)
- **QA-R3 (abrir/fechar):** "Abrir inscrições" → situação vira **Inscrições abertas**; "Fechar inscrições" volta para Agendada.
- **QA-R4 (inscrever):** no formulário "Inscrever jogador", selecionar um ativo → aparece na lista como Confirmado; o jogador some do seletor (não pode duplicar).
- **QA-R5 (duplicar):** via API, `POST /rounds/:id/registrations` com um `playerId` já inscrito → **409 `REGISTRATION_EXISTS`**.
- **QA-R6 (inativo):** inativar um jogador (Sprint 2) e tentar inscrevê-lo via API → **422 `PLAYER_INACTIVE`** (BR-03).
- **QA-R7 (situações):** alternar um inscrito entre Confirmado / Pendente / Ausente / Lista de espera → o resumo (confirmados/…) atualiza.
- **QA-R8 (lista de espera manual):** colocar um jogador em Lista de espera e depois "Confirmar" → promoção **manual** (BR-10); não há promoção automática.
- **QA-R9 (substituição):** em um inscrito, "Substituir" → escolher outro atleta ativo → o inscrito vira Ausente e a substituição é registrada (BR-27).
- **QA-R10 (prontidão):** com **8** confirmados (par, na faixa) → banner "Pronta para o sorteio (✓)"; com **7** ou **65** → aviso de faixa [8,64]; com nº **ímpar** (ex.: 9) → aviso de paridade. (BR-07/08/11.)
- **QA-R11 (prévia de formato):** com 8 confirmados (4 duplas) → prévia "1 grupo · Final"; com 18 (9 duplas) → "3 grupos (3,3,3) · Semifinal · 3 venc. + 1 melhor 2º" (FORMATS.md).
- **QA-R12 (remover/escopo):** remover uma inscrição some da lista; a lista de rodadas do campeonato mostra confirmados e a coluna "Sorteável".

**Critérios de aceite:** QA-R1 a QA-R12 verdes. Enforcement de sorteio (409/422 ao gerar duplas) é validado na Sprint 5.

## Fase 5 — Motor de Sorteio *(crítico)*
**Aceite:** mesma seed ⇒ mesmo resultado; todo jogador em 1 dupla; grupos round-robin completos; score e explicações presentes; respeita `allowRepeatPartners/Opponents`.
- **Positivo:** randomness 100 minimiza repetições e equilibra ranking; simulate não persiste; confirm persiste.
- **Negativo:** nº ímpar → recusa; pesos inválidos → 400.
- **Extremo:** histórico saturado (todos já jogaram com todos) e `allowRepeatPartners=false` → fallback à menor repetição sem travar; randomness 0 vs 100 produzem distribuições esperadas; 64 jogadores em < 2s (RNF-01).
- **Propriedade (property-based):** para qualquer entrada válida, invariantes de integridade nunca violadas.

### Roteiro de QA — Sprint 5 (Motor de Sorteio — simulação)

> Pré: `pnpm dev` (sem migration nesta fatia). Ter um campeonato **Ativo** com uma rodada e **≥ 8 jogadores ativos** cadastrados. Reiniciar a API se ela estava rodando desde antes desta entrega (nova dependência `@reb/sort-engine`).

- **QA-D1 (testes do motor):** `pnpm --filter @reb/sort-engine test` → 21 testes verdes (determinismo, invariantes 8/16/32/64, histórico, randomness).
- **QA-D2 (bloqueio por prontidão):** rodada com nº ímpar de confirmados → botão "Simular sorteio" desabilitado; via API `POST /rounds/:id/draw/simulate` → **409 `ODD_PLAYER_COUNT`**. Com < 8 confirmados → **422 `PLAYER_COUNT_OUT_OF_RANGE`**.
- **QA-D3 (simular):** com 8 confirmados (par), abrir `/rounds/:id/draw` → "Simular sorteio" → aparecem **duplas** (N/2), **grupos**, **confrontos** (round-robin), **score** (0–100), **métricas** e **explicações**.
- **QA-D4 (formato):** o cabeçalho do resultado reflete a matriz (ex.: 8 confirmados → 4 duplas, 1 grupo, "Final"; 18 → 9 duplas, 3 grupos, "Semifinal").
- **QA-D5 (regenerar):** clicar "Regenerar" → nova seed → composição normalmente muda (a seed exibida muda).
- **QA-D6 (aleatoriedade):** mover o slider para 0 e simular (mais aleatório) vs 100 (mais equilibrado) → o score em 100 tende a ser ≥ que em 0; explicações refletem o equilíbrio.
- **QA-D7 (não persiste):** após simular, recarregar a rodada → nenhuma dupla/grupo foi gravado (BR-19); a simulação é só conferência.
- **QA-D8 (integridade):** em qualquer simulação, todo jogador aparece em exatamente uma dupla e cada grupo tem todos contra todos.

**Critérios de aceite:** QA-D1 a QA-D8 verdes. Persistência ("confirmar sorteio") é validada na próxima fatia.

### Roteiro de QA — Sprint 5 (Confirmar sorteio + histórico)

> Pré: `pnpm db:migrate` (migration `draw_persistence` — cria Draw/Team/TeamPlayer/Group/GroupTeam/Match + PartnerHistory/OpponentHistory), reiniciar a API, `pnpm dev`. Ter um campeonato Ativo e ≥ 8 jogadores ativos.

- **QA-DC1 (migration):** `pnpm db:migrate` cria as 8 tabelas sem erro (nome `draw_persistence`).
- **QA-DC2 (confirmar):** numa rodada com 8 confirmados, `/rounds/:id/draw` → "Simular" → "Confirmar este sorteio" → volta para a rodada como **Sorteada**; "Ver sorteio" mostra o resultado gravado (duplas, grupos, jogos "A jogar", score).
- **QA-DC3 (bloqueio de re-sorteio):** com a rodada Sorteada, `POST /rounds/:id/draw/confirm` de novo → **409 `DRAW_EXISTS`**. A tela não oferece simular, só "Ver sorteio".
- **QA-DC4 (histórico alimenta o motor):** criar uma 2ª rodada com **os mesmos 8 jogadores** confirmados → simular → as duplas tendem a **não repetir** as parceiras da 1ª rodada (diversidade alta); métricas mostram `parceiros repetidos` baixos.
- **QA-DC5 (descartar reverte):** na 1ª rodada, "Descartar sorteio" → volta para **Aberta**, o sorteio some; simular a 2ª rodada de novo → o histórico da 1ª não é mais considerado (as restrições afrouxam).
- **QA-DC6 (persistência real):** `GET /rounds/:id/draw` retorna o sorteio; recarregar a página mantém o mesmo resultado (seed/duplas), provando que foi gravado.
- **QA-DC7 (integridade):** todo jogador confirmado aparece em exatamente uma dupla; cada grupo tem todos os confrontos; nº de jogos por grupo = C(k,2).
- **QA-DC8 (RBAC/escopo):** usuário sem permissão não confirma/descarta (403); rodada de outro clube não é acessível.

**Critérios de aceite:** QA-DC1 a QA-DC8 verdes. Conclui a Sprint 5.

## Fase 6 — Jogos/Resultados
**Aceite:** vencedor coerente com sets; standings recalculadas; auditoria registrada.
- **Negativo:** placar sem vencedor claro → 422; editar resultado sem permissão → 403.
- **Extremo:** W.O.; empate de sets conforme formato configurado.

### Roteiro de QA — Sprint 6 (fatia A — fase de grupos)

> Pré: `pnpm db:migrate` (migration `match_results` — Match + MatchResultLog), reiniciar a API, `pnpm dev`. Ter uma rodada com **sorteio confirmado** (Sprint 5).

- **QA-M1 (migration):** `pnpm db:migrate` cria/altera `match` e cria `match_result_log` sem erro (nome `match_results`).
- **QA-M2 (lançar placar):** em `/rounds/:id/results`, lançar o placar de um jogo (ex.: 6×4) → o vencedor fica em negrito, o jogo some de "A jogar" e a classificação do grupo atualiza. A rodada passa a "Em andamento".
- **QA-M3 (vencedor derivado):** não há campo de "vencedor" manual — ele sai do placar (BR-25).
- **QA-M4 (placar inválido):** tentar 6×6 (1 set) ou um set incompleto → erro **`INVALID_SCORE`**, não grava.
- **QA-M5 (W.O.):** em um jogo, alternar para "W.O.", escolher o vencedor → grava placar padrão (ex.: 6/0), status "W.O."; marcar "por lesão" → registra `walkover_injury`.
- **QA-M6 (classificação/desempate):** com vários jogos lançados, a tabela ordena por vitórias → saldo de games → confronto direto (BR-28/29); posições coerentes.
- **QA-M7 (correção + auditoria):** corrigir um placar já lançado → atualiza; a alteração fica registrada em `match_result_log` (antes/depois) — conferível no banco (`pnpm db:studio`).
- **QA-M8 (RBAC/escopo):** usuário sem permissão não lança resultado (403); jogo de outro clube não é acessível (404).

**Critérios de aceite:** QA-M1 a QA-M8 verdes. Mata-mata da rodada + colocação/pontos ficam para a fatia seguinte.

### Roteiro de QA — Sprint 6 (fatia B — mata-mata + colocação)

> Pré: `pnpm db:migrate` (migration `knockout_placement`), reiniciar API, `pnpm dev`. Ter uma rodada com sorteio confirmado e **todos os jogos de grupo lançados**.

- **QA-K1 (migration):** `pnpm db:migrate` altera `match` e cria `round_result` sem erro (nome `knockout_placement`).
- **QA-K2 (bloqueio):** com jogos de grupo pendentes, `/rounds/:id/knockout` não deixa gerar; via API `POST .../knockout/generate` → **409 `GROUP_STAGE_INCOMPLETE`**.
- **QA-K3 (gerar):** com a fase de grupos concluída, "Gerar mata-mata" cria a 1ª fase (ex.: Semifinal) com os classificados corretos (top-2/vencedores+melhores 2ºs conforme o formato).
- **QA-K4 (avanço):** lançar os placares da semifinal → o sistema cria automaticamente a **Final** (vencedores) e a **Disputa de 3º** (perdedores).
- **QA-K5 (encerrar):** lançar Final e 3º lugar → a rodada vira **Encerrada** e aparece a **colocação final 1..D** com os **pontos** de cada dupla conforme a `scoring_table`.
- **QA-K6 (colocação):** conferir que campeão=1, vice=2, 3º/4º pela disputa de 3º, e as demais duplas por desempenho de grupo (1..D sem buracos).
- **QA-K7 (gerar 2x):** tentar gerar o mata-mata de novo → **409 `KNOCKOUT_EXISTS`**.
- **QA-K8 (formatos):** repetir com um nº de duplas que gere chave 8 (ex.: 30–34 jogadores) → oitavas/quartas coerentes com FORMATS.md.

**Critérios de aceite:** QA-K1 a QA-K8 verdes. Conclui a Sprint 6.

## Fase 7 — Classificação/Ranking
**Aceite:** pontos conforme scoring_table; desempates na ordem configurada; ranking por escopo correto.
- **Extremo:** empate total resolvido por último critério; recomputo idempotente.

### Roteiro de QA — Sprint 7 (Ranking e pontuação)

> Pré: **sem migration**. `pnpm dev`. Ter um campeonato com ≥ 1 rodada **encerrada** (com pontos lançados — Sprint 6).

- **QA-RK1 (ranking do campeonato):** no detalhe do campeonato, "Ranking" → tabela com jogadores ordenados por pontos; os pontos batem com a soma das colocações das rodadas (cada jogador da dupla recebe os pontos da dupla).
- **QA-RK2 (V/D e aproveitamento):** conferir vitórias/derrotas e aproveitamento (%) de um jogador contra os jogos lançados.
- **QA-RK3 (W.O. por lesão):** um jogador que perdeu por W.O. de lesão **não** tem essa derrota no aproveitamento (BR-32).
- **QA-RK4 (desempate):** dois jogadores com os mesmos pontos → o de maior saldo de games fica à frente; persistindo empate, maior aproveitamento (BR-33).
- **QA-RK5 (escopos):** alternar Campeonato / Temporada / Geral muda o conjunto de rodadas somadas (temporada = todos os campeonatos do ano; geral = tudo do clube).
- **QA-RK6 (evolução):** a seção de evolução mostra os pontos acumulados por rodada, coerentes com o total do ranking do campeonato.
- **QA-RK7 (vazio):** campeonato sem rodada encerrada → estado vazio (sem erro).

**Critérios de aceite:** QA-RK1 a QA-RK7 verdes.

## Fase 8 — Estatísticas/Dashboard
**Aceite:** sequências, parceiro favorito/melhor, adversário mais enfrentado corretos; dashboard carrega < 2s.
- **Extremo:** jogador sem jogos (empty state); divisão por zero em aproveitamento.

### Roteiro de QA — Sprint 8 (Estatísticas e Dashboard)

> Pré: **sem migration**. `pnpm dev`. Ter jogadores com histórico (rodadas encerradas — Sprint 6).

- **QA-S1 (perfil com stats):** abrir o perfil de um jogador que já jogou → pontos, aproveitamento, participações, média, títulos, finais e melhor/pior colocação coerentes com o histórico.
- **QA-S2 (parceiro/adversário):** "Parceiro favorito" e "Adversário mais enfrentado" mostram os corretos (por frequência), com link para o perfil.
- **QA-S3 (sequências):** maiores sequências de vitórias/derrotas conferem com os jogos.
- **QA-S4 (W.O. lesão):** o aproveitamento não cai por uma derrota de W.O. por lesão (BR-32).
- **QA-S5 (perfil vazio):** jogador sem jogos → estado vazio, sem erro (sem divisão por zero).
- **QA-S6 (dashboard KPIs):** os indicadores batem com os dados (jogadores ativos, temporadas, campeonatos, rodadas, encerradas).
- **QA-S7 (dashboard blocos):** "Próxima rodada" aponta a rodada agendada/aberta; "Últimos resultados" lista os campeões recentes; "Top do ranking" mostra o gráfico de barras.
- **QA-S8 (evolução):** na tela de ranking, o gráfico de linha reflete os pontos acumulados por rodada (coerente com a tabela).

**Critérios de aceite:** QA-S1 a QA-S8 verdes.

## Fases 9–11 — Quadras/Agenda/Final/Polimento
**Aceite:** jogo vinculado a quadra; agenda exibe eventos; final gera N classificados e chaveamento; PWA instalável; auditoria e logs ativos.

### Roteiro de QA — Fase 9 (Quadras e Agenda)

> Pré: `pnpm db:migrate` (migration `venues_calendar`), reiniciar a API, `pnpm dev`.

- **QA-V1 (migration):** `pnpm db:migrate` cria `venue` e `calendar_event` e adiciona `match.venue_id` sem erro.
- **QA-V2 (CRUD quadra):** em `/venues`, criar duas quadras; editar uma; ambas aparecem na lista.
- **QA-V3 (vincular jogo):** numa rodada sorteada, em Resultados, abrir "Definir quadra/horário" de um jogo → escolher quadra + horário → salvar → o jogo passa a exibir a quadra/horário.
- **QA-V4 (excluir desvincula):** excluir uma quadra que está vinculada a jogos → exclusão ocorre e os jogos ficam sem quadra (sem erro).
- **QA-V5 (agenda — rodadas):** dar data a uma rodada (editar rodada) → ela aparece na Agenda no mês correspondente como "Rodada"; fase final aparece como "Final".
- **QA-V6 (agenda — manual):** criar um "Treino" numa data → aparece na Agenda; removê-lo funciona. Navegar ‹ › muda o mês.
- **QA-V7 (RBAC/escopo):** usuário sem permissão não cria/edita/exclui quadra nem evento (403); dados de outro clube não aparecem.

**Critérios de aceite:** QA-V1 a QA-V7 verdes.

### Roteiro de QA — Fase 10 (Fase Final)

> Pré: **sem migration**. `pnpm dev`. Campeonato **Ativo** com rodadas regulares encerradas (ranking populado). `qualifiers_count` par e ≥ 8 para a final ser sorteável.

- **QA-F1 (gerar):** no detalhe do campeonato, "Gerar fase final" → cria a rodada de Fase final com os `qualifiers_count` melhores do ranking já **confirmados**; redireciona para a rodada.
- **QA-F2 (novo sorteio sem histórico):** simular o sorteio da final → as duplas podem repetir parceiros que já jogaram juntos (histórico ignorado — BR-34); confirmar.
- **QA-F3 (jogar até o campeão):** lançar resultados dos grupos → gerar mata-mata → jogar até a final → rodada Encerrada com colocação; o campeonato passa a exibir o **campeão**.
- **QA-F4 (ranking inalterado):** o ranking do campeonato **não** soma os pontos da fase final (continua refletindo as rodadas regulares).
- **QA-F5 (bloqueios):** "Gerar fase final" de novo → **409 `FINAL_EXISTS`**; gerar com campeonato não-ativo → bloqueado; sem ranking → **422 `NO_RANKING`**.
- **QA-F6 (histórico intacto):** o histórico de parceiros/adversários usado pelas rodadas regulares não é afetado pela final (novas rodadas regulares seguem evitando repetições como antes).

**Critérios de aceite:** QA-F1 a QA-F6 verdes. Encerra a Fase 10.

### Roteiro de QA — Fase 11 (fatia A — PWA + Polimento)

> Pré: **sem migration**. `pnpm dev` (ou build). Testar preferencialmente no **celular** ou no DevTools em viewport mobile.

- **QA-P1 (instalável):** no Chrome/Edge (mobile ou desktop), abrir o app → DevTools ▸ Application ▸ Manifest válido e "Installable"; instalar → abre em janela própria com ícone e cor da marca.
- **QA-P2 (offline shell):** com o SW registrado, ativar "Offline" (DevTools ▸ Network) e navegar → cai na tela `offline.html` (marca + "Tentar novamente"), sem erro cru do navegador.
- **QA-P3 (responsivo):** percorrer jogadores, campeonato, rodada, resultados, ranking e agenda em tela de celular → sem overflow horizontal da página; tabelas rolam dentro do próprio bloco; headers quebram linha.
- **QA-P4 (inputs iOS):** focar campos no celular → não há zoom automático.
- **QA-P5 (boundaries):** abrir uma URL inexistente → 404 amigável com "Voltar ao início"; um erro de carregamento mostra a tela de erro com "Tentar novamente".
- **QA-P6 (guia):** abrir "Como funciona" (dashboard ou `/help`) → passo a passo legível no celular, com links levando às telas certas.

**Critérios de aceite:** QA-P1 a QA-P6 verdes. Hardening e Deploy nas próximas fatias.

### Roteiro de QA — Fase 11 (fatia B — Hardening da API)

> Pré: **sem migration**. Subir a API (`pnpm dev:api` ou build). Testes na própria API (`http://localhost:3333/api/v1`). Dica: use `curl -i` para ver status + cabeçalhos.

- **QA-H1 (rate-limit no login):** enviar `POST /auth/login` com senha errada **mais de 10 vezes** em 1 minuto (do mesmo IP) → a partir da 11ª retorna **429** com corpo `{ "error": { "code": "RATE_LIMITED" } }`. Após ~1 min, volta a responder normalmente.
- **QA-H2 (cabeçalhos Helmet):** `curl -i http://localhost:3333/api/v1/health` → presentes `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security`, `X-DNS-Prefetch-Control: off`.
- **QA-H3 (Swagger intacto):** abrir `http://localhost:3333/api/docs` → carrega normalmente (CSP não quebra a página).
- **QA-H4 (CORS restrito):** requisição de origem diferente de `WEB_ORIGIN` (ex.: `curl -i -H "Origin: http://evil.local" .../api/v1/health`) → resposta **sem** `Access-Control-Allow-Origin` liberando a origem estranha; a app web em `WEB_ORIGIN` segue funcionando.
- **QA-H5 (rota inexistente padronizada):** `GET /api/v1/nao-existe` → **404** `{ "error": { "code": "NOT_FOUND", "message": "..." } }`.
- **QA-H6 (não vaza erro interno):** qualquer 500 inesperado → corpo genérico `{ "error": { "code": "INTERNAL_ERROR", "message": "Erro interno" } }` (sem stack/detalhes); a causa real aparece **só** no log do servidor.
- **QA-H7 (health isento):** martelar `GET /health` acima do limite global **não** retorna 429 (endpoint isento por ser usado em health checks).
- **QA-H8 (regressão):** `pnpm --filter @reb/api test` (102 testes) e `pnpm build` verdes.

**Critérios de aceite:** QA-H1 a QA-H8 verdes. Encerra o hardening; resta o Deploy (fatia C) para fechar a Fase 11.

### Roteiro de QA — Fase 12 (fatia 1 — Portal do Jogador)

> Pré: migration `player_portal` aplicada (`pnpm db:migrate`). Rodar API (:3333), web (:3000) e portal (:3001). O atleta usa o **portal**; a organização, o **web**.

- **QA-PP1 (gerar convite):** no web (admin), obter convite de um jogador — `POST /players/:id/invite` → retorna um **código** (ex.: `ABCD-EFGH-JKMN`) e validade.
- **QA-PP2 (ativar conta):** no portal `/claim`, informar código + e-mail + senha (≥8) → entra e cai na **Home**; refazer com o mesmo código → **INVITE_USED**; código errado → **INVALID_INVITE**.
- **QA-PP3 (Home):** herói do atleta com foto/nível, posição no ranking (▲▼ se houver base), aproveitamento; **próximo jogo** mostra adversário/quadra/horário e **contagem regressiva** correta; KPIs coerentes com o histórico.
- **QA-PP4 (Perfil e Jogos):** `/perfil` mostra números completos; `/jogos` lista "a jogar" e "histórico" com resultado/placar corretos do ponto de vista do atleta.
- **QA-PP5 (escopo/segurança):** o atleta vê **apenas os próprios dados**; um login PLAYER **não** acessa endpoints de backoffice (`/players/:id/stats`, `/championships/:id/ranking`, `/rounds/*` → 403) nem as telas do web.
- **QA-PP6 (login normal):** sair e entrar de novo por e-mail/senha em `/login`; sessão persiste (refresh transparente).
- **QA-PP7 (PWA):** instalar o portal (manifest/ícones próprios "Meu Beach"); offline → tela `offline.html`.
- **QA-PP8 (regressão):** web/admin segue funcionando (contas ADMIN/ORGANIZER inalteradas); `pnpm test` (108) e `pnpm build` verdes.

**Critérios de aceite:** QA-PP1 a QA-PP8 verdes. Fatia 1 do épico concluída após aprovação.

---

## Formato de reporte de bug (para o QA)
`[Fase][Severidade] Título` · Passos · Esperado · Obtido · Evidência (print) · Ambiente.
