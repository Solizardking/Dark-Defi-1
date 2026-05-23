/**
 * Dark Protocol Anchor IDL Types
 * These are placeholder types until the actual IDL is generated
 */
import { PublicKey } from '@solana/web3.js';
import { Idl } from '@coral-xyz/anchor';
export interface DarkProtocol extends Idl {
    address: string;
    metadata: {
        name: 'dark_protocol';
        version: '0.1.0';
        spec: '0.1.0';
    };
    instructions: Array<any>;
    accounts: Array<{
        name: 'protocolState' | 'merkleTree' | 'shieldedAddress' | 'aiAgent';
        discriminator: number[];
    }>;
    types: Array<any>;
    errors: Array<any>;
}
export type ProtocolState = {
    authority: PublicKey;
    merkleRoot: number[];
    totalCommitments: bigint;
    paused: boolean;
};
export type MerkleTree = {
    root: number[];
    leafCount: number;
    depth: number;
};
export type ShieldedAddress = {
    owner: PublicKey;
    viewingKey: number[];
    spendingKeyCommitment: number[];
    diversifier: number[];
    createdAt: bigint;
    bump: number;
};
export type Note = {
    commitment: number[];
    nullifierHash: number[];
    amount: bigint;
    tokenMint: PublicKey;
    encryptedMemo: number[];
    createdAt: bigint;
    spent: boolean;
    bump: number;
};
//# sourceMappingURL=dark_protocol.d.ts.map