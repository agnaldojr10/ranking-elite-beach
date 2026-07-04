# BUSINESS_RULES.md — Regras de Negócio

> Fonte da verdade das regras. IDs `BR-xx` para rastreabilidade com testes.
> Pendências da Fase 0 **resolvidas com o PO em 2026-07-02** (ver seção final).

---

## 1. Jogadores
- **BR-01** Idade é derivada de `birth_date` (nunca armazenada).
- **BR-02** Jogador nunca é excluído fisicamente; apenas INACTIVE (soft delete). Histórico preservado.
- **BR-03** Jogador INACTIVE não pode ser inscrito em novas rodadas, mas mantém histórico/estatísticas.

## 2. Temporadas e Campeonatos
- **BR-04** Todo campeonato pertence a uma temporada; todo histórico é preservado entre temporadas.
- **BR-05** **Edição de config após ATIVO — "bloquear estrutural, liberar sorteio":**
  - **Congelado** ao virar ACTIVE: `scoring_table`, `tiebreakers`, `rounds_count`, `qualifiers_count`, `final_config`. Garante integridade do ranking.
  - **Ajustável por rodada:** `draw_weights` e `randomness` (são naturalmente parâmetros por rodada).
  - Toda alteração gera registro em `AUDIT_LOG`.
- **BR-06** Nº de rodadas e nº de classificados são definidos na criação.

## 3. Inscrições e Rodadas
- **BR-07** Mínimo **8** e máximo **64** inscritos confirmados por rodada.
- **BR-08** Quantidade de confirmados deve ser **par**. Se ímpar, o sorteio é **bloqueado**.
- **BR-09** Status de inscrição: CONFIRMED, PENDING, ABSENT, WAITLIST.
- **BR-10** **Lista de espera é promovida MANUALMENTE** pelo organizador, tipicamente em caso de desistência ou lesão de um confirmado. Não há promoção automática.
- **BR-11** Sorteio só inicia com todos os participantes em CONFIRMED e contagem par dentro de [8,64].

## 4. Motor de Sorteio (rodada regular)
- **BR-12** O sorteio nunca é um simples embaralhamento; sempre otimiza segundo os pesos configurados.
- **BR-13** Prioridade padrão: **parceiros inéditos**; se impossível, menor repetição possível.
- **BR-14** Objetivo de temporada: maximizar diversidade de parceiros e reduzir confrontos repetidos.
- **BR-15** Balanceamento de ranking: evitar concentrar jogadores fortes na mesma dupla; equilibrar soma de pontos das duplas.
- **BR-16** Balanceamento de nível técnico complementa o de ranking.
- **BR-17** Grau de aleatoriedade: 0% = totalmente aleatório; 50% = misto; 100% = máximo balanceamento.
- **BR-18** `allow_repeat_partners` / `allow_repeat_opponents` liberam repetições quando `false` seria inviável.
- **BR-19** Simulação não persiste nada; regenerar produz novo resultado (nova seed).
- **BR-20** Ao confirmar, persistem-se duplas, grupos, jogos, seed, snapshot da config, score e explicações (auditável).
- **BR-21** Score de qualidade reporta: parceiros repetidos, adversários repetidos, equilíbrio dos grupos, diferença média de ranking, diversidade das duplas.
- Detalhes do algoritmo em [SORT_ENGINE.md](./SORT_ENGINE.md).

## 5. Formação de grupos e formato da rodada
- **BR-22** Após formar duplas, o sistema distribui grupos automaticamente; dentro do grupo, todos jogam contra todos (round-robin).
- **BR-23** **O formato é dinâmico conforme o nº de duplas da rodada.** Tamanho de grupo **preferencial = 3** (configurável; 4 permitido para absorver sobras). O nº de grupos, classificação e chave de mata-mata são derivados automaticamente. Todos os formatos possíveis (4 a 32 duplas) estão mapeados e validados em **[FORMATS.md](./FORMATS.md)**.
- **BR-23a** **Classificação intra-rodada:** avançam os **1º de cada grupo**; se faltar para completar uma chave de potência de 2 (2/4/8/16), completam-se os **melhores 2º colocados** (critério: pontos → saldo). Ex.: 9 duplas → 3 grupos de 3 → 3 vencedores + 1 melhor 2º = semifinal de 4.
- **BR-23b** **1 grupo** (8/10 jogadores): os **2 primeiros fazem a Final**. **2 grupos** (12/14/16): **top-2 de cada grupo** vão para **Semifinal de 4** (1ºA×2ºB, 1ºB×2ºA) + Final. Ver [FORMATS.md](./FORMATS.md).

