"use strict";
/**
 * Dark Wallet Manager
 * Terminal interface for managing privacy-preserving wallets
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DarkWalletManager = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const qrcode_1 = __importDefault(require("qrcode"));
const wallet_1 = require("../Protocol/wallet");
const sapling_1 = require("../Protocol/sapling");
class DarkWalletManager {
    constructor(client, theme) {
        this.client = client;
        this.theme = theme;
    }
    /**
     * Setup wallet (create or import)
     */
    async setupWallet(action) {
        const spinner = (0, ora_1.default)('Setting up wallet...').start();
        try {
            let wallet;
            let mnemonic;
            switch (action) {
                case 'new': {
                    const result = await wallet_1.DarkWallet.generate(this.client);
                    wallet = result.wallet;
                    mnemonic = result.mnemonic;
                    spinner.succeed(this.theme.success('✓ New wallet created'));
                    // Display mnemonic with warning
                    console.log();
                    console.log(this.theme.danger('⚠️  SAVE THIS MNEMONIC PHRASE SECURELY ⚠️'));
                    console.log(this.theme.dim('━'.repeat(80)));
                    console.log();
                    console.log(this.theme.bold(mnemonic));
                    console.log();
                    console.log(this.theme.dim('━'.repeat(80)));
                    console.log(this.theme.warning('This phrase is the ONLY way to recover your wallet!'));
                    console.log(this.theme.warning('Never share it with anyone!'));
                    console.log();
                    await this.confirmMnemonic(mnemonic);
                    // Create Sapling wallet with same mnemonic
                    this.saplingWallet = await sapling_1.SaplingHDWallet.fromMnemonic(mnemonic);
                    break;
                }
                case 'import': {
                    const { mnemonicInput } = await inquirer_1.default.prompt([
                        {
                            type: 'password',
                            name: 'mnemonicInput',
                            message: 'Enter your mnemonic phrase:',
                            mask: '*',
                        },
                    ]);
                    spinner.start('Restoring wallet...');
                    wallet = await wallet_1.DarkWallet.fromMnemonic(this.client, mnemonicInput);
                    this.saplingWallet = await sapling_1.SaplingHDWallet.fromMnemonic(mnemonicInput);
                    spinner.succeed(this.theme.success('✓ Wallet restored'));
                    break;
                }
                case 'key': {
                    const { privateKeyHex } = await inquirer_1.default.prompt([
                        {
                            type: 'password',
                            name: 'privateKeyHex',
                            message: 'Enter your private key (hex):',
                            mask: '*',
                        },
                    ]);
                    spinner.start('Importing wallet...');
                    const privateKey = Buffer.from(privateKeyHex, 'hex');
                    wallet = wallet_1.DarkWallet.fromPrivateKey(this.client, privateKey);
                    spinner.succeed(this.theme.success('✓ Wallet imported'));
                    console.log();
                    console.log(this.theme.warning('⚠️  Sapling features unavailable (no mnemonic)'));
                    console.log();
                    break;
                }
            }
            return wallet;
        }
        catch (error) {
            spinner.fail(this.theme.danger(`Failed: ${error.message}`));
            throw error;
        }
    }
    /**
     * Show wallet management interface
     */
    async show(wallet) {
        let managing = true;
        while (managing) {
            console.log();
            console.log(this.theme.primary('💼 Wallet Manager'));
            console.log(this.theme.dim('═'.repeat(80)));
            console.log();
            const { action } = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: this.theme.bold('Wallet operations:'),
                    choices: [
                        { name: '👁️  View Balances', value: 'balances' },
                        { name: '🔐 Shield Tokens', value: 'shield' },
                        { name: '🔓 Unshield Tokens', value: 'unshield' },
                        { name: '📤 Private Transfer', value: 'transfer' },
                        { name: '🌳 Sapling Addresses', value: 'sapling' },
                        { name: '📋 Export Keys', value: 'export' },
                        { name: '📱 Show QR Code', value: 'qr' },
                        { name: '🔙 Back to Main Menu', value: 'back' },
                    ],
                },
            ]);
            switch (action) {
                case 'balances':
                    await this.showBalances(wallet);
                    break;
                case 'shield':
                    await this.shieldTokens(wallet);
                    break;
                case 'unshield':
                    await this.unshieldTokens(wallet);
                    break;
                case 'transfer':
                    await this.privateTransfer(wallet);
                    break;
                case 'sapling':
                    await this.manageSaplingAddresses();
                    break;
                case 'export':
                    await this.exportKeys(wallet);
                    break;
                case 'qr':
                    await this.showQRCode(wallet);
                    break;
                case 'back':
                    managing = false;
                    break;
            }
        }
    }
    /**
     * Show wallet balances
     */
    async showBalances(wallet) {
        const spinner = (0, ora_1.default)('Fetching balances...').start();
        try {
            const state = await wallet.getState();
            spinner.stop();
            console.log();
            console.log(this.theme.primary('💰 Wallet Balances'));
            console.log(this.theme.dim('─'.repeat(60)));
            console.log();
            console.log(this.theme.secondary(`Shielded Balance:     ${state.shieldedBalance} lamports`));
            console.log(this.theme.secondary(`                      ${Number(state.shieldedBalance) / 1e9} SOL`));
            console.log();
            console.log(this.theme.secondary(`Transparent Balance:  ${state.transparentBalance} lamports`));
            console.log(this.theme.secondary(`                      ${Number(state.transparentBalance) / 1e9} SOL`));
            console.log();
            console.log(this.theme.secondary(`Total Notes:          ${state.notes.length}`));
            console.log(this.theme.secondary(`Pending Notes:        ${state.pendingNotes.length}`));
            console.log();
            console.log(this.theme.dim('─'.repeat(60)));
            console.log();
            // Show shielded address info
            if (state.shieldedAddress) {
                console.log(this.theme.primary('🔐 Shielded Address:'));
                console.log(this.theme.dim(`  Owner: ${state.shieldedAddress.owner.toBase58()}`));
                console.log(this.theme.dim(`  Created: ${new Date(state.shieldedAddress.createdAt * 1000).toLocaleString()}`));
                console.log();
            }
        }
        catch (error) {
            spinner.fail(this.theme.danger(`Failed: ${error.message}`));
        }
        await this.pressAnyKey();
    }
    /**
     * Shield tokens (public → private)
     */
    async shieldTokens(wallet) {
        console.log();
        console.log(this.theme.accent('🔐 Shield Tokens'));
        console.log(this.theme.dim('Move tokens from transparent to shielded pool'));
        console.log();
        const { amount } = await inquirer_1.default.prompt([
            {
                type: 'number',
                name: 'amount',
                message: 'Amount to shield (SOL):',
                validate: (val) => val > 0 || 'Amount must be greater than 0',
            },
        ]);
        const { confirm } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: this.theme.warning(`Shield ${amount} SOL?`),
                default: false,
            },
        ]);
        if (!confirm) {
            console.log(this.theme.dim('\n✗ Cancelled\n'));
            return;
        }
        const spinner = (0, ora_1.default)('Shielding tokens...').start();
        try {
            const amountLamports = BigInt(Math.floor(amount * 1e9));
            const tx = await wallet.shieldTokens(amountLamports, this.client.program.programId);
            spinner.succeed(this.theme.success('✓ Tokens shielded successfully!'));
            console.log();
            console.log(this.theme.dim(`Transaction: ${tx}`));
            console.log();
        }
        catch (error) {
            spinner.fail(this.theme.danger(`Failed: ${error.message}`));
        }
        await this.pressAnyKey();
    }
    /**
     * Unshield tokens (private → public)
     */
    async unshieldTokens(wallet) {
        console.log();
        console.log(this.theme.accent('🔓 Unshield Tokens'));
        console.log(this.theme.dim('Move tokens from shielded to transparent pool'));
        console.log();
        const { amount } = await inquirer_1.default.prompt([
            {
                type: 'number',
                name: 'amount',
                message: 'Amount to unshield (SOL):',
                validate: (val) => val > 0 || 'Amount must be greater than 0',
            },
        ]);
        const { confirm } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: this.theme.warning(`Unshield ${amount} SOL?`),
                default: false,
            },
        ]);
        if (!confirm) {
            console.log(this.theme.dim('\n✗ Cancelled\n'));
            return;
        }
        const spinner = (0, ora_1.default)('Unshielding tokens...').start();
        try {
            const amountLamports = BigInt(Math.floor(amount * 1e9));
            const nullifier = crypto.getRandomValues(new Uint8Array(32));
            const proof = new Uint8Array(256); // Mock proof
            const tx = await wallet.unshieldTokens(amountLamports, nullifier, proof);
            spinner.succeed(this.theme.success('✓ Tokens unshielded successfully!'));
            console.log();
            console.log(this.theme.dim(`Transaction: ${tx}`));
            console.log();
        }
        catch (error) {
            spinner.fail(this.theme.danger(`Failed: ${error.message}`));
        }
        await this.pressAnyKey();
    }
    /**
     * Private transfer
     */
    async privateTransfer(wallet) {
        console.log();
        console.log(this.theme.accent('📤 Private Transfer'));
        console.log(this.theme.dim('Send shielded tokens privately'));
        console.log();
        const { recipient, amount, memo } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'recipient',
                message: 'Recipient address:',
            },
            {
                type: 'number',
                name: 'amount',
                message: 'Amount (SOL):',
                validate: (val) => val > 0 || 'Amount must be greater than 0',
            },
            {
                type: 'input',
                name: 'memo',
                message: 'Memo (optional):',
            },
        ]);
        const { confirm } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: this.theme.warning(`Send ${amount} SOL to ${recipient.slice(0, 16)}...?`),
                default: false,
            },
        ]);
        if (!confirm) {
            console.log(this.theme.dim('\n✗ Cancelled\n'));
            return;
        }
        const spinner = (0, ora_1.default)('Executing private transfer...').start();
        try {
            const amountLamports = BigInt(Math.floor(amount * 1e9));
            const tx = await wallet.privateTransfer(this.client.program.programId, amountLamports, memo || undefined);
            spinner.succeed(this.theme.success('✓ Transfer completed!'));
            console.log();
            console.log(this.theme.dim(`Transaction: ${tx}`));
            console.log();
        }
        catch (error) {
            spinner.fail(this.theme.danger(`Failed: ${error.message}`));
        }
        await this.pressAnyKey();
    }
    /**
     * Manage Sapling addresses
     */
    async manageSaplingAddresses() {
        if (!this.saplingWallet) {
            console.log();
            console.log(this.theme.warning('⚠️  Sapling wallet not available'));
            console.log(this.theme.dim('(Only available when created from mnemonic)'));
            console.log();
            await this.pressAnyKey();
            return;
        }
        console.log();
        console.log(this.theme.accent('🌳 Sapling Addresses'));
        console.log();
        const defaultAddr = this.saplingWallet.getDefaultAddress();
        console.log(this.theme.primary('Default Address:'));
        console.log(this.theme.dim(`  ${defaultAddr.toBase58()}`));
        console.log();
        const { action } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Action:',
                choices: [
                    { name: '✨ Generate Diversified Addresses', value: 'generate' },
                    { name: '🔑 View Keys', value: 'keys' },
                    { name: '🔙 Back', value: 'back' },
                ],
            },
        ]);
        if (action === 'generate') {
            const { count } = await inquirer_1.default.prompt([
                {
                    type: 'number',
                    name: 'count',
                    message: 'How many addresses?',
                    default: 5,
                    validate: (val) => (val > 0 && val <= 100) || 'Enter 1-100',
                },
            ]);
            const addresses = this.saplingWallet.generateDiversifiedAddresses(count);
            const table = new cli_table3_1.default({
                head: [this.theme.primary('#'), this.theme.primary('Address')],
                style: { head: [], border: [] },
            });
            addresses.forEach((addr, i) => {
                table.push([i + 1, addr.toBase58()]);
            });
            console.log();
            console.log(table.toString());
            console.log();
        }
        else if (action === 'keys') {
            console.log();
            console.log(this.theme.danger('⚠️  SENSITIVE INFORMATION - HANDLE WITH CARE ⚠️'));
            console.log();
            const { showKeys } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'showKeys',
                    message: 'Are you sure you want to view keys?',
                    default: false,
                },
            ]);
            if (showKeys) {
                const fvk = this.saplingWallet.getFullViewingKey();
                const ivk = this.saplingWallet.getIncomingViewingKey();
                console.log();
                console.log(this.theme.secondary('Full Viewing Key:'));
                console.log(this.theme.dim(`  ${fvk.toBase58()}`));
                console.log();
                console.log(this.theme.secondary('Incoming Viewing Key:'));
                console.log(this.theme.dim(`  ${ivk.toBase58()}`));
                console.log();
            }
        }
        await this.pressAnyKey();
    }
    /**
     * Export wallet keys
     */
    async exportKeys(wallet) {
        console.log();
        console.log(this.theme.danger('⚠️  EXPORT PRIVATE KEYS ⚠️'));
        console.log(this.theme.warning('Never share your private keys with anyone!'));
        console.log();
        const { confirm } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Are you sure you want to export keys?',
                default: false,
            },
        ]);
        if (!confirm) {
            console.log(this.theme.dim('\n✗ Cancelled\n'));
            return;
        }
        const exported = wallet.export();
        console.log();
        console.log(this.theme.primary('Exported Keys:'));
        console.log(this.theme.dim('─'.repeat(80)));
        console.log(this.theme.secondary(`Public Key:  ${exported.publicKey}`));
        console.log(this.theme.secondary(`Private Key: ${exported.privateKey}`));
        console.log(this.theme.dim('─'.repeat(80)));
        console.log();
        await this.pressAnyKey();
    }
    /**
     * Show wallet QR code
     */
    async showQRCode(wallet) {
        console.log();
        console.log(this.theme.primary('📱 Wallet QR Code'));
        console.log();
        try {
            const qrCode = await qrcode_1.default.toString(wallet.publicKey.toBase58(), {
                type: 'terminal',
                small: true,
            });
            console.log(qrCode);
            console.log();
            console.log(this.theme.dim(`Address: ${wallet.publicKey.toBase58()}`));
            console.log();
        }
        catch (error) {
            console.log(this.theme.danger(`Failed to generate QR code: ${error.message}`));
        }
        await this.pressAnyKey();
    }
    /**
     * Confirm mnemonic
     */
    async confirmMnemonic(mnemonic) {
        const words = mnemonic.split(' ');
        const randomIndex = Math.floor(Math.random() * words.length);
        const { confirmation } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'confirmation',
                message: `To confirm, enter word #${randomIndex + 1}:`,
            },
        ]);
        if (confirmation.trim().toLowerCase() !== words[randomIndex].toLowerCase()) {
            console.log(this.theme.danger('\n✗ Incorrect! Please write down your mnemonic carefully.'));
            await this.pressAnyKey();
        }
        else {
            console.log(this.theme.success('\n✓ Mnemonic confirmed!'));
        }
    }
    /**
     * Press any key to continue
     */
    async pressAnyKey() {
        await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'key',
                message: this.theme.dim('Press Enter to continue...'),
            },
        ]);
    }
}
exports.DarkWalletManager = DarkWalletManager;
//# sourceMappingURL=dark-wallet-manager.js.map