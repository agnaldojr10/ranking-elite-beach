import { notFound } from 'next/navigation';
import {
  REGISTRATION_STATUS_LABELS,
  ROUND_KIND_LABELS,
  ROUND_STATUS_LABELS,
  SKILL_LEVEL_LABELS,
  describeRoundFormat,
  roundLabel,
  type Registration,
  type RegistrationStatus,
} from '@reb/contracts';
import { Avatar } from '@/components/Avatar';
import { AddRegistrationForm } from '@/components/AddRegistrationForm';
import { DeleteRoundButton } from '@/components/DeleteRoundButton';
import { AppShell } from '@/components/ui/AppShell';
import { Tile } from '@/components/ui/Tile';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink, buttonClass } from '@/components/ui/Button';
import { SectionTitle, EmptyState } from '@/components/ui/EmptyState';
import { getRound } from '@/lib/rounds';
import { listPlayers } from '@/lib/players';
import {
  removeRegistrationAction,
  setRegistrationStatusAction,
  setRoundStatusAction,
  substituteRegistrationAction,
} from '../actions';

const STATUS_TONE: Record<RegistrationStatus, 'ok' | 'warn' | 'neutral' | 'info'> = {
  CONFIRMED: 'ok',
  PENDING: 'warn',
  ABSENT: 'neutral',
  WAITLIST: 'info',
};

