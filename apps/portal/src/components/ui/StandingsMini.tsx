import type { GroupStandings } from '@reb/contracts';

/** Mini-tabela de classificação de um grupo, destacando a dupla do atleta. */
export function StandingsMini({ group, myTeamId }: { group: GroupStandings; myTeamId: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
            <th className="py-1 pr-2 font-medium">#</th>
            <th className="py-1 pr-2 font-medium">Dupla</th>
            <th className="py-1 pr-2 text-center font-medium">V</th>
            <th className="py-1 pr-2 text-center font-medium">D</th>
            <th className="py-1 text-center font-medium">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {group.standings.map((s) => {
            const isMine = s.teamId === myTeamId;
            return (
              <tr
                key={s.teamId}
                className={`border-t border-line/50 ${isMine ? 'bg-ocean/10 font-semibold text-ink' : 'text-ink-2'}`}
              >
                <td className="py-1.5 pr-2 tabular">{s.position}º</td>
                <td className="py-1.5 pr-2">
                  {s.playerNames.filter(Boolean).join(' & ')}
                  {isMine ? <span className="ml-1 text-ocean">•</span> : null}
                </td>
                <td className="py-1.5 pr-2 text-center tabular">{s.wins}</td>
                <td className="py-1.5 pr-2 text-center tabular">{s.losses}</td>
                <td className="py-1.5 text-center tabular">
                  {s.gamesBalance > 0 ? `+${s.gamesBalance}` : s.gamesBalance}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