## 6. Jogos e resultados
- **BR-24** Jogo = Dupla A × Dupla B, com sets/games, vencedor, quadra e horário.
- **BR-25** Vencedor é validado a partir dos sets (não pode divergir do placar).
- **BR-26** **Formato de partida padrão = 1 set** (padrão de Beach Tennis para este tipo de campeonato). Configurável na rodada: nº de sets (1 ou 3), games por set (padrão 6), tie-break em 6-6 (padrão), possibilidade de match tie-break. **Default vem como 1 set.**
- **BR-27** **W.O. é exceção** (presença é confirmada antes da rodada, como uma inscrição). Tratativas:
  - Antes do sorteio: **substituição** por outro atleta (ex.: alguém da lista de espera).
  - Lesão durante a rodada: os jogos restantes daquela dupla são marcados como **W.O.** a favor do adversário, com placar padrão **6/0**.
  - **Impacto no aproveitamento:** jogos decididos por W.O. por lesão **não penalizam** o aproveitamento pessoal do jogador lesionado (flag `walkover_injury`); contam normalmente como vitória para o adversário presente.

## 7. Classificação e desempate
- **BR-28** Classificação do grupo e do ranking ordena primeiro por **pontos**.
- **BR-29** **Ordem de desempate:** (1) pontos → (2) saldo de games → (3) confronto direto → (4) menor repetição/sorteio. A ordem é configurável, mas este é o padrão.

## 8. Pontuação e ranking
- **BR-30** ✅ Pontos por colocação vêm de `scoring_table` (JSONB). **Nunca** valores fixos no código. A pontuação é atribuída pela **colocação final da dupla na rodada** (após grupos + mata-mata). *(Sprint 6)*
- **BR-31** ✅ Ranking do jogador acumula pontos das rodadas; recortes: geral, por temporada, histórico. *(Sprint 7 — computado sob demanda)*
- **BR-32** ✅ Aproveitamento = vitórias / (vitórias + derrotas), excluindo W.O. por lesão (BR-27). *(Sprint 7)*
- **BR-33** ✅ Posição no ranking usa os critérios de desempate de BR-29 quando há empate em pontos (pontos → saldo de games → aproveitamento). *(Sprint 7)*

## 9. Fase final do campeonato
- **BR-34** ✅ A fase final ocorre **após a última rodada** e é composta pelas **melhores duplas/jogadores por pontuação acumulada** ao longo das rodadas (`qualifiers_count`). *(Fase 10 — rodada `FINAL_PHASE`; novo sorteio ignora histórico de parceiros; ranking exclui a final.)*
  - **Novo sorteio das duplas** é gerado para a final e, aqui, o **histórico de parceiros é desconsiderado** (pode repetir parceiro que já jogou junto).
  - Formato: **fase de grupos seguida de mata-mata**, conforme `final_config`.
  - A classificação para a final usa a pontuação acumulada; empate resolvido por BR-29.

## 10. Estatísticas
- **BR-35** ✅ Estatísticas por jogador conforme RF-27 são derivadas do histórico de jogos/duplas. *(Sprint 8 — computado sob demanda)*
- **BR-36** ✅ **"Parceiro favorito" = maior nº de vezes juntos** (métrica objetiva, sempre exibida). A métrica de **"melhor parceiro" por taxa de vitória fica adiada** — como as duplas rotacionam a cada rodada (forte joga com fraco etc.), a taxa de vitória isolada não é justa agora. Quando implementada, exigirá amostra mínima e normalização. Ver [BACKLOG.md](./BACKLOG.md).

## 11. Perfis e acesso
- **BR-37** ADMIN: tudo. ORGANIZER: gerencia campeonatos/rodadas/resultados. PLAYER: vê seus dados e se inscreve. VIEWER: leitura pública.

---

### Pendências da Fase 0 — status

| # | Pendência | Resolução |
|---|---|---|
| 1 | Tamanho de grupo | Dinâmico, preferencial 3; matriz completa em FORMATS.md (BR-23) |
| 2 | Formato de partida | Padrão 1 set, configurável (BR-26) |
| 3 | W.O. | Exceção; substituição/lesão; não penaliza aproveitamento (BR-27) |
| 4 | Ordem de desempate | Pontos → saldo games → confronto direto → sorteio (BR-29) |
| 5 | Formato da final | Pós-última rodada, por pontos acumulados, novo sorteio sem histórico, grupos + mata-mata (BR-34) |
| 6 | Lista de espera | Manual (BR-10) |
| 7 | Config após ATIVO | Bloquear estrutural, liberar sorteio (BR-05) |
| 8 | "Melhor parceiro" | Adiado; manter "parceiro favorito" por frequência (BR-36) |

**Todas as pendências de regra de negócio da Fase 0 estão resolvidas.** Único ponto a reavaliar na prática: chave de 16 em campos muito grandes (G=9/10), sem impacto no design atual.
