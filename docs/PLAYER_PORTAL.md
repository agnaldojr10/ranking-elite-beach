# PLAYER_PORTAL.md — Portal do Jogador (Fase 12)

> App **imersivo e separado** para o atleta (`apps/portal`, "Meu Beach"). Objetivo de produto: o jogador **querer abrir o app** para ver seus números — engajamento, não só consulta. Visão completa na memória do projeto.

## Arquitetura

- App Next.js 14 próprio (`apps/portal`, porta 3001), **separado** do backoffice (`apps/web`). Reusa `@reb/contracts` e a mesma API. **BFF próprio** (cookies `reb_p_access`/`reb_p_refresh`), domínio/subdomínio próprio.
- **Somente papel PLAYER**: o `middleware` protege as rotas; o backend fecha as leituras de backoffice para PLAYER (o atleta usa só `/me/*`).
- Banco/segurança compartilhados com a API (Fase 11): JWT, rate-limit, CORS, filtro de erros.

## Acesso por convite (claim)

1. Admin/organizer: `POST /players/:id/invite` → gera um **código de uso único** (hash SHA-256 no banco, expiração configurável por `INVITE_TTL_DAYS`, default 14 dias). O código em claro aparece **só** nessa resposta.
2. Atleta: em `/claim`, informa **código + e-mail + senha** → cria o login **PLAYER** vinculado ao `Player` (um login por atleta, `User.playerId` único) e entra.
3. Depois, login normal por e-mail/senha em `/login`.

## Telas (fatia 1)

- **Home** (`/`): cartão-herói do atleta (foto, nível, posição no ranking, aproveitamento), **próximo jogo com contagem regressiva** (adversário/quadra/horário), KPIs (jogos, vitórias, títulos, sequência).
- **Perfil** (`/perfil`): números completos (campeonatos, rodadas, V/D, aproveitamento, pontos, títulos, finais, melhor sequência/colocação, parceiro favorito, maior rival).
- **Jogos** (`/jogos`): agenda (a jogar) + histórico (com resultado e placar).
- Login/Claim, boundaries, **PWA** dedicado (manifest/SW/offline/ícones próprios).

## Design (skin imersiva)

- **Dark-first**, identidade praiana (oceano/coral) com gradientes full-bleed, tipografia grande, `tabular-nums` nos números, micro-animações respeitando `prefers-reduced-motion`.
- Tokens próprios em `apps/portal/src/app/globals.css` + `tailwind.config.ts` (paleta distinta do backoffice). Primitivos próprios em `apps/portal/src/components/ui/` (shell com **bottom-nav**, `PlayerHeroCard`, `NextMatchCard`+`Countdown`, `StatTile`, `RankDelta`, `Avatar`). Alvos ≥44px, foco visível.

## Endpoints consumidos

`/auth/claim`, `/auth/login`, `/auth/me`, `/me/profile`, `/me/stats`, `/me/ranking`, `/me/matches`, `/me/next-match`. Ver [API.md §2.1](./API.md).

## Deploy

`apps/portal/Dockerfile` (Next standalone, `node:20-slim`); serviço `portal` no `docker-compose.prod.yml` (porta 3001); CI valida o build da imagem. Servir em subdomínio próprio com HTTPS (cookies `secure`). Ver [DEPLOY.md](./DEPLOY.md).

## Próximas fatias (roadmap do épico)

Meus Torneios (chave/grupos/agenda), **H2H** (head-to-head), **gamificação** (streaks/medalhas/"melhor do mês", cartão compartilhável), **push** (PWA: "seu jogo começa", resultado lançado, mudança de horário).
