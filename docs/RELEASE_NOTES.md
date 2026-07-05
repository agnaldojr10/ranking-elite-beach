# RELEASE_NOTES.md

> Uma nota por módulo/fase finalizada.

---

## v0.19.0 — Portal do Jogador: Meus Torneios, Rivais e Conquistas (2026-07-05)

**Novidades**
- **Meus Torneios:** o atleta vê os campeonatos que joga, com sua **posição, pontos e selo de campeão**; no detalhe, por rodada, o **seu grupo** (classificação com sua dupla em destaque), a **sua chave** do mata-mata e a **sua colocação**.
- **Rivais (H2H):** retrospecto direto contra cada adversário — **vitórias × derrotas** e os últimos confrontos.
- **Conquistas:** medalhas no Perfil (campeão, finalista, pódio, sequência, veterano…), com níveis bronze/prata/ouro; as ainda não conquistadas aparecem esmaecidas como metas.

**Melhorias**
- Correção do rótulo de rodada nos jogos de fase de grupos.

**Pendências**
- QA do PO. Última etapa do portal: **notificações push**.

---

## v0.18.0 — Portal do Jogador: primeira versão (2026-07-04)

**Novidades**
- Nasce o **Meu Beach**, o app do atleta — separado do sistema da organização, com visual **imersivo** (dark, praiano) e instalável (PWA).
- **Ativação por convite:** a organização gera um código; o jogador ativa a conta (e-mail + senha) e passa a ver **só os dados dele**.
- **Home** com destaque do atleta, **próximo jogo com contagem regressiva** (adversário, quadra, horário), seus números e a **posição no ranking** (com indicador de subida/queda).
- **Perfil** com números completos (vitórias, aproveitamento, títulos, sequências, parceiro favorito, maior rival) e **Meus jogos** (agenda + histórico).

**Segurança**
- O atleta acessa apenas as suas informações; as telas administrativas ficam restritas à organização.

**Pendências**
- QA do PO. A publicação/hospedagem do portal (subdomínio próprio) é da operação.

**Próximos passos**
- Meus Torneios (chave/grupos), comparação direta (H2H), gamificação (medalhas/sequências) e notificações push.

---

## v0.17.0 — Fase 11: Pronto para produção (Docker + guia de deploy) (2026-07-04)

**Novidades**
- **Imagens Docker** da API e da Web, reproduzíveis, prontas para rodar em qualquer servidor de containers.
- **Orquestração** (`docker-compose.prod.yml`) sobe API + Web com um comando, usando o **Neon** como banco (na nuvem).
- **Guia de deploy** (`docs/DEPLOY.md`): passo a passo com Neon, variáveis de ambiente, migrations, subida, HTTPS e rollback.

**Melhorias**
- CI passa a **conferir a construção das imagens** a cada mudança (garante que o empacotamento continua funcionando).

**Pendências**
- QA do PO. A publicação das imagens e o provisionamento do servidor/domínio são da operação.

**Próximos passos**
- Com a aprovação, a **Fase 11 se encerra**. Próximo grande passo: o **Portal do jogador**.

---

## v0.16.0 — Fase 11: API mais segura (hardening) (2026-07-04)

**Novidades**
- **Proteção contra tentativas em massa (rate-limit):** o sistema limita quantas requisições um mesmo endereço pode fazer; no login/renovação o limite é mais rígido (anti "força-bruta"). Ao exceder, retorna "muitas requisições, tente novamente em instantes".
- **Cabeçalhos de segurança (Helmet):** o navegador passa a receber proteções extras (contra sniffing de conteúdo, clickjacking, etc.).
- **Mensagens de erro consistentes:** qualquer falha responde sempre no mesmo formato; erros inesperados não expõem detalhes internos ao usuário (a causa fica registrada só no servidor).

**Melhorias**
- CORS restrito à origem da aplicação web; preparo para rodar atrás de proxy (deploy) reconhecendo o IP real.

