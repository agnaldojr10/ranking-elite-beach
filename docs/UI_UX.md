# UI_UX.md — Telas e Wireframes (texto)

> Fase 0. Wireframes em texto das telas principais. Mobile-first, PWA, dark/light.
> Para cada tela: objetivo, componentes, fluxo, estados (loading/empty/erro).

---

## Princípios de UX
- Mobile-first (organizador opera à beira da quadra pelo celular).
- Ações primárias sempre visíveis; confirmações destrutivas com diálogo.
- Todos os estados cobertos: **loading** (skeleton), **empty** (call-to-action), **erro** (mensagem + retry).
- Feedback imediato no sorteio (score e explicações visíveis).

---

## 1. Dashboard
**Objetivo:** visão geral do campeonato ativo.
```
┌───────────────────────────────────────────┐
│ Ranking Elite Beach            [perfil ▾]  │
├───────────────────────────────────────────┤
│ [Próxima Rodada]   [Jogadores Ativos: 24] │
│  Qui 09/07 19h      [Aproveitamento médio] │
├───────────────────────────────────────────┤
│ TOP RANKING            │ ÚLTIMOS RESULTADOS │
│ 1. João    320         │ Dupla X 2x0 Dupla Y│
│ 2. Carlos  290         │ ...                │
│ [gráfico de evolução]  │                    │
└───────────────────────────────────────────┘
```
Componentes: KPI cards, tabela top-5 ranking, lista de resultados, gráfico (Recharts).
Estados: empty ("Nenhum campeonato ativo — criar"); loading skeleton dos cards.

## 2. Jogadores (lista + cadastro)
**Objetivo:** gerir jogadores.
```
[Buscar...] [Nível ▾] [Status ▾]        [+ Novo Jogador]
┌ foto │ Nome        │ Idade │ Nível  │ Ranking │ Status ┐
│  ◯   │ João Silva  │  34   │ Avanç. │  320    │ Ativo  │
```
Cadastro (modal/drawer): foto (upload), nome, nascimento, telefone, nível, status.
Validações: nome obrigatório, data válida. Empty: "Nenhum jogador — cadastre o primeiro".

## 3. Campeonato — configuração
**Objetivo:** criar/editar campeonato.
Abas: **Geral** (nome, temporada, nº rodadas, classificados), **Pontuação** (tabela editável por colocação), **Desempate** (ordenar critérios drag-and-drop), **Sorteio** (sliders de pesos + aleatoriedade), **Final**.
Estado: campos bloqueados se status ≠ DRAFT (BR-05) com aviso.

## 4. Rodada — inscrições
```
Rodada 5 · Qui 09/07     Status: ABERTA
Confirmados: 22 (par ✓)   [Iniciar Sorteio →]
┌ Jogador     │ Status      │ Ação        ┐
│ João        │ Confirmado  │ [Ausente]   │
│ Maria       │ Pendente    │ [Confirmar] │
│ ...         │ Lista espera│ [Promover]  │
```
Indicador claro de paridade; botão "Iniciar Sorteio" desabilitado se ímpar/fora de [8,64] com tooltip do motivo.

## 5. Sorteio — simulação (tela-chave)
**Objetivo:** gerar, avaliar e confirmar o sorteio.
```
┌ CONFIG ─────────────┐ ┌ RESULTADO ───────────────────┐
│ Peso ranking [====] │ │ Score de Qualidade:   96% ★   │
│ Peso nível   [==  ] │ │ Parceiros repetidos:  0       │
│ Hist parceiro[====] │ │ Adversários repet.:   2       │
│ Aleatoried.  [== ]  │ │ Diversidade duplas:   100%    │
│ [ ] repetir parceiro│ ├───────────────────────────────┤
│ [Gerar Simulação]   │ │ GRUPO A   │ GRUPO B           │
└─────────────────────┘ │ João+Lucas│ Carlos+Ana        │
                        │ ...       │ ...               │
                        ├───────────────────────────────┤
                        │ ▸ Por que estas duplas? (log)  │
                        │ "Pedro pareado com Lucas p/    │
                        │  equilibrar ranking (300+120)" │
                        └───────────────────────────────┘
   [Gerar nova simulação]        [Confirmar Sorteio ✓]
```
Estados: loading durante cálculo (spinner + "otimizando..."); erro de validação bloqueia geração; confirmação pede diálogo.

## 6. Jogos — registro de resultado
```
GRUPO A                          Quadra 2 · 19h
João+Lucas   [6][6]   x   [4][2]   Carlos+Ana
              set1 set2      set1 set2
[Salvar Resultado]
```
Validação: vencedor coerente com sets; edição gera auditoria.

## 7. Ranking
Filtros: escopo (Geral/Temporada/Histórico), campeonato. Tabela ordenável + destaque de evolução (▲▼).

## 8. Perfil do jogador
Cabeçalho (foto, nome, idade, nível, ranking). Cards de stats (sequências, parceiro favorito/melhor, adversário mais enfrentado, títulos). Histórico de rodadas + gráfico de evolução.

## 9. Agenda
Calendário mensal com rodadas/finais/eventos/treinos; clique abre detalhe.

## 10. Componentes compartilhados
Botões, inputs, tabela, modal/drawer, badge de status, KPI card, slider, empty-state, toast. Base: shadcn/ui + Tailwind. Acessibilidade AA (contraste, foco, teclado).
