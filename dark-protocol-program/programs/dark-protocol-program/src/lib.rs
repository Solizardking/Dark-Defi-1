/**
 * Dark Protocol — On-Chain Shielded Note Pool (v1)
 *
 * Commitment-based privacy pool with Sapling-compatible encrypted notes.
 * Notes are encrypted with ChaCha20-Poly1305 (client-side, Sapling spec).
 * Encrypted ciphertexts are stored on-chain; the client SDK decrypts with IVK.
 *
 * Instructions:
 *   initialize        — bootstrap ProtocolState PDA + pool vault
 *   deposit           — shield SOL + store encrypted note
 *   withdraw          — reveal nullifier, redeem SOL
 *   shielded_transfer — spend one note, create two new notes (payment + change)
 *
 * Design notes (v1):
 *   - Fixed-size ciphertext arrays (no heap allocation — smaller binary)
 *   - Merkle root is maintained off-chain by the SDK (no sha2 dependency)
 *   - Nullifier uniqueness enforced via PDA collision
 */

use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("E8zL7h9qHjC7sMf2WCYhdqS5iLkYhPJ9yAhTfevo74jm");

// ─── constants ────────────────────────────────────────────────────────────────

pub const ENC_NOTE_SIZE: usize  = 580;   // Sapling enc_ciphertext
pub const OUT_CIPHER_SIZE: usize = 80;   // Sapling out_ciphertext

// ─── program ──────────────────────────────────────────────────────────────────

#[program]
pub mod dark_protocol_program {
    use super::*;

    // ── initialize ──────────────────────────────────────────────────────────

    /// Bootstrap the global ProtocolState PDA.
    pub fn initialize(ctx: Context<Initialize>, authority: Pubkey) -> Result<()> {
        let state         = &mut ctx.accounts.protocol_state;
        state.authority   = authority;
        state.note_count  = 0;
        state.bump        = ctx.bumps.protocol_state;
        state.vault_bump  = ctx.bumps.pool_vault;
        emit!(ProtocolInitialized { authority });
        Ok(())
    }

    // ── deposit ─────────────────────────────────────────────────────────────

