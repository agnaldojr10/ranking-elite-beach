import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

/**
 * Pipe que valida o corpo/parâmetro contra um schema zod dos @reb/contracts.
 * Uso: @Body(new ZodValidationPipe(LoginRequestSchema)) dto: LoginRequest
 */
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: result.error.issues,
        },
      });
    }
    return result.data;
  }
}