**Pendências**
- QA do PO (roteiro de testes de hardening).
- Deploy (Dockerfiles + guia) fecha a Fase 11.

**Próximos passos**
- Após aprovação, seguir para o deploy.

---

## v0.15.0 — Nova cara do app: visual "Praiano moderno" + tema escuro (2026-07-04)

**Novidades**
- Redesenho no estilo **Bento** inspirado em apps da Apple: cartões arredondados, mais respiro e hierarquia clara.
- **Tema claro e escuro**, com botão para alternar (lembra sua preferência).
- Login, Painel e a tela de Rodada já com o novo visual, pensados para o celular.
- Painel repaginado: indicadores, próxima rodada, últimos campeões, top do ranking e atalhos com ícones.

**Melhorias**
- Identidade de Beach Tennis (oceano/areia) num acabamento mais sofisticado.
- Base de design reutilizável para deixar o app inteiro consistente.

**Pendências**
- As demais telas serão migradas para o novo visual nas próximas entregas (claro + escuro).
- QA visual (celular e desktop, nos dois temas).

**Próximos passos**
- Aplicar o novo estilo às telas restantes; depois retomar hardening/deploy da Fase 11.

---

## v0.14.0 — Fase 11: App instalável (PWA) + polimento mobile (2026-07-04)

**Novidades**
- O sistema agora é um **app instalável** no celular e no computador (PWA), com ícone próprio e tela offline.
- Experiência **mobile-first**: telas se ajustam ao celular, tabelas rolam lateralmente, campos não dão zoom indesejado no iOS.
- Telas amigáveis de **carregando**, **erro** e **página não encontrada**.
- **Guia do administrador** ("Como funciona") com o passo a passo completo — do cadastro ao campeão — para treinar novos administradores.

**Melhorias**
- Atalho de ajuda no painel; navegação mais confortável no toque.

**Pendências**
- Reforço de segurança da API (hardening) e preparação de deploy entram nas próximas fatias.
- QA do PO conforme roteiro (QA-P1 em diante).

**Próximos passos**
- Fase 11 (fatia B) — Hardening da API; (fatia C) — Deploy (Dockerfiles + guia).

---

## v0.13.0 — Fase 10: Fase Final do campeonato (2026-07-03)

**Novidades**
- "Gerar fase final": classifica automaticamente os melhores jogadores por pontuação acumulada e monta a fase final.
- Novo sorteio da final ignora o histórico — as duplas podem repetir parcerias já formadas na temporada.
- A final é jogada como uma rodada (grupos + mata-mata) e coroa o campeão do campeonato, exibido no campeonato.

**Melhorias**
- O ranking do campeonato continua refletindo a "temporada regular": os pontos da fase final não alteram o ranking acumulado.

**Pendências**
- QA do PO conforme roteiro (QA-F1 em diante). Sem migration.

**Próximos passos**
- Fase 11 — Polimento, PWA, hardening e deploy (última fase).

---

## v0.12.0 — Fase 9: Quadras e Agenda (2026-07-03)

**Novidades**
- Cadastro de quadras (nome, número, local) e vínculo de quadra + horário a cada jogo.
- Agenda mensal com rodadas e finais (pelas datas das rodadas) e criação de treinos/eventos manuais.
- Excluir uma quadra desvincula os jogos automaticamente, sem apagá-los.

**Melhorias**
- Atalhos de Quadras e Agenda no dashboard.
- Proteção de sessão estendida às telas de rodadas, quadras e agenda.

**Pendências**
- Editor de disponibilidade da quadra (janelas por dia) ficou como base de dados; UI detalhada é futura.
- QA do PO conforme roteiro (QA-V1 em diante). Requer a migration `venues_calendar`.

**Próximos passos**
- Fase 10 — Fase Final do campeonato; Fase 11 — Polimento, PWA e deploy.

---

## v0.11.0 — Sprint 8: Estatísticas e Dashboard (2026-07-03)