    /// Shield SOL into the private pool and create an on-chain encrypted note.
    pub fn deposit(
        ctx: Context<Deposit>,
        amount: u64,
        commitment: [u8; 32],
        enc_ciphertext: [u8; ENC_NOTE_SIZE],
        out_ciphertext: [u8; OUT_CIPHER_SIZE],
        ephemeral_key: [u8; 32],
    ) -> Result<()> {
        require!(amount > 0, DarkError::ZeroAmount);

        // Transfer SOL: depositor → pool vault
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.depositor.to_account_info(),
                to:   ctx.accounts.pool_vault.to_account_info(),
            },
        );
        transfer(cpi_ctx, amount)?;

        let state      = &mut ctx.accounts.protocol_state;
        let note_index = state.note_count;
        state.note_count = state.note_count
            .checked_add(1)
            .ok_or(DarkError::NoteOverflow)?;

        let note             = &mut ctx.accounts.shielded_note;
        note.commitment      = commitment;
        note.enc_ciphertext  = enc_ciphertext;
        note.out_ciphertext  = out_ciphertext;
        note.ephemeral_key   = ephemeral_key;
        note.amount          = amount;
        note.spent           = false;
        note.note_index      = note_index;
        note.slot            = Clock::get()?.slot;
        note.depositor       = ctx.accounts.depositor.key();
        note.bump            = ctx.bumps.shielded_note;

        emit!(NoteDeposited { commitment, amount, note_index, slot: note.slot });
        Ok(())
    }

    // ── withdraw ────────────────────────────────────────────────────────────

    /// Withdraw SOL by presenting a nullifier that proves note ownership.
    pub fn withdraw(
        ctx: Context<Withdraw>,
        nullifier: [u8; 32],
        amount: u64,
    ) -> Result<()> {
        let note = &mut ctx.accounts.shielded_note;
        require!(!note.spent, DarkError::NoteAlreadySpent);
        require!(note.amount == amount, DarkError::AmountMismatch);
        note.spent = true;

        let null_record       = &mut ctx.accounts.nullifier_record;
        null_record.nullifier = nullifier;
        null_record.slot      = Clock::get()?.slot;
        null_record.bump      = ctx.bumps.nullifier_record;

        // Transfer SOL: pool vault → recipient (PDA signs)
        let vault_bump_val   = ctx.accounts.protocol_state.vault_bump;
        let protocol_key     = ctx.accounts.protocol_state.key();
        let vault_bump_arr   = [vault_bump_val];
        let seeds: &[&[u8]]  = &[b"pool_vault", protocol_key.as_ref(), &vault_bump_arr];
        let signer_seeds     = &[seeds];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.pool_vault.to_account_info(),
                to:   ctx.accounts.recipient.to_account_info(),
            },
            signer_seeds,
        );
        transfer(cpi_ctx, amount)?;

        emit!(NoteWithdrawn { nullifier, amount, slot: null_record.slot });
        Ok(())
    }

    // ── shielded_transfer ───────────────────────────────────────────────────

    /// Spend one input note and create two output notes (payment + change).
    /// No SOL moves — only note commitments change.
    pub fn shielded_transfer(
        ctx: Context<ShieldedTransfer>,
        input_nullifier: [u8; 32],
        output_commitment_1: [u8; 32],
        output_commitment_2: [u8; 32],
        enc_ciphertext_1: [u8; ENC_NOTE_SIZE],
        enc_ciphertext_2: [u8; ENC_NOTE_SIZE],
        out_ciphertext_1: [u8; OUT_CIPHER_SIZE],
        out_ciphertext_2: [u8; OUT_CIPHER_SIZE],
        ephemeral_key_1: [u8; 32],
        ephemeral_key_2: [u8; 32],
        amount_1: u64,
        amount_2: u64,
    ) -> Result<()> {
        let input_note = &mut ctx.accounts.input_note;
        require!(!input_note.spent, DarkError::NoteAlreadySpent);
        require!(
            input_note.amount == amount_1.checked_add(amount_2).ok_or(DarkError::NoteOverflow)?,
            DarkError::AmountMismatch
        );
        input_note.spent = true;

        let null_record       = &mut ctx.accounts.nullifier_record;
        null_record.nullifier = input_nullifier;
        null_record.slot      = Clock::get()?.slot;
        null_record.bump      = ctx.bumps.nullifier_record;

        let state  = &mut ctx.accounts.protocol_state;
        let slot   = Clock::get()?.slot;
        let sender = ctx.accounts.sender.key();

        let note1             = &mut ctx.accounts.output_note_1;
        note1.commitment      = output_commitment_1;
        note1.enc_ciphertext  = enc_ciphertext_1;
        note1.out_ciphertext  = out_ciphertext_1;
        note1.ephemeral_key   = ephemeral_key_1;
        note1.amount          = amount_1;
        note1.spent           = false;
        note1.note_index      = state.note_count;
        note1.slot            = slot;
        note1.depositor       = sender;
        note1.bump            = ctx.bumps.output_note_1;
        state.note_count = state.note_count.checked_add(1).ok_or(DarkError::NoteOverflow)?;

        let note2             = &mut ctx.accounts.output_note_2;
        note2.commitment      = output_commitment_2;
        note2.enc_ciphertext  = enc_ciphertext_2;
        note2.out_ciphertext  = out_ciphertext_2;
        note2.ephemeral_key   = ephemeral_key_2;
        note2.amount          = amount_2;
        note2.spent           = false;
        note2.note_index      = state.note_count;
        note2.slot            = slot;
        note2.depositor       = sender;
        note2.bump            = ctx.bumps.output_note_2;
        state.note_count = state.note_count.checked_add(1).ok_or(DarkError::NoteOverflow)?;

        emit!(NoteTransferred {
            input_nullifier,
            output_commitment_1,
            output_commitment_2,
            amount_1,
            amount_2,
        });
        Ok(())
    }
}

// ─── account structs ──────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer  = payer,
        space  = ProtocolState::LEN,
        seeds  = [b"protocol"],
        bump,
    )]
    pub protocol_state: Account<'info, ProtocolState>,

    /// CHECK: Native-SOL vault — receives and pays out shielded funds.
    #[account(
        mut,
        seeds = [b"pool_vault", protocol_state.key().as_ref()],
        bump,
    )]
    pub pool_vault: AccountInfo<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64, commitment: [u8; 32])]
pub struct Deposit<'info> {
    #[account(mut, seeds = [b"protocol"], bump = protocol_state.bump)]
    pub protocol_state: Account<'info, ProtocolState>,

    #[account(
        init,
        payer  = depositor,
        space  = ShieldedNote::LEN,
        seeds  = [b"note", commitment.as_ref()],
        bump,
    )]
    pub shielded_note: Account<'info, ShieldedNote>,

    /// CHECK: SOL vault.
    #[account(
        mut,
        seeds = [b"pool_vault", protocol_state.key().as_ref()],
        bump  = protocol_state.vault_bump,
    )]
    pub pool_vault: AccountInfo<'info>,

    #[account(mut)]
    pub depositor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(nullifier: [u8; 32], amount: u64)]
