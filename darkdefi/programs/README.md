# DarkDefi Programs Map

Last checked: 2026-05-08

This folder contains the on-chain programs, TypeScript client code, an off-chain oracle worker, and vendored Metaplex code used by the DarkDefi/SolanaOS stack.

## Deployment Summary

Deployment status was checked with `solana program show` against devnet and mainnet-beta on 2026-05-08. "Cost" is the rent-exempt SOL balance held by the upgradeable program account when deployed, or the local rent estimate for built artifacts that are not currently deployed.

| Folder | Program ID | Type | Devnet | Mainnet-beta | Cost / Balance | What it does |
| --- | --- | --- | --- | --- | --- | --- |
| `solana-ai-inference` | `3xFBRCtk5hxeLWzHvwyDg2B67RHoA9JFTKmHPzzccBVc` | Anchor program | Not found | Not found | Local build estimate: 3.06217728 SOL for `target/deploy/solana_ai_inference.so` | AI model registry, validator staking, inference requests, protocol fee handling, DNA/data submissions, slashing, and rewards. |
| `clawd-stake` | `5bp3bDnWYdjiYyB99XWWi6h8ga2wnB1TxuRUb4VNJrTn` | Anchor program | Deployed | Not found | Devnet balance: 2.4095868 SOL. Local rent estimate: 2.4092736 SOL | Staking program for Metaplex Agent/Core assets. Tracks positions, distributes CLAWD rewards, shares deposited SOL gacha fees, and supports claim/unstake. |
| `mpl-corenft-staking` | `7AFH2R2vAowRbYxLJnS5eRazZxQyHcMD9VTJKEFsjpdZ` | Anchor program | Deployed | Not found | Devnet balance: 2.06253336 SOL | Minimal Core NFT staking registry. Records owner, asset, collection, and global stake count. No reward engine. |
| `agent-minter` | `agnmDKzZkv63sRhPFvm3iWpxaopgTRcohXA6CSYSXvQ` | Anchor program | Deployed | Deployed | Devnet balance: 2.79984792 SOL. Mainnet balance: 2.80107288 SOL | Reference AI-agent token minter. Creates a MAR1O mint, asks `solana-gpt-oracle` for responses, and mints tokens through oracle callbacks. |
| `solana-gpt-oracle` | `LLMrieZMpbJFwN52WgmBNMxYojrpRVYXdC1RCweEbab` | Anchor program | Deployed | Deployed | Devnet balance: 2.17144344 SOL. Mainnet balance: 1.97984856 SOL | On-chain interaction/context router for LLM calls. Stores prompts and routes oracle responses into callback programs. |
| `token-launcher` | `funvWGBmpr8N7pTNqpxkWPgWnQbL3Yr5vzCHNJT2YkL` | Anchor program source | Not found | Not found | No deployed program found | Simple token launchpad: initialize global config, mint launched SPL tokens, create Token Metadata metadata, and store fee/reserve config. |
| `solana-contracts` | `TLaunDAP1sZks8dGmcNWHxdAgzMuiYzKg87mfjHRFzM` | TypeScript instruction builder | Not found | Not found | No deployed program found | Client-side builder for a separate token launch program ID. This does not match `token-launcher`'s Rust `declare_id!`. |
| `llm_oracle` | Uses `solana-gpt-oracle::ID` | Off-chain Rust daemon | Not deployed as a program | Not deployed as a program | Runtime cost: RPC/WebSocket, OpenAI API usage, transaction fees, and priority fees | Watches `solana-gpt-oracle` interaction accounts, calls OpenAI, and sends callback transactions. |
| `client` | Multiple constants in `src/config.ts` | TypeScript SDK | Not deployed | Not deployed | Runtime cost only | Exposes program IDs, PDA helpers, AI inference client methods, ORE helpers, and network constants. |
| `mpl-token-metadata-main` | `metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s` | Vendored Metaplex Token Metadata | Public external program | Public external program | External program, not owned by this repo | Token/NFT metadata program used by `agent-minter` and `token-launcher` CPI paths. |
| `target` | N/A | Build output | N/A | N/A | Contains local artifacts | Generated build/deploy artifacts for the top-level Anchor workspace. Do not treat it as source. |

## Workspace Layout

The top-level `programs/Cargo.toml` currently includes only:

```toml
members = [
    "solana-ai-inference",
    "clawd-stake"
]
```

The top-level `programs/Anchor.toml` maps `solana_ai_inference` and `clawd_stake` to localnet, devnet, and mainnet sections. The current provider cluster is devnet.

Standalone or separate workspace folders:

| Folder | Current status |
| --- | --- |
| `mpl-corenft-staking` | Has its own `Anchor.toml` and program ID mapping. |
| `agent-minter` | Separate Anchor crate, depends on `../solana-gpt-oracle` with CPI features. |
| `solana-gpt-oracle` | Separate Anchor crate, used by `agent-minter` and `llm_oracle`. |
| `token-launcher` | Has source, but is excluded from the top-level workspace and is not deployed under its declared ID. |
| `solana-contracts` | TypeScript-only instruction builders, not an Anchor/Rust program crate. |
| `client` | TypeScript SDK package. |
| `llm_oracle` | Off-chain worker binary. |
| `mpl-token-metadata-main` | Vendored Metaplex source and clients. |

