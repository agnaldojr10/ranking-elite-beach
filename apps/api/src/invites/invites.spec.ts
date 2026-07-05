import { describe, expect, it } from 'vitest';
import { InvitesService } from './invites.service';

describe('InvitesService.hashCode', () => {
  it('é determinístico (mesma entrada → mesmo hash)', () => {
    expect(InvitesService.hashCode('ABCD-EFGH')).toBe(InvitesService.hashCode('ABCD-EFGH'));
  });

  it('difere para códigos diferentes e é sha256 hex (64 chars)', () => {
    const h = InvitesService.hashCode('ABCD-EFGH');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toBe(InvitesService.hashCode('ABCD-EFGX'));
  });
});

describe('InvitesService.newCode', () => {
  it('gera no formato XXXX-XXXX-XXXX sem caracteres ambíguos', () => {
    for (let i = 0; i < 20; i++) {
      const code = InvitesService.newCode();
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTVWXYZ23456789]{4}$/);
      // sem 0/O/1/I/L/U (ambíguos)
      expect(code).not.toMatch(/[01ILOU]/);
    }
  });
});
