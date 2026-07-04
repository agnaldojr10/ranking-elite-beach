import { z } from 'zod';

/** Validação das variáveis de ambiente na inicialização da API. */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_TTL: z.coerce.number().default(900),
  JWT_REFRESH_TTL: z.coerce.number().default(604800),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  // Rate-limit (anti brute-force). Janela em segundos; limites por IP.
  THROTTLE_TTL: z.coerce.number().default(60),
  THROTTLE_LIMIT: z.coerce.number().default(120),
  AUTH_THROTTLE_LIMIT: z.coerce.number().default(10),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = EnvSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Configuração inválida: ${parsed.error.message}`);
  }
  return parsed.data;
}
