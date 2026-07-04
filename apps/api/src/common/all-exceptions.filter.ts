import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';

/** Formato de erro padronizado da API. */
export interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export interface ErrorResponse {
  status: number;
  body: ErrorBody;
}

/** Deriva um code estável a partir do status HTTP (ex.: 404 → NOT_FOUND). */
function codeFromStatus(status: number): string {
  const name = HttpStatus[status] as string | undefined;
  return name ?? 'ERROR';
}

/**
 * Mapeia qualquer exceção para o formato `{ error: { code, message, details? } }`.
 * Função pura (sem I/O) para ser testável isoladamente.
 */
export function toErrorResponse(exception: unknown): ErrorResponse {
  // Rate-limit: o Nest lança ThrottlerException (subclasse de HttpException).
  if (exception instanceof ThrottlerException) {
    return {
      status: HttpStatus.TOO_MANY_REQUESTS,
      body: {
        error: {
          code: 'RATE_LIMITED',
          message: 'Muitas requisições, tente novamente em instantes',
        },
      },
    };
  }

  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const res = exception.getResponse();

    // Já vem no nosso formato (services/pipe lançam `{ error: {...} }`).
    if (
      res &&
      typeof res === 'object' &&
      'error' in res &&
      typeof (res as { error: unknown }).error === 'object' &&
      (res as { error: unknown }).error !== null
    ) {
      return { status, body: res as ErrorBody };
    }

    // HttpException "cru" (string ou `{ message }` padrão do Nest).
    let message: string;
    if (typeof res === 'string') {
      message = res;
    } else if (res && typeof res === 'object' && 'message' in res) {
      const m = (res as { message: unknown }).message;
      message = Array.isArray(m) ? m.join('; ') : String(m);
    } else {
      message = exception.message;
    }

    return {
      status,
      body: { error: { code: codeFromStatus(status), message } },
    };
  }

  // Erro inesperado: não vaza detalhes/stack ao cliente.
  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    body: { error: { code: 'INTERNAL_ERROR', message: 'Erro interno' } },
  };
}

/** Filtro global que garante o formato de erro em todas as respostas. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, body } = toErrorResponse(exception);

    // Loga a causa real apenas no servidor quando for erro inesperado (5xx).
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        exception instanceof Error ? exception.stack ?? exception.message : String(exception),
      );
    }

    const response = host.switchToHttp().getResponse<Response>();
    response.status(status).json(body);
  }
}
