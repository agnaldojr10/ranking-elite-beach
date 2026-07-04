import { describe, expect, it } from 'vitest';
import { HttpException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { toErrorResponse } from './all-exceptions.filter';

describe('toErrorResponse', () => {
  it('repassa HttpException que já vem no formato { error: {...} }', () => {
    const ex = new UnauthorizedException({
      error: { code: 'USER_NOT_FOUND', message: 'Usuário não encontrado' },
    });
    const { status, body } = toErrorResponse(ex);
    expect(status).toBe(401);
    expect(body).toEqual({
      error: { code: 'USER_NOT_FOUND', message: 'Usuário não encontrado' },
    });
  });

  it('mapeia ThrottlerException para 429 RATE_LIMITED', () => {
    const { status, body } = toErrorResponse(new ThrottlerException());
    expect(status).toBe(429);
    expect(body.error.code).toBe('RATE_LIMITED');
  });

  it('mapeia HttpException "cru" para code derivado do status', () => {
    const { status, body } = toErrorResponse(new NotFoundException('Nada aqui'));
    expect(status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Nada aqui');
  });

  it('junta array de mensagens do Nest em uma string', () => {
    const ex = new HttpException({ message: ['a', 'b'], statusCode: 400 }, 400);
    const { body } = toErrorResponse(ex);
    expect(body.error.message).toBe('a; b');
  });

  it('erro inesperado vira 500 INTERNAL_ERROR sem vazar detalhes', () => {
    const { status, body } = toErrorResponse(new Error('segredo interno do banco'));
    expect(status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('Erro interno');
    expect(JSON.stringify(body)).not.toContain('segredo');
  });
});
