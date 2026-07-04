# DESIGN_SYSTEM.md — Bento "Praiano moderno" (light + dark)

> Fonte da verdade visual do Ranking Elite Beach. Toda tela nova ou redesenhada segue este doc.
> Estilo: **Bento Box inspirado em apps Apple** (cartões arredondados, muito respiro, hierarquia clara), com identidade praiana (oceano/areia). Mobile-first. Acessível (Apple HIG / WCAG AA).

## 1. Tokens (cores semânticas)

Definidos como CSS vars (tripletas RGB) em `apps/web/src/app/globals.css` — `:root` (claro) e `.dark` (escuro) — e expostos no Tailwind (`apps/web/tailwind.config.ts`) como cores: `page, surface, surface-2, ink, ink-2, muted, line, ocean, ocean-ink, coral, ok, warn, danger`. **Nunca** usar `slate-*`/hex cru em componentes novos — sempre os tokens (garante os dois temas).

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| page | `#f4f1ea` | `#0a1417` | fundo da página |
| surface | `#ffffff` | `#101f24` | cartões (tiles) |
| surface-2 | `#faf8f4` | `#16262c` | campos/realces internos |
| ink / ink-2 / muted | `#0f172a`/`#475569`/`#94a3b8` | `#f1f5f9`/`#cbd5e1`/`#8ba0a8` | texto 1º/2º/apoio |
| line | `#e8e3d9` | `#22343b` | bordas/divisores |
| ocean / ocean-ink | `#0e7490`/`#fff` | `#2dd4bf`/`#052e34` | acento primário / texto sobre ele |
| coral | `#ff6f52` | `#ff8a6a` | realce quente pontual |
| ok / warn / danger | emerald / amber / red | versões dark | estados (com ícone+texto, nunca cor só) |

`ocean` é usado como **fundo** de botões/ícones/realces (texto `ocean-ink`), não como corpo de texto pequeno.

## 2. Tema claro/escuro

- Tailwind `darkMode: 'class'`. Classe `dark` no `<html>`.
- Script inline no `layout.tsx` aplica o tema antes da pintura (sem flash), a partir de `localStorage.theme` ou `prefers-color-scheme`.
- `<meta name="theme-color">` por tema. Toggle: `components/ui/ThemeToggle.tsx`.

## 3. Tipografia, espaçamento, forma

- Fonte: system stack (SF/Segoe/Roboto). Escala: 12 / 13 / 14 / 16(base) / 20 / 24 / 32; pesos 400 corpo, 500 rótulos, 600–700 títulos. `tabular-nums` em números/colunas.
- Espaçamento 4/8; gaps de tiles 16 (`gap-4`); padding de tile 20 (`p-5`).
- Raios: tiles `rounded-3xl` (28); campos/botões pequenos `rounded-2xl` (20); botões `rounded-full`.
- Sombras: `shadow-tile` (padrão) e `shadow-tile-hover`. Suaves, estilo Apple.

## 4. Bento — regras

- Grade responsiva: 1 col (mobile) → 2 (sm) → 3–5 (lg), com `gap-4`. Tiles de tamanhos variados (`span` no `Tile`).
- Cada tela: **1 CTA primário** por contexto; secundários subordinados. Cabeçalho/hero em tile; conteúdo agrupado por tiles temáticos.
- Sem overflow horizontal; tabelas largas em `overflow-x-auto` (ou vira lista empilhada no mobile).

## 5. Primitivos (`apps/web/src/components/ui/`)

- **`Tile`** — cartão bento (`plain`/`accent`, `span`, `href` p/ clicável). **`AppShell`** — casca com top bar translúcida (marca, breadcrumb, `ThemeToggle`, ações) + `main` centrado `max-w-6xl`, `min-h-dvh`, safe-area.
- **`Button`/`ButtonLink`/`buttonClass`** — `primary|secondary|ghost|danger`, `sm|md`, `rounded-full`, estados `disabled`.
- **`Badge`** — status tokenizado (neutral/ok/warn/danger/info/ocean), ícone+texto.
- **`StatTile`** (KPI), **`SectionTitle`**, **`EmptyState`**, **`icons.tsx`** (SVG stroke 1.75, sem emoji), **`ThemeToggle`**.

## 6. Do / Don't

- ✅ Tokens semânticos; ícones SVG consistentes; foco visível; alvos ≥44px; animações 150–250ms; `prefers-reduced-motion`.
- ❌ Emoji como ícone estrutural; cor como único indicador; `slate-*`/hex cru; tabela sem overflow no mobile; mais de um CTA primário.

## 7. Estado do redesign

- **Concluído (light+dark) em TODAS as telas:** tokens/tema + primitivos; vitrine (Login, Dashboard, Detalhe da rodada) com AppShell/Tile/Button; e **rollout** aplicado ao restante — Jogadores (lista/perfil/novo/editar), Temporadas, Campeonatos (lista/detalhe/novo/editar/config), Rodadas (nova/sorteio/resultados/mata-mata), Ranking (+`LineChart` tokenizado), Quadras, Agenda, Help e boundaries.
- Rollout feito por passadas de tokens (cores → semânticas), elevação de cards a tiles (`rounded-3xl` + `shadow-tile`), headers translúcidos (`sticky bg-surface/80 backdrop-blur`) e botões em pílula. Formulários usam o `field` tokenizado e `buttonClass`.
- **Refino futuro (opcional):** adotar `AppShell` formalmente em todas as páginas (hoje algumas mantêm header próprio já tokenizado) e migrar tabelas densas para cards em telas muito estreitas.