**Novidades**
- Estatísticas completas no perfil do jogador: pontos, aproveitamento, média, melhor/pior colocação, títulos, finais, maiores sequências de vitórias/derrotas, parceiro favorito e adversário mais enfrentado.
- Dashboard com indicadores (jogadores ativos, temporadas, campeonatos, rodadas), próxima rodada, últimos campeões e top do ranking em gráfico.
- Gráfico de evolução dos pontos por rodada na tela de ranking.

**Melhorias**
- Gráficos leves em SVG (sem dependências novas), com legenda e tabela de apoio.
- W.O. por lesão continua não penalizando o aproveitamento do atleta.

**Pendências**
- "Melhor parceiro" por taxa de vitória segue no backlog (BR-36).
- QA do PO conforme roteiro (QA-S1 em diante).

**Próximos passos**
- Fase 9 — Quadras e Agenda; Fase 10 — Fase Final do campeonato; Fase 11 — Polimento, PWA e deploy.

---

## v0.10.0 — Sprint 7: Ranking e pontuação (2026-07-03)

**Novidades**
- Ranking de jogadores somando os pontos das rodadas, em três recortes: Campeonato, Temporada e Geral.
- Cada jogador vê pontos, nº de rodadas, vitórias/derrotas, saldo de games e aproveitamento (%).
- Desempate por saldo de games e aproveitamento quando os pontos empatam.
- W.O. por lesão não derruba o aproveitamento do atleta lesionado.
- Evolução: pontos acumulados rodada a rodada dentro do campeonato.

**Melhorias**
- Ranking calculado na hora a partir dos resultados já gravados (sem etapa extra de fechamento).

**Pendências**
- Gráficos e página de estatísticas do jogador entram na Sprint 8 (Dashboard).
- QA do PO conforme roteiro (QA-RK1 em diante).

**Próximos passos**
- Sprint 8 — Estatísticas e Dashboard.

---

## v0.9.0 — Sprint 6: Mata-mata da rodada + colocação (2026-07-03)

**Novidades**
- Geração automática do mata-mata da rodada a partir dos classificados dos grupos (conforme o formato).
- Chave jogada fase a fase (oitavas/quartas/semi/final) com lançamento de placar em cada jogo.
- Disputa de 3º lugar quando há semifinal.
- Ao terminar, a rodada é encerrada com a colocação final (1º ao último) e os pontos de cada dupla pela tabela de pontuação do campeonato.

**Melhorias**
- Reaproveita o lançamento de placar da fase de grupos (mesma tela/regra de vencedor e W.O.).
- Bloqueios de segurança: só gera o mata-mata com a fase de grupos concluída, e não gera duas vezes.

**Pendências**
- Ranking do campeonato/temporada (soma de pontos, desempates, evolução) entra na Sprint 7.
- QA do PO conforme roteiro (QA-K1 em diante). Requer a migration `knockout_placement`.

**Próximos passos**
- Sprint 7 — Classificação, Pontuação e Ranking.

---

## v0.8.0 — Sprint 6: Jogos e Resultados — fase de grupos (2026-07-03)

**Novidades**
- Lançar o placar de cada jogo dos grupos (por sets), com o vencedor calculado automaticamente a partir do placar.
- Registrar W.O. (com opção "por lesão") aplicando o placar padrão do formato.
- Classificação de cada grupo em tempo real, com desempate por vitórias → saldo de games → confronto direto.
- Correção de resultado registrada em auditoria (quem alterou, quando, de/para).

**Melhorias**
- Tela de resultados por grupo, integrada à rodada e ao sorteio confirmado.
- A rodada passa a "Em andamento" ao receber o primeiro resultado.

**Pendências**
- Mata-mata da rodada (semis/final), colocação final e pontos vêm na próxima fatia (junto da Sprint 7 de ranking).
- QA do PO conforme roteiro (QA-M1 em diante). Requer a migration `match_results`.

