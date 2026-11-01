---
name: release
description: "Prepares a new version of create-agent-ready-app: version bump, changelog, full verification, release notes. Use when asked to release, publish or cut a version. Publishing itself is the maintainer's step."
---

# Release

GitHub Actions publishes to npm (`.github/workflows/release.yml`) when the maintainer publishes a GitHub Release.
Never run `npm publish`, push, tag or create a release yourself. Prepare everything, then hand over.

## Prepare (on a branch)
1. **Pick the version.** While on 0.x, a breaking change gets a minor bump (`0.3.0`). Breaking means a flag removed or
   renamed, a different generated layout, or a raised Node or Bun minimum. Anything else gets a patch (`0.2.1`).
2. **Bump it:** `npm version <x.y.z> --no-git-tag-version`. package.json is the only place the version lives.
3. **CHANGELOG.md:** the new version has one line per change.
4. **Verify:** `bun run typecheck && bun run lint && bun run test && bun run build && bun run verify:package`, then the full
   `bun run verify:build` and `bun run verify:docs`. Fix templates until both pass.
5. **Draft the release notes** from the version's CHANGELOG lines. Commit `Release x.y.z` only if the maintainer asked
   for commits.

## Hand over
Tell the maintainer to:
1. Merge the pull request.
2. Open GitHub → Releases → Draft a new release, and create tag `vx.y.z` on `main`.
3. Paste the notes and click Publish.

The workflow checks that the tag matches package.json, re-runs the checks, and publishes with provenance.
RELEASING.md has the one-time setup and troubleshooting.

## After
`npm view create-agent-ready-app version` shows the new version, and
`npx create-agent-ready-app@latest --version` prints it.
