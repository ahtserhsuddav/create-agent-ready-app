## What and why


## Checks
- [ ] `bun run typecheck`, `bun run lint` and `bun run test` pass
- [ ] Template change: I read the official docs first (`template-sources.json`), and `bun run build && bun run verify:build --only <combination>` passes for each affected combination
- [ ] An add-on's files have a `when` rule in `manifest.json`, and its lines in shared files sit inside `{{#flag}}` blocks
- [ ] One line in CHANGELOG.md
