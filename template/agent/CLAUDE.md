@AGENTS.md

## Claude Code only
- Skills live in `.agents/skills/`; `.claude/skills/` links to them (`{{run}} prepare` re-creates the kit's links,
  `{{run}} skills:update` refreshes the community skills).
- No plan mode unless the human asks. No subagents for searches one `rg` can answer.
