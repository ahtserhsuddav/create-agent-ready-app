// Every Drizzle table, for typed queries{{#auth}} and Better Auth{{/auth}}. drizzle-kit reads each tables.ts file directly.
// {{#auth}}
export * from '#/server/auth/better-auth/tables'
// {{/auth}}
// {{^auth}}
export {}
// {{/auth}}
// agent-ready:feature-tables
