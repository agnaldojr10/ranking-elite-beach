# Deploy em produção — custo zero (Vercel + Render + Neon)

Guia passo a passo para colocar o **Ranking Elite Beach** no ar sem custo inicial.

```
  Navegador do atleta ─┐            ┌─ Vercel: Portal   (apps/portal)  ─┐
                       ├─ HTTPS ───►│                                    │── server-side ──► Render: API (NestJS) ──► Neon (Postgres)
  Navegador da organiz.┘            └─ Vercel: Backoffice (apps/web)   ─┘        (BFF)
```

- **Neon** — banco Postgres (free).
- **Render** — API NestJS via Docker (free; hiberna após ~15 min de inatividade).
- **Vercel** — backoffice e portal (Next.js, free; 2 projetos).

Os front-ends **nunca** falam direto com o banco: o navegador chama o servidor Next (Vercel), que chama a API (Render) por baixo (padrão BFF). Só a API acessa o Neon.

> **Contas necessárias (todas gratuitas):** GitHub (já temos o repo), [Neon](https://neon.tech), [Render](https://render.com), [Vercel](https://vercel.com). Faça login nas três com o GitHub.

---

## Passo 0 — Segredos (gere uma vez e guarde)

Num terminal local:

```bash
# 2 segredos JWT (rode duas vezes, guarde cada um)
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# Par de chaves VAPID (push do portal)
npx web-push generate-vapid-keys
```

Anote: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`.

---

## Passo 1 — Banco no Neon

1. Neon → **New Project**. Nome: `ranking-elite-beach`. **Região:** escolha uma próxima da Render (ex.: *AWS US East (Ohio)* combina com a região `ohio` da Render).
2. Em **Connection string**, copie **duas** URLs (botão "Connection details"):
   - **Pooled** (host contém `-pooler`) → usada pela **API na Render** (runtime).
   - **Direct** (sem `-pooler`) → usada pelas **migrations/seed** locais.
   Ambas terminam com `?sslmode=require`.

---

## Passo 2 — Migrations + dados reais no Neon (rodar localmente, 1x)

Crie o arquivo **`.env.production`** na raiz do repo (já está no `.gitignore` — não é versionado):

```dotenv
# URL DIRECT do Neon (sem -pooler) — para migrations e seed
DATABASE_URL="postgresql://USER:PASS@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
# Admin fixo da organização (login do backoffice e do portal)
SEED_CLUB_NAME="Ranking Elite Beach"
SEED_ADMIN_EMAIL="admin@seudominio.com"
SEED_ADMIN_PASSWORD="uma-senha-forte-aqui"
```

Aplique o schema e popule (nesta ordem, **em banco novo/vazio**):

```bash
# 1) cria as tabelas
pnpm --filter @reb/db run prisma:prod migrate deploy
# 2) seed base (clube + usuário admin)
pnpm --filter @reb/db run seed:prod
# 3) dados reais (temporada 2026, campeonato ativo, 18 atletas, rodada 1 com as duplas reais)
pnpm --filter @reb/db run seed:real:prod
```

> ⚠️ O `seed:real` cria uma temporada/campeonato novos a cada execução — rode **uma única vez** no banco de produção limpo.

Gere os convites dos atletas (códigos aparecem no console — distribua com cada jogador):

```bash
pnpm --filter @reb/db run gen:invites:prod
```

---

## Passo 3 — API na Render

1. Render → **New → Blueprint** → selecione este repositório. Ele lê o **`render.yaml`** e cria o serviço `reb-api` (Docker, free).
   *(Alternativa manual: New → Web Service → Docker → Dockerfile `apps/api/Dockerfile`, Context `.`, Health Check Path `/api/v1/health`.)*
2. Em **Environment**, preencha os segredos (marcados como "sync:false"):

   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | URL **POOLED** do Neon (host com `-pooler`) |
   | `JWT_ACCESS_SECRET` | (Passo 0) |
   | `JWT_REFRESH_SECRET` | (Passo 0) |
   | `WEB_ORIGIN` | deixe temporário (ex. `https://exemplo.com`); ajusta no Passo 6 |
   | `VAPID_PUBLIC_KEY` | (Passo 0) |
   | `VAPID_PRIVATE_KEY` | (Passo 0) |
   | `VAPID_SUBJECT` | `mailto:admin@seudominio.com` |

   `NODE_ENV`, `PUSH_START_LEAD_MIN` e `INVITE_TTL_DAYS` já vêm do blueprint. `PORT` é injetado pela Render (a API já escuta nele).
3. **Create** → aguarde o build/deploy. Anote a URL pública, ex.: `https://reb-api.onrender.com`.
4. Teste: abra `https://reb-api.onrender.com/api/v1/health` → deve responder OK (o **primeiro** acesso pode demorar ~1 min por causa da hibernação do plano free).

---

## Passo 4 — Backoffice na Vercel (apps/web)

1. Vercel → **Add New → Project** → importe o repositório.
2. **Root Directory:** `apps/web`. (O `apps/web/vercel.json` já define o build via Turborepo — inclui o pacote `@reb/contracts`.)
3. **Environment Variables:**

   | Variável | Valor |
   |---|---|
   | `API_URL` | URL da API na Render (ex. `https://reb-api.onrender.com`) |

4. **Deploy** → anote a URL, ex.: `https://reb-backoffice.vercel.app`.

---

## Passo 5 — Portal do jogador na Vercel (apps/portal)

Repita o Passo 4 num **novo projeto** Vercel:

- **Root Directory:** `apps/portal`
- **Environment Variables:** `API_URL` = mesma URL da API na Render.
- **Deploy** → anote a URL, ex.: `https://reb-portal.vercel.app`.

---

## Passo 6 — Fechar o laço (CORS)

Na Render, ajuste `WEB_ORIGIN` para as **duas** URLs da Vercel, separadas por vírgula, e salve (a Render redeploya):

```
WEB_ORIGIN = https://reb-backoffice.vercel.app,https://reb-portal.vercel.app
```

---

## Passo 7 — Verificação

1. **Backoffice** (`https://reb-backoffice.vercel.app`): login com `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`. Veja o campeonato ativo, atletas e a rodada 1.
2. **Portal** (`https://reb-portal.vercel.app`): em `/claim`, um atleta reivindica a conta com o código do Passo 2; depois aba **Rodada** (operar) e **Torneios** (ranking).
3. **Push**: no portal, ative as notificações no Perfil (precisa de HTTPS — a Vercel já entrega).

---

## Notas & custos

- **Hibernação (free):** a API na Render dorme após ~15 min ociosa; o 1º acesso do dia leva ~1 min. O Neon free também suspende e acorda em ~1s. Para uma noite de jogos por semana, é tranquilo.
- **Lembretes push:** o agendador (`@Cron`) só dispara com a API acordada. Enquanto hiberna, os lembretes "vai começar" podem não sair — o resto do app funciona normal.
- **Quando quiser tirar a hibernação:** Render **Starter (~US$7/mês)** mantém a API sempre no ar (sem cold start e com o cron confiável). Nada muda no código.
- **Backups:** o Neon free mantém histórico/branching; para segurança extra, exporte periodicamente (`pg_dump` pela URL direct).
- **Domínio próprio:** dá para apontar depois na Vercel (front-ends) e na Render (API) sem mexer no código — só atualizar `API_URL` e `WEB_ORIGIN`.
- **Segredos:** `.env.production` fica **só na sua máquina** (gitignored). Nunca commite. Os segredos de runtime vivem nos painéis da Render/Vercel.
