# Contributing to Dark DeFi Terminal

Thanks for your interest. This is alpha software dealing with cryptography and value transfer — please be deliberate.

## Ground rules

- **No secrets in commits.** `.secrets/`, `.env`, key JSONs, and mnemonic phrases never enter the tree. The repo's `.gitignore` blocks the obvious patterns; double-check `git diff --staged` before pushing.
- **Don't commit `dist/` or `node_modules/`.** Builds are reproducible from source.
- **Squash on merge.** Keep `main`'s history readable.

## Getting started

```bash
git clone https://github.com/8bitsats/darkterminal.git
cd darkterminal
npm install
npm run build
```

Set up your local secrets:

```bash
cp .env.example .secrets/.env
ln -sf ../../.secrets/.env packages/terminal/.env
```

## Making changes

1. Fork the repo and create a feature branch: `git checkout -b feat/short-description`.
2. Run `npm run build` and any package-level tests before committing.
3. Open a PR against `main`. Describe **what** changed and **why** — link issues if relevant.

## Commit style

```
<type>(<scope>): <subject>

<body explaining motivation>
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`, `ci`.
Scopes: `protocol`, `sdk`, `terminal`, `docs`, `repo`.

Example: `feat(sdk): add Birdeye fallback to PriceOracle`

## Reporting security issues

Do **not** open a public issue for vulnerabilities. Email the maintainers directly so we can coordinate a fix and disclosure.

## Code of conduct

Be civil. Critique code, not people. No racist, sexist, or otherwise bigoted behavior — that's an instant ban.