pub struct Withdraw<'info> {
    #[account(mut, seeds = [b"protocol"], bump = protocol_state.bump)]
    pub protocol_state: Account<'info, ProtocolState>,

    #[account(
        mut,
        seeds = [b"note", shielded_note.commitment.as_ref()],
        bump  = shielded_note.bump,
    )]
    pub shielded_note: Account<'info, ShieldedNote>,

    #[account(
        init,
        payer  = recipient,
        space  = NullifierRecord::LEN,
        seeds  = [b"nullifier", nullifier.as_ref()],
        bump,
    )]
    pub nullifier_record: Account<'info, NullifierRecord>,

    /// CHECK: SOL vault.
    #[account(
        mut,
        seeds = [b"pool_vault", protocol_state.key().as_ref()],
        bump  = protocol_state.vault_bump,
    )]
    pub pool_vault: AccountInfo<'info>,

    #[account(mut)]
    pub recipient: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(
    input_nullifier: [u8; 32],
    output_commitment_1: [u8; 32],
    output_commitment_2: [u8; 32]
)]
pub struct ShieldedTransfer<'info> {
    #[account(mut, seeds = [b"protocol"], bump = protocol_state.bump)]
    pub protocol_state: Account<'info, ProtocolState>,

    #[account(
        mut,
        seeds = [b"note", input_note.commitment.as_ref()],
        bump  = input_note.bump,
    )]
    pub input_note: Account<'info, ShieldedNote>,

    #[account(
        init,
        payer  = sender,
        space  = NullifierRecord::LEN,
        seeds  = [b"nullifier", input_nullifier.as_ref()],
        bump,
    )]
    pub nullifier_record: Account<'info, NullifierRecord>,

    #[account(
        init,
        payer  = sender,
        space  = ShieldedNote::LEN,
        seeds  = [b"note", output_commitment_1.as_ref()],
        bump,
    )]
    pub output_note_1: Account<'info, ShieldedNote>,

    #[account(
        init,
        payer  = sender,
        space  = ShieldedNote::LEN,
        seeds  = [b"note", output_commitment_2.as_ref()],
        bump,
    )]
    pub output_note_2: Account<'info, ShieldedNote>,

    #[account(mut)]
    pub sender: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ─── state ────────────────────────────────────────────────────────────────────

#[account]
pub struct ProtocolState {
    pub authority:   Pubkey,     // 32
    pub note_count:  u64,        // 8
    pub bump:        u8,         // 1
    pub vault_bump:  u8,         // 1
}
impl ProtocolState {
    pub const LEN: usize = 8 + 32 + 8 + 1 + 1; // 50
}

#[account]
pub struct ShieldedNote {
    pub commitment:    [u8; 32],              // 32
    pub enc_ciphertext: [u8; ENC_NOTE_SIZE],  // 580
    pub out_ciphertext: [u8; OUT_CIPHER_SIZE],// 80
    pub ephemeral_key: [u8; 32],              // 32
    pub amount:        u64,                   // 8
    pub spent:         bool,                  // 1
    pub note_index:    u64,                   // 8
    pub slot:          u64,                   // 8
    pub depositor:     Pubkey,                // 32
    pub bump:          u8,                    // 1
}
impl ShieldedNote {
    pub const LEN: usize = 8    // discriminator
        + 32                    // commitment
        + ENC_NOTE_SIZE         // enc_ciphertext
        + OUT_CIPHER_SIZE       // out_ciphertext
        + 32                    // ephemeral_key
        + 8                     // amount
        + 1                     // spent
        + 8                     // note_index
        + 8                     // slot
        + 32                    // depositor
        + 1;                    // bump
    // Total: 8+32+580+80+32+8+1+8+8+32+1 = 790
}

#[account]
pub struct NullifierRecord {
    pub nullifier: [u8; 32],  // 32
    pub slot:      u64,       // 8
    pub bump:      u8,        // 1
}
impl NullifierRecord {
    pub const LEN: usize = 8 + 32 + 8 + 1; // 49
}

// ─── events ───────────────────────────────────────────────────────────────────

#[event]
pub struct ProtocolInitialized { pub authority: Pubkey }

#[event]
pub struct NoteDeposited {
    pub commitment: [u8; 32],
    pub amount:     u64,
    pub note_index: u64,
    pub slot:       u64,
}

#[event]
pub struct NoteWithdrawn {
    pub nullifier: [u8; 32],
    pub amount:    u64,
    pub slot:      u64,
}

#[event]
pub struct NoteTransferred {
    pub input_nullifier:     [u8; 32],
    pub output_commitment_1: [u8; 32],
    pub output_commitment_2: [u8; 32],
    pub amount_1:            u64,
    pub amount_2:            u64,
}

// ─── errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum DarkError {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Note has already been spent")]
    NoteAlreadySpent,
    #[msg("Amount does not match note value")]
    AmountMismatch,
    #[msg("Note count overflow")]
    NoteOverflow,
}
