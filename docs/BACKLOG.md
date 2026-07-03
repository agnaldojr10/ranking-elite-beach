# BACKLOG.md — Melhorias e Ideias Futuras

> Não remover itens sem aprovação do PO. Priorização: Alta / Média / Baixa / Ideias.

---

## Alta prioridade
- Definir e implementar as pendências de regra de negócio abertas (ver [BUSINESS_RULES.md](./BUSINESS_RULES.md) — 8 itens).
- Motor de sorteio: min-cost matching exato (blossom) para N pequeno/médio.
- Auditoria completa de alterações de resultado e config.

## Média prioridade
- Métrica "melhor parceiro" por taxa de vitória (adiada em BR-36): definir amostra mínima e normalização justa, dado que as duplas rotacionam a cada rodada.
- Multi-tenant real (isolamento por clube, RLS no Postgres, UI de gestão de clubes).
- Notificações reais (WhatsApp via provedor, e-mail, push PWA) sobre a arquitetura de eventos.
- Exportação de ranking/resultados (PDF/planilha).
- Restrições manuais no sorteio ("não parear", "não enfrentar", indisponibilidade por horário).

## Baixa prioridade
- Perfil público do jogador com link compartilhável.
- Temas/branding do clube; modo TV para exibir na quadra.
- Histórico de evolução do ranking com gráficos avançados.

## Ideias futuras
- App mobile nativo / wrapper.
- Integração com pagamentos/mensalidades.
- IA para sugerir formato ideal de campeonato a partir do histórico.
- Balanceamento por categorias (idade, gênero, misto).
- Ranking preditivo (Elo/Glicko) como métrica alternativa.
