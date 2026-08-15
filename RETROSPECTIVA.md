# Retrospectiva & Pivô — Ranking Elite Beach

> Documento de encerramento do app atual e base de aprendizados para o **novo app: PWA focado exclusivamente no ranking**.
> Data: 2026-08-14 · Status do app atual: **congelado** (em produção desde 2026-07-07, mantido como referência).

---

## 1. O que este produto virou (e por que pivotamos)

O objetivo era um **ranking de Beach Tennis**. Ao longo das fases, o produto cresceu para uma **plataforma completa de operação de torneio**: sorteio inteligente de duplas, mata-mata flexível, gestão de rodadas, backoffice da organização + portal do jogador, push, convites, etc.

Depois de rodar em produção, a conclusão do PO foi: **esse não é o produto final**. O valor central — o **ranking** — ficou soterrado por funcionalidades operacionais caras de manter e que não são o coração do que os jogadores querem ver.

**Decisão:** encerrar este app e **reiniciar do zero** um produto enxuto, **PWA, focado só no ranking**.

---

## 2. O que funcionou bem (levar para o novo)

- **Contratos Zod compartilhados** (`packages/contracts`): tipos + validação ponta a ponta (API ↔ front). Um dos maiores acertos — segurança de tipo real e uma só fonte de verdade para schemas. **Manter.**
- **Prisma + Postgres (Neon)**: modelagem limpa, migrations versionadas. **Manter.**
- **Deploy custo-zero**: Vercel (frontends) + Render (API) + Neon (banco). Auto-deploy no merge para `main`. Funcionou bem para o porte do projeto. **Manter a filosofia** (ver ressalvas em §4).
- **Design system Bento "Praiano moderno"**: linguagem visual coesa (tokens, tema claro/escuro, primitivos em `components/ui/`). Boa base estética. **Reaproveitar tokens e primitivos.**
- **Ranking com evolução por rodada**: a visualização de progressão foi bem recebida — é justamente o núcleo do novo produto.

## 3. O que pesou (cortar ou repensar)

- **Motor de sorteio (`packages/sort-engine`)**: greedy + 2-opt, complementaridade, penalidade de parceiro repetido, aleatoriedade. Muito esforço de engenharia num recurso **operacional**, não de ranking. Fonte recorrente de dor:
  - Histórico de parceria/adversário **corrompia** com correções manuais no banco → duplas repetidas.
  - "Força" baseada em nível técnico **não equilibrava** (uniforme quando todos têm o mesmo nível) — só corrigido no fim usando pontuação do ranking.
  - **Aprendizado:** sorteio/operação de torneio **não entra** no novo escopo. Se um dia voltar, é módulo opcional, desacoplado do ranking.
- **Mata-mata flexível + anti-revanche + edição de dupla pós-sorteio**: complexidade alta (formatos de 12/18, byes, semifinal cruzada) para ganho marginal. **Fora do escopo do novo app.**
- **Dois frontends (backoffice `apps/web` + portal `apps/portal`)**: esforço duplicado, duas superfícies para manter. **Consolidar em um só app** no novo produto.
- **API NestJS separada + 2 fronts + monorepo Turborepo**: arquitetura robusta, porém **pesada** para o valor entregue. Avaliar algo mais enxuto (ver §5).

## 4. Aprendizados de infra/deploy

- **Render não roda migrations automaticamente** — precisa passo manual/deploy hook. Definir isso desde o início no novo app.
- **Build Docker no Render ~7 min** — feedback lento. Considerar runtime nativo (Node) em vez de Docker, ou plataforma com build mais rápido.
- **GitHub Actions em repo privado tem quota mensal** (2000 min) que estourou e travou o CI. Vercel/Render são integrações separadas e não foram afetadas. **Decisão:** repo do novo app **público** desde o início (ou CI que não dependa de Actions).
- **Segredos**: `.env.production` fora do git + dashboards (Render/Vercel). Manteve tudo seguro. **Manter a disciplina.**
- **Scripts temporários de banco** (`packages/db/_*.mjs`): úteis para correções pontuais, mas **nunca commitados** e sempre deletados. Padrão bom — no novo app, formalizar em `scripts/` versionados quando forem reutilizáveis.

## 5. Diretrizes para o novo app (PWA de ranking)

> A confirmar/refinar quando o PO passar as "novas coordenadas".

- **PWA-first**: instalável, offline-friendly no que der, foco em mobile.
- **Escopo enxuto centrado no ranking**: tabela de ranking, evolução por rodada/temporada, perfil do jogador, histórico. Entrada de resultados **simplificada** (sem motor de sorteio).
- **Arquitetura candidata**: um único **Next.js (App Router)** full-stack — Server Actions/Route Handlers no lugar da API NestJS separada — reduz superfície e mantém o que funcionou (Zod, Prisma, Neon, design system). Reavaliar quando o escopo estiver fechado.
- **Reaproveitar**: `packages/contracts` (schemas de domínio que sobrevivem), tokens/primitivos do design system, modelagem Prisma essencial (jogador, temporada, pontuação).
- **Deixar para trás**: sort-engine, mata-mata, backoffice separado, operação de rodada complexa.
- **Projeto comercial de ranking feminino**: provavelmente **se funde** nesta nova visão — confirmar com o PO.

---

## 6. Estado de encerramento

- Repositório limpo: só `main`; branches de PRs mergeados podadas; working tree limpo.
- Últimos resultados **já registrados** em produção.
- App permanece no ar como referência funcional e fonte de dados históricos.