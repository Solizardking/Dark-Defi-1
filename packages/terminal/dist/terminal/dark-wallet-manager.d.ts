/**
 * Dark Wallet Manager
 * Terminal interface for managing privacy-preserving wallets
 */
import { DarkProtocolClient } from '../protocol/client';
import { DarkWallet } from '../protocol/wallet';
export declare class DarkWalletManager {
    private client;
    private theme;
    private saplingWallet?;
    constructor(client: DarkProtocolClient, theme: any);
    /**
     * Setup wallet (create or import)
     */
    setupWallet(action: 'new' | 'import' | 'key'): Promise<DarkWallet>;
    /**
     * Show wallet management interface
     */
    show(wallet: DarkWallet): Promise<void>;
    /**
     * Show wallet balances
     */
    private showBalances;
    /**
     * Shield tokens (public → private)
     */
    private shieldTokens;
    /**
     * Unshield tokens (private → public)
     */
    private unshieldTokens;
    /**
     * Private transfer
     */
    private privateTransfer;
    /**
     * Manage Sapling addresses
     */
    private manageSaplingAddresses;
    /**
     * Export wallet keys
     */
    private exportKeys;
    /**
     * Show wallet QR code
     */
    private showQRCode;
    /**
     * Confirm mnemonic
     */
    private confirmMnemonic;
    /**
     * Press any key to continue
     */
    private pressAnyKey;
}
//# sourceMappingURL=dark-wallet-manager.d.ts.map