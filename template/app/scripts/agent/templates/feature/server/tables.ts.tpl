// {{#postgres}}
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

// __Title__ table. RLS is on: Supabase's public Data API can't read it, while the app (the table's owner) still can.
export const __camel__ = pgTable('__snake__', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}).enableRLS()
// {{/postgres}}
// {{#d1}}
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// __Title__ table.
export const __camel__ = sqliteTable('__snake__', {
  id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text().notNull(),
  createdAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
})
// {{/d1}}
