import { describe, expect, it, vi } from 'vitest';
import { PushService } from './push.service';

// Par VAPID válido (formato correto) só para os testes.
const VALID_PUB = 'BJqs3836U3aTpRKU6bUBVifEhhSEbebbaC-qXF9OLXUIlHXJJF7RPBbTsdhy6UtSSJk_SbFP52h0j41L6t3qzF4';
const VALID_PRIV = 'Cb20nhodENDfQP5xWSKfNzYdR6A-qRi_P10BfLRal4M';

function makeService(keys: { pub?: string; priv?: string }) {
  const findMany = vi.fn(async () => []);
  const prisma = { pushSubscription: { findMany } };
  const config = {
    get: (k: string) => (k === 'VAPID_PUBLIC_KEY' ? keys.pub : k === 'VAPID_PRIVATE_KEY' ? keys.priv : undefined),
    getOrThrow: () => 'mailto:test@x.com',
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = new PushService(prisma as any, config as any);
  return { service, findMany };
}

describe('PushService (push desativado)', () => {
  it('sem chaves VAPID: enabled=false, publicKey=null e notifyPlayers não consulta o banco', async () => {
    const { service, findMany } = makeService({});
    expect(service.enabled).toBe(false);
    expect(service.publicKey()).toBeNull();
    await service.notifyPlayers(['p1', 'p2'], { title: 't', body: 'b' });
    expect(findMany).not.toHaveBeenCalled();
  });
});

describe('PushService (push ativado)', () => {
  it('com chaves: enabled=true e expõe a public key', () => {
    const { service } = makeService({ pub: VALID_PUB, priv: VALID_PRIV });
    expect(service.enabled).toBe(true);
    expect(service.publicKey()).toBe(VALID_PUB);
  });

  it('ativado mas sem playerIds: não consulta o banco', async () => {
    const { service, findMany } = makeService({ pub: VALID_PUB, priv: VALID_PRIV });
    await service.notifyPlayers([], { title: 't', body: 'b' });
    expect(findMany).not.toHaveBeenCalled();
  });
});
