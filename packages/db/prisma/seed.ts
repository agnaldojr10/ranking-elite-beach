import * as argon2 from 'argon2';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Semeia o clube padrão (tenancy) e o usuário administrador inicial.
 * Idempotente: pode rodar múltiplas vezes sem duplicar dados.
 */
async function main() {
  const clubName = process.env.SEED_CLUB_NAME ?? 'Ranking Elite Beach';
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@ranking-elite-beach.local').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';

  const club = await prisma.club.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: { name: clubName },
    create: { id: '00000000-0000-0000-0000-000000000001', name: clubName },
  });

  const passwordHash = await argon2.hash(adminPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN, clubId: club.id },
    create: {
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
      clubId: club.id,
    },
  });

  console.log(`✔ Clube: ${club.name} (${club.id})`);
  console.log(`✔ Admin: ${admin.email} / senha: ${adminPassword}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
