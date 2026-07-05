/** Avatar do atleta: foto quando houver, senão iniciais sobre gradiente oceano. */
export function Avatar({
  name,
  photoUrl,
  size = 64,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover ring-2 ring-ocean/50"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="grid place-items-center rounded-full bg-gradient-to-br from-ocean/80 to-coral/70 font-bold text-ocean-ink ring-2 ring-ocean/40"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initials || '?'}
    </div>
  );
}