**Próximos passos**
- Fatia seguinte: chaveamento intra-rodada + pontuação/ranking (Sprint 7).

---

## v0.7.0 — Sprint 5: Confirmar sorteio + histórico (2026-07-03)

**Novidades**
- Confirmar o sorteio de uma rodada: grava as duplas, os grupos e os jogos, e a rodada passa a "Sorteada".
- "Ver sorteio" mostra o resultado confirmado com a nota de qualidade, as métricas e as explicações.
- "Descartar sorteio": desfaz o sorteio, reabre as inscrições e reverte o histórico.
- O motor agora **aprende com o passado**: as próximas rodadas evitam repetir parceiros e adversários das rodadas já confirmadas.

**Melhorias**
- Gravação transacional e auditável (guarda a seed, a configuração usada, o score e as explicações).
- Um sorteio confirmado por rodada; para refazer, é preciso descartar o anterior (evita troca acidental).

**Pendências**
- Registro dos resultados dos jogos entra na Sprint 6.
- QA do PO conforme roteiro (QA-DC1 em diante). Requer a migration `draw_persistence`.

**Próximos passos**
- Concluída esta fatia, a Sprint 5 fica completa; em seguida, Sprint 6 (Jogos/Resultados).

---

## v0.6.0 — Sprint 5: Motor de Sorteio — simulação (2026-07-03)

**Novidades**
- Motor Inteligente de Sorteio: forma as melhores duplas possíveis equilibrando força e nível, distribui em grupos balanceados e monta os confrontos (todos contra todos) — em vez de simplesmente embaralhar.
- Tela de simulação da rodada: mostra as duplas, os grupos, os jogos, uma nota de qualidade (0–100), métricas (parceiros/adversários repetidos, diversidade, equilíbrio) e explicações em linguagem natural de "por que este sorteio".
- Controle de aleatoriedade (0 = totalmente aleatório · 100 = máximo equilíbrio) e botão "Regenerar" (cada simulação usa uma nova seed).
- A simulação não grava nada; é para conferência antes de confirmar.

**Melhorias**
- Sorteio determinístico e reprodutível (mesma seed ⇒ mesmo resultado), com cobertura de testes para 8 a 64 jogadores.
- Validação de prontidão aplicada de fato ao sortear (nº par entre 8 e 64).

**Pendências**
- "Confirmar sorteio" (gravar o resultado e alimentar o histórico de parceiros/adversários) entra na próxima fatia.
- A força do jogador usa o nível técnico como referência até o ranking existir (Sprint 7).
- QA do PO conforme roteiro (QA-D1 em diante).

**Próximos passos**
- Fatia seguinte da Sprint 5: confirmar sorteio + persistência; depois Sprint 6 (Jogos/Resultados).

---

## v0.5.0 — Sprint 4: Rodadas e Inscrições (2026-07-03)

**Novidades**
- Rodadas dentro do campeonato: número, data, tipo (regular/fase final), preferência de tamanho de grupo e formato de partida (padrão 1 set).
- Inscrições por rodada com situações: Confirmado, Pendente, Ausente e Lista de espera.
- Abertura e fechamento das inscrições da rodada.
- Lista de espera promovida manualmente e substituição de atleta (lesão/desistência), registrando quem assumiu a vaga.
- Banner de prontidão para o sorteio: valida nº par de confirmados entre 8 e 64.
- Prévia do formato da rodada (grupos e chave) derivada dos confirmados, conforme a matriz oficial.

**Melhorias**
- Escopo por clube e RBAC (Admin/Organizador gerenciam) em todas as operações.
- Jogador inativo não pode ser inscrito; inscrição duplicada é bloqueada.

**Pendências**
- QA do PO conforme roteiro (QA-R1 em diante).

**Próximos passos**
- Sprint 5 — Motor de Sorteio (simulação, score e explicabilidade), que consumirá os confirmados da rodada.

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
