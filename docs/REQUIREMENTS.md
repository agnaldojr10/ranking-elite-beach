# REQUIREMENTS.md — Requisitos Funcionais e Não Funcionais

> Fase 0. Cada requisito tem ID para rastreabilidade com casos de uso e testes.

---

## 1. Requisitos Funcionais (RF)

### Jogadores
- **RF-01** Cadastrar jogador: nome, foto, data de nascimento, telefone (opcional), nível técnico, status.
- **RF-02** Calcular idade automaticamente a partir da data de nascimento.
- **RF-03** Editar, inativar/reativar jogador (sem exclusão física — soft delete).
- **RF-04** Listar/filtrar/buscar jogadores por nome, status e nível.
- **RF-05** Exibir perfil com histórico, ranking, participações, vitórias, derrotas, aproveitamento e estatísticas.

### Temporadas
- **RF-06** Criar múltiplas temporadas (ex.: 2026, 2027) e manter todo o histórico.
- **RF-07** Ranking em três recortes: geral, por temporada e histórico.

### Campeonatos
- **RF-08** Criar campeonato configurando: nº de rodadas, nº de classificados, sistema de pontuação, critérios de desempate, regras de sorteio, regras de ranking, datas das rodadas e configuração da final.
- **RF-09** Vincular campeonato a uma temporada.
- **RF-10** Editar configurações enquanto o campeonato não iniciou (regras de bloqueio em BUSINESS_RULES).

### Inscrições / Rodadas
- **RF-11** Cada rodada possui lista de inscritos com status: Confirmado, Pendente, Ausente, Lista de espera.
- **RF-12** Validar inscritos: mínimo 8, máximo 64, quantidade **par**.
- **RF-13** Confirmação de presença e gestão de lista de espera.
- **RF-14** Bloquear início do sorteio se o nº de confirmados for ímpar ou inválido.

### Motor de Sorteio
- **RF-15** Gerar duplas evitando repetir parceiros e adversários, balanceando ranking e nível.
- **RF-16** Configurar pesos (ranking, nível, histórico parceiros, histórico adversários) e grau de aleatoriedade (0–100%).
- **RF-17** Gerar **simulação** sem salvar; permitir regenerar.
- **RF-18** Calcular **score de qualidade** do sorteio com métricas detalhadas.
- **RF-19** **Explicar** as decisões do sorteio em linguagem natural.
- **RF-20** Confirmar a simulação, persistindo duplas, grupos e jogos.

### Grupos e Jogos
- **RF-21** Formar grupos automaticamente (todos contra todos dentro do grupo).
- **RF-22** Registrar jogo: dupla A, dupla B, sets, games, vencedor, quadra, horário.
- **RF-23** Editar/corrigir resultado com trilha de auditoria.

### Classificação, Pontuação e Ranking
- **RF-24** Calcular classificação do grupo (vitórias, derrotas, saldo) aplicando critérios de desempate configuráveis.
- **RF-25** Atribuir pontos por colocação segundo tabela configurável (nunca fixa no código).
- **RF-26** Atualizar ranking do jogador (pontos, posição, rodadas, V/D, aproveitamento, evolução).

### Estatísticas e Dashboards
- **RF-27** ✅ Estatísticas por jogador: maior sequência de vitórias/derrotas, parceiro favorito (por frequência), adversário mais enfrentado, taxa de vitória, média de pontos, melhor/pior colocação, participações, finais, títulos. *(Sprint 8; "melhor parceiro" por taxa de vitória adiado — BR-36/BACKLOG.)*
- **RF-28** ✅ Dashboard: KPIs (jogadores ativos, temporadas, campeonatos, rodadas), próxima rodada, últimos resultados, top do ranking (gráfico) e evolução por rodada na tela de ranking. *(Sprint 8)*

### Quadras e Agenda
- **RF-29** ✅ Cadastrar quadras (nome, número, local, disponibilidade) e vincular jogos a quadras. *(Fase 9)*
- **RF-30** ✅ Agenda/calendário com rodadas, finais, eventos e treinos. *(Fase 9 — rodadas/finais derivadas + eventos/treinos manuais)*

### Fase Final
- **RF-31** ✅ Classificar N duplas/jogadores para a final conforme configuração e gerar o chaveamento. *(Fase 10)*

### Administração / Notificações
- **RF-32** Gestão de usuários e papéis (Admin, Organizador, Jogador, Visitante).
- **RF-33** Arquitetura de eventos preparada para futuras notificações (WhatsApp, e-mail, push) — sem envio real no MVP.

## 2. Requisitos Não Funcionais (RNF)

- **RNF-01 Performance:** sorteio de até 64 jogadores deve retornar simulação em < 2s (P95).
- **RNF-02 Escalabilidade:** suportar milhares de jogadores e vários campeonatos simultâneos por temporada; schema multi-tenant-ready.
- **RNF-03 Manutenibilidade:** Clean Architecture, SOLID, DDD onde fizer sentido, cobertura de testes no domínio do sorteio/ranking ≥ 85%.
- **RNF-04 Segurança:** JWT, hashing Argon2, RBAC, validação de entrada (zod/class-validator), proteção OWASP Top 10.
- **RNF-05 Confiabilidade:** determinismo do sorteio via seed; auditoria de alterações de resultado.
- **RNF-06 UX:** responsivo (mobile-first), PWA, estados de loading/empty/erro em todas as telas, acessibilidade AA.
- **RNF-07 Observabilidade:** logs estruturados (Pino), rastreio de erros (Sentry).
- **RNF-08 Portabilidade:** deploy em nuvem gerenciada, containerizável (Docker) para dev.
- **RNF-09 Configurabilidade:** pontuação, pesos, critérios de desempate e regras sempre parametrizáveis (sem hardcode).
- **RNF-10 Internacionalização:** textos preparados para i18n (pt-BR inicial).
