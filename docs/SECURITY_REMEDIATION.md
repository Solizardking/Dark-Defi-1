# Security Remediation Runbook

This document records the May 2026 security hardening sweep and the
procedure for purging exposed credentials from git history.

## Summary

During the privacy-hardening pass on branch
`claude/solana-ai-privacy-hardening-YKstV`:

- `.npmrc` at the repo root contained a live npm publish token
  (`npm_NLIK6d2…`). The token is in commits `aa2740807`, `c8ff02825`, and
  `2bda635ca`.
- `.claude/settings.json` echoed the same token inside 4 separate `curl`
  command allowlist entries and recorded a personal absolute path
  (`/Users/8bit/bots/Cladwbot-solana/…`).
- The vendored `magicblock-engine-examples-main/` directory (725 files)
  was tracked despite being listed in `.gitignore`.
- Twelve docs files contained absolute paths under `/Users/8bit/…`.

## What the hardening commit changes

| File | Action |
|------|--------|
| `.npmrc` | Untracked. Working-tree placeholder is now a safe no-token version. |
| `.claude/settings.json` | Untracked. Local Claude Code config — never committed. |
| `magicblock-engine-examples-main/` | Untracked (still in `.gitignore`). Fetch upstream separately. |
| `docs/**` | Personal `/Users/8bit/...` paths replaced with `<path-to>/Dark-Defi/...`. |
| `README.md`, `CONTRIBUTING.md` | GitHub URLs point to `x402agent/dark-defi`. |
| `.gitleaks.toml` | New — secret-scan config. |
| `.github/workflows/ci.yml` | New `secrets` job runs gitleaks on every push/PR. |
| `SECURITY.md` | Rotation runbook + historical-exposure log. |

## Required follow-up actions

1. **Rotate the npm token NOW.** Even after this commit lands, the leaked
   token remains valid until it is revoked at npm.
   - Go to <https://www.npmjs.com/settings/~/tokens>.
   - Delete the publish token whose prefix begins `npm_NLIK6d2…`.
   - Issue a new one, scoped to the `@openclawdsol` org only, with
     publish-only permissions. Set an expiry.
   - Store it as a GitHub Actions secret named `NPM_TOKEN` — never in the
     working tree.

2. **(Optional, destructive) Purge from history.** The token remains in
   reachable history. Three options:

   - **Preferred:** Revoke and let history stand. The token is invalid
     after revocation; leaving history intact preserves contributor blame
     and other archeology.

   - **Rewrite history with `git filter-repo`.** Destructive: rewrites
     all commits that touched `.npmrc` or `.claude/settings.json`.
     Requires a force-push and breaks anyone with an existing clone or
     open PR. Run only with full team coordination:

     ```bash
     pip install git-filter-repo
     git filter-repo --invert-paths \
       --path .npmrc \
       --path .claude/settings.json
     # Then force-push to all remotes after coordinating with collaborators.
     git push --force-with-lease origin --all
     git push --force-with-lease origin --tags
     ```

   - **Re-publish the repo.** For very small histories, archive the old
     repo and start a fresh one from the current scrubbed tree. Heaviest
     option; usually not worth it after revocation.

3. **Audit npm registry events.** `npm token list` and the
   `https://www.npmjs.com/settings/~/audit-events` page show usage of the
   compromised token. Look for unfamiliar IPs or unexpected publishes.

## Verification

After applying this branch:

```bash
# 1. Confirm working tree has no live secrets
gitleaks detect --config .gitleaks.toml --redact --verbose

# 2. Confirm sensitive files are no longer tracked
git ls-files .npmrc .claude/settings.json && echo "BAD — still tracked"
# (Expect: empty output, no "BAD")

# 3. Confirm vendored MagicBlock is no longer tracked
git ls-files magicblock-engine-examples-main | wc -l
# (Expect: 0)
```
