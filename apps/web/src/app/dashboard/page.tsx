import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ROUND_STATUS_LABELS, roundLabel } from '@reb/contracts';
import { getCurrentUser } from '@/lib/auth';
import { getDashboard } from '@/lib/stats';
import { BarChartH } from '@/components/charts/BarChartH';
import { LogoutButton } from '@/components/LogoutButton';
import { Tile } from '@/components/ui/Tile';
import { StatTile } from '@/components/ui/StatTile';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { EmptyState, SectionTitle } from '@/components/ui/EmptyState';
import {
  IconCalendar,
  IconCalendarClock,
  IconChart,
  IconChevronRight,
  IconCourt,
  IconHelp,
  IconLayers,
  IconShield,
  IconTrophy,
  IconUsers,
  IconWhistle,
} from '@/components/ui/icons';

const NAV = [
  { href: '/players', title: 'Jogadores', hint: 'Cadastro e perfis', icon: IconUsers },
  { href: '/championships', title: 'Campeonatos', hint: 'Config, rodadas, ranking', icon: IconTrophy },
  { href: '/seasons', title: 'Temporadas', hint: 'Abrir e encerrar', icon: IconLayers },
  { href: '/venues', title: 'Quadras', hint: 'Cadastro e vínculo', icon: IconCourt },
  { href: '/calendar', title: 'Agenda', hint: 'Rodadas e treinos', icon: IconCalendar },
  { href: '/help', title: 'Como funciona', hint: 'Guia do administrador', icon: IconHelp },
];

// Só para ADMIN: gestão de equipe (criar outros administradores/organizadores).
const ADMIN_NAV = {
  href: '/admins',
  title: 'Equipe',
  hint: 'Administradores e organizadores',
  icon: IconShield,
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const data = await getDashboard();
  const k = data?.kpis;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
          <span className="flex items-center gap-2 font-bold text-ocean">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ocean text-ocean-ink">
              <IconWhistle width={18} height={18} />
            </span>
            Elite Beach
          </span>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="hidden text-ink-2 sm:inline">{user.email}</span>
            <Badge tone="info">{user.role}</Badge>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6">
        {/* Hero */}
        <Tile variant="accent" className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm opacity-80">Bem-vindo de volta</p>
            <h1 className="text-2xl font-bold tracking-tight">Painel do campeonato</h1>
            <p className="mt-1 max-w-md text-sm opacity-80">
              Conduza tudo do cadastro ao campeão. Primeira vez? Comece pelo guia.
            </p>
          </div>
          <Link
            href="/help"
            className="inline-flex items-center gap-2 rounded-full bg-ocean-ink/15 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-ocean-ink/25"
          >
            <IconHelp width={18} height={18} /> Como funciona
          </Link>
        </Tile>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="Jogadores ativos" value={k?.activePlayers ?? 0} icon={<IconUsers />} />
          <StatTile label="Temporadas" value={k?.seasons ?? 0} icon={<IconLayers />} />
          <StatTile label="Campeonatos" value={k?.championships ?? 0} icon={<IconTrophy />} />
          <StatTile label="Rodadas" value={k?.rounds ?? 0} icon={<IconCalendar />} />
          <StatTile label="Encerradas" value={k?.finishedRounds ?? 0} icon={<IconChart />} />
        </div>

        {/* Próxima rodada + Últimos resultados */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Tile className="flex flex-col gap-3">
            <SectionTitle>Próxima rodada</SectionTitle>
            {data?.nextRound ? (
              <Link
                href={`/rounds/${data.nextRound.id}`}
                className="flex items-center justify-between rounded-2xl bg-surface-2 p-4 transition hover:bg-ocean/5"
              >
                <span>
                  <span className="flex items-center gap-2 font-semibold">
                    <IconCalendarClock width={18} height={18} className="text-ocean" />
                    {roundLabel(data.nextRound)}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-2">
                    {data.nextRound.championshipName}
                    {data.nextRound.date ? ` · ${data.nextRound.date}` : ''}
                  </span>
                </span>
                <Badge tone="info">{ROUND_STATUS_LABELS[data.nextRound.status]}</Badge>
              </Link>
            ) : (
              <EmptyState>Nenhuma rodada agendada ou aberta.</EmptyState>
            )}
          </Tile>

          <Tile className="flex flex-col gap-3">
            <SectionTitle>Últimos resultados</SectionTitle>
            {data && data.recentResults.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {data.recentResults.map((r) => (
                  <li key={r.roundId}>
                    <Link
                      href={`/rounds/${r.roundId}/knockout`}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3 transition hover:bg-ocean/5"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {r.championshipName} · {roundLabel({ kind: r.kind, number: r.roundNumber })}
                        </span>
                        <span className="block truncate text-ink-2">
                          🏆 {r.championNames.join(' + ') || '—'}
                        </span>
                      </span>
                      <IconChevronRight width={18} height={18} className="shrink-0 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>Nenhuma rodada encerrada ainda.</EmptyState>
            )}
          </Tile>
        </div>

        {/* Top do ranking */}
        <Tile>
          <SectionTitle>Top do ranking (geral)</SectionTitle>
          {data && data.topRanking.length > 0 ? (
            <BarChartH
              data={data.topRanking.map((e) => ({ label: e.playerName, value: e.points }))}
              unit=" pts"
            />
          ) : (
            <EmptyState>Sem pontos lançados ainda.</EmptyState>
          )}
        </Tile>

        {/* Navegação */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {(user.role === 'ADMIN' ? [...NAV, ADMIN_NAV] : NAV).map(({ href, title, hint, icon: Icon }) => (
            <Tile key={href} href={href} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ocean/10 text-ocean">
                <Icon />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{title}</span>
                <span className="block truncate text-xs text-ink-2">{hint}</span>
              </span>
            </Tile>
          ))}
        </div>
      </main>
    </div>
  );
}
