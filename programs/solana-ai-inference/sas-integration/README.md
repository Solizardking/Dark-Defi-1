# Solana AI Inference Attestations

This directory carries the upstream SAS attestation metadata for the
`solana_ai_inference` Anchor program. The copied `Anchor.toml` is a staging
reference from OnChain-Ai; the canonical Dark-Defi build mapping remains
`../../Anchor.toml`.

The inference layer uses Solana Attestation Service as a companion trust layer,
not as an inline CPI requirement. Clients should create or verify SAS accounts
alongside inference/model-registry transactions.

## SAS Integration

- SAS program: `22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG`
- Local source: `../../solana-attestation-service`
- Program source link: `../../solana-attestation-service/program`
- Frontend package: `sas-lib`
- Rust client: `../../solana-attestation-service/clients/rust`

## Schemas

- `CLAWD-GENESIS-MODEL-V1`
- `CLAWD-MODEL-REGISTRATION-V1`
- `DNA-ANALYSIS-PROOF`

The backend exposes the active config at:

```text
GET /api/attestations/sas-config
POST /api/attestations/sas-plan
```
