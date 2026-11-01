# Releasing

How a version gets to npm, the one-time setup, and what to do when something goes wrong.

## How it works
1. Changes land on `main` through pull requests, and CI must pass.
2. A release pull request bumps the version (`npm version x.y.z --no-git-tag-version`) and completes CHANGELOG.md.
3. You publish a GitHub Release with the tag `vx.y.z`. Then `.github/workflows/release.yml`:
   - checks that the tag matches package.json;
   - runs typecheck, the unit tests, the build, `verify:package` and two real projects;
   - runs `npm publish`.
4. npm trusts that workflow directly (trusted publishing over OIDC), so no npm token exists anywhere. Every version
   gets a provenance statement on npm that links it to the run that built it.

Projects created earlier pick up new agent files with `<run> kit:update` (`npx create-agent-ready-app@latest update`).

## One-time setup

### 1. The GitHub repository
package.json points at `github.com/ahtserhsuddav/create-agent-ready-app`; npm trusted publishing requires
`repository.url` to match the repository exactly, and the release workflow checks it.
```sh
git add -A && git commit -m "Initial release: create-agent-ready-app 0.1.0"
gh repo create ahtserhsuddav/create-agent-ready-app --public --source . --remote origin --push \
  --description "Create a TanStack Start or Next.js app that coding agents are ready to work in: only the add-ons you pick, official agent skills from the stack's makers, kept up to date." \
  --homepage https://www.npmjs.com/package/create-agent-ready-app
gh repo edit ahtserhsuddav/create-agent-ready-app --delete-branch-on-merge \
  --add-topic tanstack-start,nextjs,react,typescript,create-app,cli,starter-kit,boilerplate,agent-skills,agents-md \
  --add-topic ai-agents,claude-code,coding-agents,skills-sh,hono,drizzle-orm,better-auth,shadcn-ui,cloudflare-workers,bun
gh api -X PUT repos/ahtserhsuddav/create-agent-ready-app/private-vulnerability-reporting   # SECURITY.md sends reports here
gh api -X PUT repos/ahtserhsuddav/create-agent-ready-app/vulnerability-alerts              # Dependabot alerts
```
Then, in the repository's **Settings**:
- **Environments → New environment** named `npm`: Deployment branches and tags → Selected → add a **Tag** rule `v*`.
- **Rules → Rulesets:**
  - a branch ruleset for `main`: block force pushes and deletions; require a pull request with 0 approvals and the
    `check` status;
  - a tag ruleset for `v*`: restrict creations, updates and deletions, with yourself on the bypass list.
- **Advanced Security:** Dependabot security updates and CodeQL code scanning (default setup).

### 2. npm
The maintainer is the npm user `uddav.shr` (2FA on). `npm login` once on your machine.

### 3. The first publish, by hand
npm can only connect a trusted publisher to a package that already exists, so 0.1.0 is published from a terminal:
1. package.json has no `"private": true` (it was removed for this publish).
2. `npm view create-agent-ready-app` answering 404 means the name is still free.
3. From a clean checkout of `main`: `bun install --frozen-lockfile && bun run build && bun run verify:package`.
4. `npm publish --dry-run`, then `npm publish`.
5. Create the GitHub Release `v0.1.0` on the published commit. The release workflow sees 0.1.0 is already on npm and
   stops without publishing.

What to expect:
- **Run it in an interactive terminal.** npm asks for your second factor in the browser only in a real terminal; in a
  script or an agent's shell it fails with `EOTP`.
- **A new package goes through processing first** ("Your package is being processed…"). Until then the registry
  shows a placeholder version, `0.0.0-stage`. The first package went live about a minute later.

### 4. The trusted publisher (on the day of the first release through CI)
A new trusted publisher expires if it doesn't publish within 2 days, so create it the day you release 0.1.1:
```sh
npm trust github create-agent-ready-app --file release.yml --repo ahtserhsuddav/create-agent-ready-app --env npm --allow-publish --yes
```
(Run it in a terminal: it asks for your second factor.) Or npmjs.com → the package → Settings → Trusted Publisher →
GitHub Actions: user `ahtserhsuddav`, repository `create-agent-ready-app`, workflow `release.yml`, environment `npm`,
allow npm publish.

### 5. Lock it down
Once a release through GitHub has published: npmjs.com → the package → Settings → Publishing access → **Require
two-factor authentication and disallow tokens**.

## Every release
1. **Prepare** on a branch: `npm version x.y.z --no-git-tag-version`, the CHANGELOG lines, and a green
   `bun run verify:build`, `bun run verify:docs` and `bun run verify:skills`. Open a pull request and merge it. (An
   agent can do this part with the `release` skill.)
2. **Release:** GitHub → Releases → Draft a new release → tag `vx.y.z` on `main` → paste the CHANGELOG lines →
   Publish release.
3. **Check:** Actions → Release passes, and `npm view create-agent-ready-app version` shows the new version.

Pre-releases: a version like `0.2.0-beta.1` with **Set as a pre-release** is published under the `next` tag.

## Versions
While on 0.x, a breaking change (a flag removed or renamed, a different generated layout, a raised Node or Bun
minimum) bumps the minor; anything else bumps the patch. 1.0.0 comes once the flags and the generated layout are
stable.

## When something goes wrong
- **`ENEEDAUTH` at publish:** the trusted publisher's fields must match exactly (owner, repository, `release.yml`,
  environment `npm`, npm publish allowed). Expired after 2 days without a publish? Delete it and create it again.
- **"does not match package.json version":** the tag must be `v` plus package.json's version. Delete the release and
  its tag, fix it, then release again.
- **A broken version went out:** publish a fixed patch, then
  `npm deprecate create-agent-ready-app@x.y.z "Broken, use x.y.z+1"`.
- **The weekly canary opened an issue:** see CONTRIBUTING.md.
