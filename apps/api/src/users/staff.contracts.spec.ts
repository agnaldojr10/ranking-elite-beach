import { describe, expect, it } from 'vitest';
import { CreateStaffUserSchema, StaffRoleSchema, UpdateStaffUserSchema } from '@reb/contracts';

describe('CreateStaffUserSchema', () => {
  it('aceita e-mail + senha (>=8) + papel; papel default ADMIN', () => {
    const r = CreateStaffUserSchema.safeParse({ email: 'a@b.com', password: '12345678' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.role).toBe('ADMIN');
  });

  it('rejeita senha curta e e-mail inválido', () => {
    expect(CreateStaffUserSchema.safeParse({ email: 'a@b.com', password: '123' }).success).toBe(false);
    expect(CreateStaffUserSchema.safeParse({ email: 'nao-email', password: '12345678' }).success).toBe(false);
  });

  it('só aceita papéis de staff (ADMIN/ORGANIZER)', () => {
    expect(StaffRoleSchema.options).toEqual(['ADMIN', 'ORGANIZER']);
    expect(CreateStaffUserSchema.safeParse({ email: 'a@b.com', password: '12345678', role: 'PLAYER' }).success).toBe(false);
    expect(CreateStaffUserSchema.safeParse({ email: 'a@b.com', password: '12345678', role: 'ORGANIZER' }).success).toBe(true);
  });
});

describe('UpdateStaffUserSchema', () => {
  it('aceita atualização parcial (só isActive, só role, ou ambos)', () => {
    expect(UpdateStaffUserSchema.safeParse({ isActive: false }).success).toBe(true);
    expect(UpdateStaffUserSchema.safeParse({ role: 'ADMIN' }).success).toBe(true);
    expect(UpdateStaffUserSchema.safeParse({}).success).toBe(true);
  });

  it('rejeita papel fora de staff', () => {
    expect(UpdateStaffUserSchema.safeParse({ role: 'VIEWER' }).success).toBe(false);
  });
});
