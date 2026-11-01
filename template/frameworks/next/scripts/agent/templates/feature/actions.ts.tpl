'use server'

import { type New__Item__, new__Item__Schema } from '#/features/__name__/schema'
import { create__Item__, list__Name__ } from '#/features/__name__/server/service'
import { getDb } from '#/server/db/drizzle/client'

// How client components read and write __name__ data: Server Actions, called like functions. Server Components call
// the service directly. For signed-in users only, check getSession() from #/server/auth/better-auth/session first.
export async function get__Name__() {
  return list__Name__(await getDb())
}

export async function save__Item__(input: New__Item__) {
  return create__Item__(await getDb(), new__Item__Schema.parse(input))
}
