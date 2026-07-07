import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PLAYER_STATUS_LABELS, SKILL_LEVEL_LABELS, type PlayerStats } from '@reb/contracts';
import { Avatar } from '@/components/Avatar';
import { PlayerInviteButton } from '@/components/PlayerInviteButton';
import { getPlayer } from '@/lib/players';
import { getPlayerStats } from '@/lib/stats';
import { setPlayerStatusAction } from '../actions';

export default async function PlayerProfilePage({ params }: { params: { id: string } }) {
  const [player, stats] = await Promise.all([getPlayer(params.id), getPlayerStats(params.id)]);
  if (!player) notFound();

  const nextStatus = player.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const toggleStatus = setPlayerStatusAction.bind(null, player.id, nextStatus);
  const hasHistory = stats && stats.roundsPlayed > 0;

  return (
    <main className="min-h-dvh">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 sticky top-0 z-40 border-b border-line bg-surface/80 px-6 py-4 backdrop-blur-md">
        <Link href="/players" className="font-bold text-ocean">
          Jogadores
        </Link>
        <span className="text-muted">/</span>
        <span className="font-medium">{player.name}</span>
      </header>

      <section className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={player.name} photoUrl={player.photoUrl} size={72} />
            <div>
              <h1 className="text-2xl font-bold">{player.name}</h1>
              <p className="text-ink-2">
                {player.age} anos · {SKILL_LEVEL_LABELS[player.skillLevel]} ·{' '}
                {PLAYER_STATUS_LABELS[player.status]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/players/${player.id}/edit`}
              className="rounded-full bg-ocean px-5 py-2.5 text-sm font-medium text-ocean-ink transition hover:opacity-90"
            >
              Editar
            </Link>
            <form action={toggleStatus}>
              <button className="rounded-full border border-line px-4 py-2 text-sm transition hover:bg-surface-2">
                {player.status === 'ACTIVE' ? 'Inativar' : 'Ativar'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Telefone" value={player.phone ?? '—'} />
          <Info label="Nascimento" value={player.birthDate} />
          <Info label="Cadastro" value={new Date(player.createdAt).toLocaleDateString('pt-BR')} />
        </div>

        {/* Acesso ao portal do jogador */}
        <div className="mt-8 rounded-3xl border border-line bg-surface p-4 shadow-tile">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-sm">
              <h2 className="font-semibold">Acesso ao portal</h2>
              <p className="mt-1 text-sm text-ink-2">
                Gere um código para {player.name} ativar a conta no portal do jogador e enviar pelo
                WhatsApp. Cada código é de uso único.
              </p>
            </div>
            <PlayerInviteButton playerId={player.id} playerName={player.name} />
          </div>
        </div>

        <h2 className="mb-3 mt-8 font-semibold">Estatísticas</h2>
        {hasHistory ? (
          <PlayerStatsView stats={stats} />
        ) : (
          <div className="rounded-3xl border border-dashed border-line p-6 text-sm text-ink-2">
            Sem histórico ainda — as estatísticas aparecem depois que o jogador disputar rodadas
            encerradas.
          </div>
        )}
      </section>
    </main>
  );
}

function PlayerStatsView({ stats }: { stats: PlayerStats }) {
  const pct = `${Math.round(stats.winRate * 100)}%`;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="Pontos" value={String(stats.points)} />
        <Info label="Aproveitamento" value={pct} />
        <Info label="Participações (rodadas)" value={String(stats.roundsPlayed)} />
        <Info label="Média de pontos" value={String(stats.avgPoints)} />
        <Info label="Vitórias / Derrotas" value={`${stats.wins} / ${stats.losses}`} />
        <Info label="Títulos" value={String(stats.titles)} />
        <Info label="Finais" value={String(stats.finals)} />
        <Info
          label="Melhor / pior colocação"
          value={
            stats.bestPlacement
              ? `${stats.bestPlacement}º / ${stats.worstPlacement}º`
              : '—'
          }
        />
        <Info label="Maior sequência de vitórias" value={String(stats.longestWinStreak)} />
        <Info label="Maior sequência de derrotas" value={String(stats.longestLossStreak)} />
        <Info label="Campeonatos disputados" value={String(stats.championshipsPlayed)} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-line bg-surface p-4 shadow-tile">
          <p className="text-sm text-ink-2">Parceiro favorito</p>
          {stats.favoritePartner ? (
            <p className="mt-1">
              <Link href={`/players/${stats.favoritePartner.playerId}`} className="font-medium text-ocean hover:underline">
                {stats.favoritePartner.playerName}
              </Link>{' '}
              <span className="text-sm text-ink-2">
                · {stats.favoritePartner.timesTogether}x juntos
              </span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">—</p>
          )}
        </div>
        <div className="rounded-3xl border border-line bg-surface p-4 shadow-tile">
          <p className="text-sm text-ink-2">Adversário mais enfrentado</p>
          {stats.topOpponent ? (
            <p className="mt-1">
              <Link href={`/players/${stats.topOpponent.playerId}`} className="font-medium text-ocean hover:underline">
                {stats.topOpponent.playerName}
              </Link>{' '}
              <span className="text-sm text-ink-2">· {stats.topOpponent.timesFaced}x</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">—</p>
          )}
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        &quot;Melhor parceiro&quot; por taxa de vitória fica no backlog (BR-36); aqui exibimos o
        parceiro favorito por frequência.
      </p>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-line bg-surface p-4 shadow-tile">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
