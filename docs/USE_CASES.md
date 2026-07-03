# USE_CASES.md — Casos de Uso e Fluxos

> Fase 0. Atores e casos de uso principais, com fluxos.

---

## 1. Atores
- **Organizador/Admin** — configura e opera o campeonato.
- **Jogador** — consulta seus dados, se inscreve, confirma presença.
- **Visitante** — consulta ranking/resultados públicos.
- **Sistema** — cálculos automáticos (idade, classificação, ranking, stats).

## 2. Casos de uso principais

| ID | Caso de uso | Ator | Resumo |
|---|---|---|---|
| UC-01 | Cadastrar jogador | Organizador | Cria/edita jogador com dados e nível |
| UC-02 | Criar temporada/campeonato | Organizador | Define rodadas, classificados e regras |
| UC-03 | Abrir rodada e gerir inscrições | Organizador | Confirma presença, lista de espera |
| UC-04 | Simular sorteio | Organizador | Gera duplas/grupos/jogos + score + explicação, sem salvar |
| UC-05 | Confirmar sorteio | Organizador | Persiste o resultado da simulação aprovada |
| UC-06 | Registrar resultado | Organizador | Lança sets/games; sistema atualiza classificação |
| UC-07 | Consultar ranking/estatísticas | Todos | Visualiza rankings e stats |
| UC-08 | Gerar fase final | Organizador | Classifica N e monta chaveamento |
| UC-09 | Gerir quadras e agenda | Organizador | Cadastra quadras, calendário |

## 3. Fluxo — UC-04/05 Sorteio (feliz)
```mermaid
flowchart TD
    A[Rodada OPEN] --> B{Confirmados par e 8-64?}
    B -- Não --> X[Bloqueia sorteio - mostra motivo]
    B -- Sim --> C[Configura pesos e aleatoriedade]
    C --> D[Gerar simulação]
    D --> E[Exibe duplas, grupos, jogos, score, explicações]
    E --> F{Organizador aprova?}
    F -- Não --> D
    F -- Sim --> G[Confirmar: persiste + atualiza históricos]
    G --> H[Rodada DRAWN]
```

## 4. Fluxo — UC-06 Resultado → Ranking
```mermaid
flowchart TD
    A[Jogo PENDING] --> B[Lança sets/games]
    B --> C{Placar válido?}
    C -- Não --> B
    C -- Sim --> D[Define vencedor]
    D --> E[Recalcula classificação do grupo]
    E --> F[Atualiza pontos por colocação - scoring_table]
    F --> G[Atualiza ranking e estatísticas via evento]
```

## 5. Fluxo — UC-03 Inscrição/Presença
```mermaid
flowchart TD
    A[Jogador se inscreve] --> B[PENDING]
    B --> C{Confirma presença?}
    C -- Sim --> D[CONFIRMED]
    C -- Não/expira --> E[ABSENT]
    F[Vagas cheias] --> G[WAITLIST]
    D -->|desiste| E
    E -->|abre vaga| G
```

## 6. Fluxo — UC-08 Fase Final
```mermaid
flowchart TD
    A[Rodadas finalizadas] --> B[Ordena ranking do campeonato]
    B --> C[Seleciona N classificados]
    C --> D[Monta chaveamento conforme final_config]
    D --> E[Registra jogos da final]
    E --> F[Define campeão]
```
