import { z } from 'zod'

// What new __name__ data must look like, shared by forms, {{#hono}}the API routes{{/hono}}{{^hono}}the server functions{{/hono}} and tests. Replace the example field.
export const new__Item__Schema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(200),
})

export type New__Item__ = z.infer<typeof new__Item__Schema>