export default async function RoundDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { erro?: string };
}) {
  const round = await getRound(params.id);
  if (!round) notFound();
  const erro = searchParams?.erro;

  const registrations = round.registrations ?? [];
  const registeredIds = new Set(registrations.map((r) => r.player.id));
  const playersResult = await listPlayers({ status: 'ACTIVE', pageSize: '100' });
  const availablePlayers = playersResult.data
    .filter((p) => !registeredIds.has(p.id))
    .map((p) => ({ id: p.id, name: p.name, skillLevel: p.skillLevel }));

  const { readiness, summary } = round;
  const isScheduled = round.status === 'SCHEDULED';
  const isOpen = round.status === 'OPEN';
  const hasDraw = round.status === 'DRAWN' || round.status === 'IN_PROGRESS' || round.status === 'FINISHED';
  const open = setRoundStatusAction.bind(null, round.id, round.championshipId, 'OPEN');
  const close = setRoundStatusAction.bind(null, round.id, round.championshipId, 'SCHEDULED');
  const teams = Math.floor(summary.confirmed / 2);
  const format = summary.confirmed >= 8 ? describeRoundFormat(teams, round.groupSizePref) : null;
  const label = roundLabel(round);

  return (
    <AppShell
      crumbs={[
        { label: 'Campeonatos', href: '/championships' },
        { label: round.championshipName, href: `/championships/${round.championshipId}` },
        { label },
      ]}
    >
      <div className="space-y-4">
        {/* Hero */}
        <Tile className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{label}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-2">
              <Badge tone="info">{ROUND_STATUS_LABELS[round.status]}</Badge>
              <span>{ROUND_KIND_LABELS[round.kind]}</span>
              {round.date && <span>· {round.date}</span>}
              <span>· grupos de {round.groupSizePref}</span>
              <span>· {round.matchFormat.sets === 1 ? '1 set' : 'melhor de 3'}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasDraw && <ButtonLink href={`/rounds/${round.id}/results`}>Resultados</ButtonLink>}
            {(round.status === 'IN_PROGRESS' || round.status === 'FINISHED') && (
              <ButtonLink href={`/rounds/${round.id}/knockout`} variant="secondary">
                Mata-mata
              </ButtonLink>
            )}
            {hasDraw ? (
              <ButtonLink href={`/rounds/${round.id}/draw`} variant="secondary">
                Ver sorteio
              </ButtonLink>
            ) : readiness.canDraw ? (
              <ButtonLink href={`/rounds/${round.id}/draw`}>Simular sorteio</ButtonLink>
            ) : (
              <span
                title={readiness.message}
                className={buttonClass('secondary', 'md', 'cursor-not-allowed opacity-50')}
              >
                Simular sorteio
              </span>
            )}
            {!hasDraw && round.status !== 'FINISHED' && (
              <ButtonLink href={`/rounds/${round.id}/classification`} variant="secondary">
                Lançar classificação
              </ButtonLink>
            )}
            {isScheduled && (
              <form action={open}>
                <Button variant="secondary">Abrir inscrições</Button>
              </form>
            )}
            {isOpen && (
              <form action={close}>
                <Button variant="secondary">Fechar inscrições</Button>
              </form>
            )}
            <ButtonLink href={`/rounds/${round.id}/edit`} variant="ghost">
              Editar
            </ButtonLink>
            <DeleteRoundButton roundId={round.id} championshipId={round.championshipId} />
          </div>
        </Tile>

        {erro && (
          <Tile className="border-danger/40 bg-danger/5">
            <p role="alert" className="text-sm text-danger">
              Não foi possível excluir a rodada: {erro}
            </p>
          </Tile>
        )}

        {/* Prontidão */}
        <Tile
          className={
            readiness.canDraw ? 'border-ok/40 bg-ok/5' : 'border-warn/40 bg-warn/5'
          }
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="font-semibold">
              {readiness.canDraw ? '✓ Pronta para o sorteio' : 'Ainda não pode sortear'}
            </span>
            <span className="text-ink-2">
              Confirmados: <strong className="text-ink">{summary.confirmed}</strong>
            </span>
            <span className="text-ink-2">Par: {readiness.isEven ? 'sim' : 'não'}</span>
            <span className="text-ink-2">Entre 8 e 64: {readiness.inRange ? 'sim' : 'não'}</span>
          </div>
          {readiness.message && <p className="mt-2 text-sm text-warn">{readiness.message}</p>}
        </Tile>

        {/* Painéis bento */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Tile>
            <SectionTitle>Inscrições</SectionTitle>
            <ul className="space-y-1.5 text-sm text-ink-2">
              <li className="flex justify-between">Confirmados <strong className="tabular-nums text-ink">{summary.confirmed}</strong></li>
              <li className="flex justify-between">Pendentes <span className="tabular-nums">{summary.pending}</span></li>
              <li className="flex justify-between">Ausentes <span className="tabular-nums">{summary.absent}</span></li>
              <li className="flex justify-between">Lista de espera <span className="tabular-nums">{summary.waitlist}</span></li>
              <li className="flex justify-between border-t border-line pt-1.5">Total <strong className="tabular-nums text-ink">{summary.total}</strong></li>
            </ul>
          </Tile>

          <Tile>
            <SectionTitle>Prévia do formato</SectionTitle>
            {format ? (
              <div className="text-sm text-ink-2">
                <p>
                  <strong className="text-ink">{teams}</strong> duplas em{' '}
                  <strong className="text-ink">{format.groupCount}</strong> grupo(s) ({format.groups.join(', ')}).
                </p>
                <p className="mt-1">
                  <strong className="text-ink">{format.qualifiers}</strong> classificados — fase inicial:{' '}
                  <strong className="text-ink">{format.bracketLabel}</strong>.
                </p>
                <p className="mt-1 text-muted">{format.qualificationRule}</p>
              </div>
            ) : (
              <p className="text-sm text-muted">A prévia aparece a partir de 8 confirmados.</p>
            )}
          </Tile>

          <Tile>
            <SectionTitle>Formato de partida</SectionTitle>
            <ul className="space-y-1.5 text-sm text-ink-2">
              <li className="flex justify-between">Sets <span>{round.matchFormat.sets === 1 ? '1' : 'melhor de 3'}</span></li>
              <li className="flex justify-between">Games por set <span className="tabular-nums">{round.matchFormat.gamesPerSet}</span></li>
              <li className="flex justify-between">Tie-break <span className="tabular-nums">{round.matchFormat.tieBreakAt}-{round.matchFormat.tieBreakAt}</span></li>
              <li className="flex justify-between">Placar de W.O. <span className="tabular-nums">{round.matchFormat.walkoverGames}/0</span></li>
            </ul>
          </Tile>
        </div>

        {/* Inscrever */}
        <Tile>
          <SectionTitle>Inscrever jogador</SectionTitle>
          <AddRegistrationForm roundId={round.id} players={availablePlayers} />
        </Tile>

        {/* Inscritos */}
        <Tile>
          <SectionTitle>Inscritos ({registrations.length})</SectionTitle>
          {registrations.length === 0 ? (
            <EmptyState>Nenhuma inscrição ainda. Use o formulário acima.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {registrations.map((r) => (
                <RegistrationRow key={r.id} reg={r} roundId={round.id} substitutes={availablePlayers} />
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">
            Lista de espera é promovida manualmente (BR-10). Substituir marca o inscrito como ausente
            e registra quem assumiu a vaga (BR-27).
          </p>
        </Tile>
      </div>
    </AppShell>
  );
}

function RegistrationRow({
  reg,
  roundId,
  substitutes,
}: {
  reg: Registration;
  roundId: string;
  substitutes: { id: string; name: string }[];
}) {
  const setStatus = (status: RegistrationStatus) =>
    setRegistrationStatusAction.bind(null, reg.id, roundId, status);
  const remove = removeRegistrationAction.bind(null, reg.id, roundId);
  const substitute = substituteRegistrationAction.bind(null, reg.id, roundId);

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <Avatar name={reg.player.name} photoUrl={reg.player.photoUrl} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{reg.player.name}</p>
        <p className="text-xs text-ink-2">{SKILL_LEVEL_LABELS[reg.player.skillLevel]}</p>
      </div>
      <Badge tone={STATUS_TONE[reg.status]}>{REGISTRATION_STATUS_LABELS[reg.status]}</Badge>
      <div className="flex flex-wrap items-center gap-1.5">
        {reg.status !== 'CONFIRMED' && (
          <form action={setStatus('CONFIRMED')}>
            <Button variant="secondary" size="sm">Confirmar</Button>
          </form>
        )}
        {reg.status !== 'WAITLIST' && (
          <form action={setStatus('WAITLIST')}>
            <Button variant="ghost" size="sm">Espera</Button>
          </form>
        )}
        {reg.status !== 'ABSENT' && (
          <form action={setStatus('ABSENT')}>
            <Button variant="ghost" size="sm">Ausente</Button>
          </form>
        )}
        <details className="relative">
          <summary className={buttonClass('ghost', 'sm', 'cursor-pointer list-none')}>Substituir</summary>
          <form
            action={substitute}
            className="absolute right-0 z-10 mt-1 flex w-64 flex-col gap-2 rounded-2xl border border-line bg-surface p-3 shadow-tile-hover"
          >
            <select
              name="substitutedById"
              required
              defaultValue=""
              className="rounded-xl border border-line bg-surface-2 px-2 py-1.5 text-xs"
            >
              <option value="" disabled>Quem assume a vaga…</option>
              {substitutes.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <Button size="sm">Confirmar substituição</Button>
          </form>
        </details>
        <form action={remove}>
          <Button variant="danger" size="sm">Remover</Button>
        </form>
      </div>
    </li>
  );
}
