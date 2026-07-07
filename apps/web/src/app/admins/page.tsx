import { redirect } from 'next/navigation';
import { STAFF_ROLE_LABELS, type StaffUser } from '@reb/contracts';
import { AppShell } from '@/components/ui/AppShell';
import { Tile } from '@/components/ui/Tile';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SectionTitle, EmptyState } from '@/components/ui/EmptyState';
import { StaffForm } from '@/components/StaffForm';
import { getCurrentUser } from '@/lib/auth';
import { listStaff } from '@/lib/staff';
import { setStaffActiveAction, setStaffRoleAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  // Gestão de equipe é exclusiva de ADMIN.
  if (user.role !== 'ADMIN') redirect('/dashboard');

  const staff = await listStaff();

  return (
    <AppShell crumbs={[{ label: 'Painel', href: '/dashboard' }, { label: 'Equipe' }]}>
      <div className="space-y-4">
        <Tile>
          <h1 className="text-2xl font-bold tracking-tight">Equipe da organização</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-2">
            Cadastre outros responsáveis para conduzir os campeonatos — útil quando você não puder
            estar presente. <strong>Administradores</strong> têm acesso total (inclusive gerenciar a
            equipe); <strong>organizadores</strong> operam campeonatos e rodadas, mas não mexem na
            equipe. Desativar um membro corta o acesso imediatamente.
          </p>
        </Tile>

        <Tile>
          <SectionTitle>Adicionar membro</SectionTitle>
          <StaffForm />
        </Tile>

        <Tile>
          <SectionTitle>Membros ({staff.length})</SectionTitle>
          {staff.length === 0 ? (
            <EmptyState>Nenhum membro ainda.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {staff.map((m) => (
                <StaffRow key={m.id} member={m} currentUserId={user.id} />
              ))}
            </ul>
          )}
        </Tile>
      </div>
    </AppShell>
  );
}

function StaffRow({ member, currentUserId }: { member: StaffUser; currentUserId: string }) {
  const isSelf = member.id === currentUserId;
  const isAdmin = member.role === 'ADMIN';

  const toggleActive = setStaffActiveAction.bind(null, member.id, !member.isActive);
  const toggleRole = setStaffRoleAction.bind(null, member.id, isAdmin ? 'ORGANIZER' : 'ADMIN');

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate font-medium">
          {member.email}
          {isSelf && <span className="text-xs text-muted">(você)</span>}
        </p>
        <p className="mt-0.5 text-xs text-ink-2">Desde {member.createdAt.slice(0, 10)}</p>
      </div>

      <Badge tone={isAdmin ? 'info' : 'neutral'}>{STAFF_ROLE_LABELS[member.role as 'ADMIN' | 'ORGANIZER'] ?? member.role}</Badge>
      <Badge tone={member.isActive ? 'ok' : 'neutral'}>{member.isActive ? 'Ativo' : 'Inativo'}</Badge>

      {!isSelf && (
        <div className="flex flex-wrap items-center gap-1.5">
          <form action={toggleRole}>
            <Button variant="ghost" size="sm">
              {isAdmin ? 'Tornar organizador' : 'Tornar admin'}
            </Button>
          </form>
          <form action={toggleActive}>
            <Button variant={member.isActive ? 'danger' : 'secondary'} size="sm">
              {member.isActive ? 'Desativar' : 'Reativar'}
            </Button>
          </form>
        </div>
      )}
    </li>
  );
}
