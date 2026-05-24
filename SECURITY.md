# Security Policy

## Status

Dark DeFi is **alpha software**. The cryptographic and on-chain components are
unaudited. Do not use it on mainnet with real funds without an independent
audit. See the "Implementation Status" section of the [README](README.md) for
the current maturity of each subsystem.

## Reporting a vulnerability

**Do not open a public issue for security vulnerabilities.**

Please report them privately using
[GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
("Report a vulnerability" under the repository's **Security** tab).

When reporting, include:

- A description of the issue and its impact
- Steps to reproduce (proof-of-concept where possible)
- Affected package(s), version, or commit

We aim to acknowledge reports within a few days and will coordinate a fix
and disclosure timeline with you.

## Handling secrets

- Never commit API keys, private keys, mnemonics, or `.env` files.
- Keep local secrets in `.secrets/` (gitignored) — see `.env.example`.
- For publishing, keep your real `.npmrc` in `~/.npmrc` (user-global) or
  `.npmrc.local` (gitignored). The repo `.npmrc.example` documents the format.
- CI must inject `NODE_AUTH_TOKEN` via GitHub Actions secrets — never inline.
- If you believe a credential was committed, **rotate it immediately**. A
  value that appears anywhere in git history must be treated as compromised
  even after the file is removed.

### CI secret scanning

Every push runs [`gitleaks`](https://github.com/gitleaks/gitleaks) via
`.github/workflows/ci.yml`. Local dry-run:

```bash
gitleaks detect --config .gitleaks.toml --redact --verbose
```

## Credential rotation runbook

If a credential is exposed (committed, posted, screenshotted, etc.):

1. **Revoke** the credential at the issuer immediately. Treat the value as
   leaked even if you delete the commit — git history, mirrors, forks, and
   crawlers may already have it.
2. **Issue a new credential** scoped as narrowly as possible (publish-only,
   single package, expiring).
3. **Audit usage** — for npm tokens, check `npm token list` and look for
   unfamiliar `tfa` or IP entries. For Solana keys, scan recent transactions.
4. **Document** the incident in the project's internal log (date, reach,
   resolution) without re-publishing the leaked value.

### Known historical exposures

The following credentials previously appeared in this repo's git history. If
you are an operator with access to the affected accounts, rotate
**immediately** if you have not already:

| Date scrubbed | File(s) | Credential type | Action required |
|---------------|---------|-----------------|-----------------|
| 2026-05-24    | `.npmrc`, `.claude/settings.json` | npm publish token starting `npm_NLIK6d2…` | Revoke at <https://www.npmjs.com/settings/~/tokens> and rotate. |

The current working tree is clean. To purge from history, see
[`docs/SECURITY_REMEDIATION.md`](docs/SECURITY_REMEDIATION.md).
