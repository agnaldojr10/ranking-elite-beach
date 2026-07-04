import { z } from 'zod';
import { RoundStatusSchema } from './round';

/** Estado da fase final de um campeonato. */
export const FinalStateSchema = z.object({
  roundId: z.string(),
  number: z.number().int(),
  status: RoundStatusSchema,
  champion: z
    .object({
      teamId: z.string(),
      playerNames: z.array(z.string()),
    })
    .nullable(),
});
export type FinalState = z.infer<typeof FinalStateSchema>;
