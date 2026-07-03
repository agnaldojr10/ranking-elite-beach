import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { LoginRequestSchema } from '@reb/contracts';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(LoginRequestSchema);

  it('aceita credenciais válidas', () => {
    const value = { email: 'a@b.com', password: '123456' };
    expect(pipe.transform(value)).toEqual(value);
  });

  it('rejeita e-mail inválido', () => {
    expect(() => pipe.transform({ email: 'nope', password: '123456' })).toThrow(
      BadRequestException,
    );
  });

  it('rejeita senha curta', () => {
    expect(() => pipe.transform({ email: 'a@b.com', password: '12' })).toThrow(
      BadRequestException,
    );
  });
});
