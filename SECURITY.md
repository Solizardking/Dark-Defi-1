# Security Policy

## Status

Dark DeFi Terminal is **alpha software**. The cryptographic and on-chain
components are unaudited. Do not use it on mainnet with real funds without
an independent audit. See the "Status & Security" section of the
[README](README.md) for the current maturity of each subsystem.

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
- If you believe a credential was committed, rotate it immediately; values
  in git history must be considered compromised even after removal.
