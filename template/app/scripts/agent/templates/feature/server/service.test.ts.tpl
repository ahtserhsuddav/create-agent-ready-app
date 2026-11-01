import { describe, expect, test } from 'vitest'
import { create__Item__, list__Name__ } from '#/features/__name__/server/service'
import { createTestDb } from '#/server/db/drizzle/test-client'

describe('__name__ service', () => {
  test('creates an item and lists it', async () => {
    const db = await createTestDb()
    await create__Item__(db, { name: 'First' })
    expect((await list__Name__(db)).map((row) => row.name)).toEqual(['First'])
  })
})