## Communication Map

| From | To | How they communicate | Current evidence |
| --- | --- | --- | --- |
| `client` | `solana-ai-inference` | Anchor client/IDL constants and PDA helpers | `client/src/idl.ts` and `client/src/client.ts` use `3xFBRC...`. Chain account is not currently found on devnet/mainnet. |
| `client` | `clawd-stake` | Program ID constant for application integration | `client/src/config.ts` uses `5bp3...`, matching `clawd-stake/src/lib.rs` and devnet deployment. |
| `client` | `mpl-corenft-staking` | Program ID constant for app integration | `client/src/config.ts` uses `7AFH...`, matching `mpl-corenft-staking/src/lib.rs` and devnet deployment. |
| `agent-minter` | `solana-gpt-oracle` | Anchor CPI calls to `create_llm_context` and `interact_with_llm` | `agent-minter` depends on `solana-gpt-oracle` with `features = ["cpi"]`, and account constraints require `solana_gpt_oracle::ID`. |
| `llm_oracle` | `solana-gpt-oracle` | Watches program accounts by `solana_gpt_oracle::ID` and sends `callback_from_llm` transactions | `llm_oracle/src/main.rs` subscribes to `solana_gpt_oracle::ID`. |
| `solana-gpt-oracle` | callback programs | Stores callback program ID, discriminator, and account metas, then invokes the callback | `callback_from_llm` builds and invokes a callback instruction. |
| `token-launcher` | Metaplex Token Metadata | CPI through `create_metadata_accounts_v3` | Rust source invokes `mpl_token_metadata::instruction::create_metadata_accounts_v3`. |
| `agent-minter` | Metaplex Token Metadata | Anchor SPL metadata CPI | Rust source calls `create_metadata_accounts_v3`. |
| `clawd-stake` | Metaplex Core | Client-side freeze delegate is expected; program stores stake/reward state | README notes one pending TODO: on-chain verification of freeze delegate / AgentIdentity plugin before mainnet. |

## ID And Deployment Gaps To Fix

1. `solana-ai-inference` is configured in `Anchor.toml` and the TypeScript client, and has a local deploy artifact/keypair, but the declared program account was not found on devnet or mainnet-beta.
2. `token-launcher` declares `funvWGB...`, while `solana-contracts/src/token-launch-program.ts` targets `TLaunDAP...`. Neither account was found on devnet or mainnet-beta, so these cannot communicate until one canonical program ID is chosen and deployed.
3. `client/src/config.ts` now reflects that `agent-minter` and `solana-gpt-oracle` are deployed on devnet and mainnet-beta, but release notes and app docs should still be checked for stale "not deployed" language.
4. `clawd-stake` and `mpl-corenft-staking` are mapped under mainnet sections in Anchor config, but the accounts were not found on mainnet-beta.
5. `token-launcher/src/instructions/voice_launch.rs` references modules that are not present in the visible `token-launcher/src` tree (`state`, `utils::pumpfun_integration`). Treat that file as incomplete until those modules are restored or removed.

## Cost Notes

Program deployment cost on Solana is mostly rent-exempt balance for the upgradeable program data account plus transaction fees. Account initialization costs vary by instruction and account size.

Runtime costs by program:

| Program | Runtime costs |
| --- | --- |
| `solana-ai-inference` | User pays transaction fees and account rent for config/model/data/validator/inference/stake/DNA accounts. Protocol also charges `protocol_fee_bps`, default 250 bps, on inference payments. |
| `clawd-stake` | Users pay transaction fees and rent for stake positions/associated token accounts. Rewards come from CLAWD vault emissions and SOL deposited via `deposit_gacha_fees`. |
| `mpl-corenft-staking` | Users pay transaction fees and rent for the global pool/stake records. No protocol fee in source. |
| `agent-minter` | Users pay transaction fees and rent for agent/mint/context/interaction/token accounts. No explicit protocol fee in source. |
| `solana-gpt-oracle` | Users pay transaction fees and rent for context/interaction accounts. Off-chain oracle operator pays OpenAI API, RPC, callback transaction fees, and priority fee. |
| `token-launcher` | Users pay transaction fees and rent for global/mint/ATA/metadata accounts. Source stores `fee_basis_points`, but the visible `launch_token` path does not collect a fee. |

## Verification Commands

```sh
cd /Users/8bit/fraud/DarkDefi/programs
cargo check -p solana-ai-inference
cargo check -p clawd-stake
solana program show 5bp3bDnWYdjiYyB99XWWi6h8ga2wnB1TxuRUb4VNJrTn -u devnet
solana program show 7AFH2R2vAowRbYxLJnS5eRazZxQyHcMD9VTJKEFsjpdZ -u devnet
solana program show agnmDKzZkv63sRhPFvm3iWpxaopgTRcohXA6CSYSXvQ -u devnet
solana program show LLMrieZMpbJFwN52WgmBNMxYojrpRVYXdC1RCweEbab -u devnet
```
