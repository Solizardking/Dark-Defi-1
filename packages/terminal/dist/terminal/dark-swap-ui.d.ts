/**
 * Dark Swap UI
 * Terminal interface for privacy-preserving token swaps
 */
import { PrivateSwapManager } from '../Protocol/swap';
import { DarkWallet } from '../Protocol/wallet';
export declare class DarkSwapUI {
    private swapManager;
    private theme;
    private swapHistory;
    constructor(swapManager: PrivateSwapManager, theme: any);
    /**
     * Show swap interface
     */
    show(wallet: DarkWallet): Promise<void>;
    /**
     * Execute a private swap
     */
    private executeSwap;
    /**
     * Get a quote without executing
     */
    private getQuote;
    /**
     * Show swap history
     */
    private showHistory;
    /**
     * Press any key to continue
     */
    private pressAnyKey;
}
//# sourceMappingURL=dark-swap-ui.d.ts.map