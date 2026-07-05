# DEPLOY.md — Guia de Deploy (produção)

> Fase 11 (fatia C). Empacotamento em **Docker** rodando em qualquer VM/host de containers, com banco **Neon** (Postgres gerenciado, externo). O provisionamento real (VM, domínio, TLS, registry) é do responsável pela operação. Alternativa em PaaS no fim do documento.

## Topologia

```
[ organização ] --HTTPS--> web    (Next BFF :3000) ┐
                                                    ├─HTTP--> api (NestJS :3333) --SSL--> Neon (Postgres)
[ atleta ]      --HTTPS--> portal (Next BFF :3001) ┘
```

- **web** (backoffice da organização) e **portal** (app do atleta) são **BFFs**: o servidor Next fala com a API server-side via `API_URL`; o navegador não acessa a API diretamente. Sirva cada um em seu domínio/subdomínio (ex.: `app.` e `meu.`), ambos com HTTPS.
- **api** valida CORS (`WEB_ORIGIN`), aplica rate-limit e cabeçalhos de segurança (ver `docs/API.md §1.1`).
- **banco**: Neon, acessado por `DATABASE_URL` com `sslmode=require`.

## Pré-requisitos

- Docker + Docker Compose no host.
- Uma conta/projeto no [Neon](https://neon.tech).
- Um domínio e um reverse proxy com TLS à frente (Caddy, Nginx, Traefik, ou o proxy do provedor).

## 1. Banco (Neon)

1. Crie um projeto no Neon (escolha a região mais próxima dos usuários).
2. Copie a **connection string** (papel com permissão de DDL para migrations).
3. Garanta `sslmode=require` na URL:
   `postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/DB?sslmode=require`

## 2. Variáveis de ambiente

Crie um arquivo `.env` no host, ao lado do `docker-compose.prod.yml` (baseado em `.env.example`). **Não versione** este arquivo.

| Variável | Serviço | Descrição |
|---|---|---|
| `NODE_ENV` | ambos | `production` |
| `DATABASE_URL` | api | connection string do Neon (com `sslmode=require`) |
| `JWT_ACCESS_SECRET` | api | segredo forte e aleatório (`openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET` | api | segredo forte, **diferente** do access |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | ambos | TTL dos tokens em segundos (devem casar entre api e web) |
| `WEB_ORIGIN` | api | domínio **público da web** (ex.: `https://app.seudominio.com`) — usado no CORS |
| `THROTTLE_TTL` / `THROTTLE_LIMIT` / `AUTH_THROTTLE_LIMIT` | api | rate-limit (defaults 60s / 120 / 10) |
| `API_URL` | web/portal | URL da API vista pelos servidores Next. No mesmo compose: `http://api:3333` |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | api | Web Push do portal. Gere com `npx web-push generate-vapid-keys`. Sem elas, push desativado |
| `VAPID_SUBJECT` | api | `mailto:` de contato do remetente das notificações |
| `PUSH_START_LEAD_MIN` | api | antecedência (min) do lembrete "vai começar" (default 30) |
| `API_PORT` | api | opcional (default 3333) |
| `SEED_*` | seed | só para o seed inicial (clube + admin) |

> **Cookies/HTTPS:** a web marca os cookies como `secure` quando `NODE_ENV=production`. Sirva a web por **HTTPS**, senão o login não persiste.

## 3. Build das imagens

Do diretório raiz do projeto:

```bash
docker compose -f docker-compose.prod.yml build
# ou individualmente:
# docker build -f apps/api/Dockerfile -t reb-api .
# docker build -f apps/web/Dockerfile -t reb-web .
```

## 4. Migrations (antes de expor a nova versão)

Aplica o schema no Neon e sai:

```bash
docker compose -f docker-compose.prod.yml --profile tools run --rm migrate
```

(É o `prisma migrate deploy` — aplica apenas migrations já commitadas, sem gerar novas.)

**Seed inicial (apenas na primeira subida)** — cria clube + admin:

```bash
docker compose -f docker-compose.prod.yml run --rm api pnpm --filter @reb/db seed
```

Troque a senha do admin após o primeiro login.

## 5. Subir

```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps      # web deve subir após api "healthy"
```

## 6. Reverse proxy / TLS

Coloque um proxy com HTTPS à frente:
- `app.seudominio.com` → `web:3000` (tráfego dos usuários).
- A **api** não precisa ser pública se web e api estão na mesma rede do compose (`API_URL=http://api:3333`). Se expuser a api publicamente, ajuste `WEB_ORIGIN` e o proxy conforme necessário.

Exemplo mínimo (Caddy):

```
app.seudominio.com {
    reverse_proxy web:3000
}
```

## 7. Health checks

- API: `GET https://.../api/v1/health` → `200 {"status":"ok"}` (endpoint isento de rate-limit).
- Ambas as imagens têm `HEALTHCHECK` embutido (visível em `docker compose ps`).

## 8. Atualização e rollback

- **Deploy de nova versão:** `git pull` → `build` → **migrations** (passo 4) → `up -d`.
- **Rollback:** volte ao commit/imagem anterior e `up -d`. Migrations são aditivas; um rollback de código não desfaz migrations — planeje mudanças de schema com compatibilidade.

## 9. Verificação pós-deploy

1. `GET /api/v1/health` → 200.
2. Abrir a web pelo domínio → login com o admin do seed → dashboard carrega.
3. Requisição de origem estranha à API é barrada pelo CORS (`WEB_ORIGIN`).
4. Mais de `AUTH_THROTTLE_LIMIT` logins errados em 1 min → `429 RATE_LIMITED`.

---

## Alternativa: PaaS gerenciado

Se preferir não gerenciar VM:

- **Web** → **Vercel** (Next.js nativo). Configure `API_URL`, `JWT_*_TTL`, `NODE_ENV`. A API precisa estar acessível pela URL configurada.
- **API** → **Render / Railway / Fly.io** usando `apps/api/Dockerfile`. Configure as vars da tabela; rode `prisma migrate deploy` no release (release command / job).
- **Banco** → **Neon** (o mesmo dos passos acima).

Cuidados: `WEB_ORIGIN` deve ser o domínio da web na Vercel; a web e a API estarão em domínios diferentes (a API é chamada server-side pelo BFF, então não há CORS no navegador, mas mantenha `WEB_ORIGIN` correto para as chamadas que passam origem).

---

## CI

O workflow `.github/workflows/ci.yml` tem o job **docker** que faz `docker build` das duas imagens a cada push/PR (sem publicar), garantindo que os Dockerfiles continuam válidos. A publicação em registry (GHCR/Docker Hub) e o deploy contínuo ficam a cargo da operação.
