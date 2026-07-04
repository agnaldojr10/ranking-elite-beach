import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VenueForm } from '@/components/VenueForm';
import { getVenue } from '@/lib/venues';
import { updateVenueAction } from '../../actions';

export default async function EditVenuePage({ params }: { params: { id: string } }) {
  const venue = await getVenue(params.id);
  if (!venue) notFound();

  const action = updateVenueAction.bind(null, venue.id);

  return (
    <main className="min-h-dvh">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 sticky top-0 z-40 border-b border-line bg-surface/80 px-6 py-4 backdrop-blur-md">
        <Link href="/venues" className="font-bold text-ocean">
          Quadras
        </Link>
        <span className="text-muted">/</span>
        <span className="font-medium">{venue.name}</span>
      </header>
      <section className="p-6">
        <h1 className="mb-6 text-xl font-semibold">Editar quadra</h1>
        <VenueForm
          action={action}
          defaults={{ name: venue.name, number: venue.number, location: venue.location }}
          submitLabel="Salvar alterações"
        />
      </section>
    </main>
  );
}
