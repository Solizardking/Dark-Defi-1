/**
 * Dark Protocol SDK - Comprehensive Usage Examples
 *
 * This file demonstrates all major features of the Dark Protocol SDK including:
 * - Client initialization
 * - Wallet creation and management
 * - Zcash Sapling address generation
 * - Privacy operations (shield/unshield)
 * - Private transfers
 * - Jupiter swap integration
 * - AI agent registration and usage
 * - Note encryption and decryption
 */
import { Keypair, PublicKey } from '@solana/web3.js';
import { DarkProtocolClient, DarkWallet, PrivateSwapManager, AIAgentManager, SaplingHDWallet, SaplingUtils, NoteEncryptionUtils, PrivacyUtils, } from './index';
/**
 * Example 1: Initialize Dark Protocol Client
 */
export async function example1_InitializeClient() {
    console.log('Example 1: Initialize Dark Protocol Client\n');
    // Option 1: Simple initialization with API key
    const client1 = await DarkProtocolClient.create({
        heliusApiKey: process.env.HELIUS_API_KEY || 'your-api-key',
        network: 'devnet',
    });
    // Option 2: With secure RPC
    const client2 = await DarkProtocolClient.create({
        heliusApiKey: process.env.HELIUS_API_KEY || 'your-api-key',
        network: 'devnet',
        useSecureRpc: true,
    });
    // Option 3: With custom RPC URL
    const client3 = await DarkProtocolClient.create({
        heliusApiKey: process.env.HELIUS_API_KEY || 'your-api-key',
        rpcUrl: 'https://custom-rpc.example.com',
        programId: new PublicKey('3KWLFYco7T2rUZkzjSSthjHGmbWmo9HAsRmvupDTomGC'),
    });
    console.log('✓ Clients initialized successfully\n');
    return client1;
}
/**
 * Example 2: Create and Manage Wallets
 */
export async function example2_CreateWallet(client) {
    console.log('Example 2: Create and Manage Wallets\n');
    // Generate new wallet with mnemonic
    const { wallet: newWallet, mnemonic } = await DarkWallet.generate(client);
    console.log('Generated Wallet:');
    console.log('  Public Key:', newWallet.publicKey.toBase58());
    console.log('  Mnemonic:', mnemonic);
    console.log('  ⚠️  SAVE THIS MNEMONIC SECURELY!\n');
    // Restore wallet from mnemonic
    const restoredWallet = await DarkWallet.fromMnemonic(client, mnemonic, 0 // account index
    );
    console.log('✓ Wallet restored from mnemonic\n');
    // Create wallet from private key
    const privateKey = new Uint8Array(64); // Your private key
    const walletFromKey = DarkWallet.fromPrivateKey(client, privateKey);
    return newWallet;
}
/**
 * Example 3: Zcash Sapling Address System
 */
export async function example3_SaplingAddresses() {
    console.log('Example 3: Zcash Sapling Address System\n');
    // Generate new Sapling wallet
    const { wallet, mnemonic } = await SaplingUtils.generateWallet();
    console.log('Sapling Wallet Generated:');
    console.log('  Mnemonic:', mnemonic);
    // Get spending key (NEVER share this!)
    const spendingKey = wallet.getSpendingKey();
    console.log('  Spending Key:', Buffer.from(spendingKey.toBytes()).toString('hex'));
    // Get full viewing key (safe to store)
    const fvk = wallet.getFullViewingKey();
    console.log('  Full Viewing Key:', Buffer.from(fvk.toBytes()).toString('hex'));
    // Get default payment address
    const defaultAddress = wallet.getDefaultAddress();
    console.log('  Default Address:', defaultAddress.toBase58());
    // Generate diversified addresses (unlimited!)
    const addresses = wallet.generateDiversifiedAddresses(5);
    console.log('\nDiversified Addresses:');
    addresses.forEach((addr, i) => {
        console.log(`    ${i + 1}. ${addr.toBase58()}`);
    });
    console.log('\n✓ Sapling addresses generated successfully\n');
    return wallet;
}
/**
 * Example 4: Shield and Unshield Tokens
 */
export async function example4_ShieldUnshield(client, wallet) {
    console.log('Example 4: Shield and Unshield Tokens\n');
    // Shield tokens (move from public to private)
    console.log('Shielding 1 SOL...');
    const shieldTx = await wallet.shieldTokens(BigInt(1000000000), // 1 SOL in lamports
    PublicKey.default // SOL token mint
    );
    console.log('  Shield Transaction:', shieldTx);
    // Wait for confirmation
    await client.connection.confirmTransaction(shieldTx);
    console.log('  ✓ Tokens shielded\n');
    // Check shielded balance
    const state = await wallet.getState();
    console.log('Wallet State:');
    console.log('  Shielded Balance:', state.shieldedBalance.toString());
    console.log('  Transparent Balance:', state.transparentBalance.toString());
    console.log('  Active Notes:', state.notes.length);
    // Unshield tokens (move from private to public)
    const nullifier = new Uint8Array(32);
    const proof = new Uint8Array(256);
    console.log('\nUnshielding 0.5 SOL...');
    const unshieldTx = await wallet.unshieldTokens(BigInt(500000000), // 0.5 SOL
    nullifier, proof);
    console.log('  Unshield Transaction:', unshieldTx);
    console.log('  ✓ Tokens unshielded\n');
}
/**
 * Example 5: Private Transfers
 */
export async function example5_PrivateTransfer(wallet) {
    console.log('Example 5: Private Transfers\n');
    const recipientAddress = new PublicKey('RecipientPublicKeyHere...');
    // Execute private transfer
    console.log('Sending private transfer...');
    const transferTx = await wallet.privateTransfer(recipientAddress, BigInt(250000000), // 0.25 SOL
    'Secret payment' // Optional encrypted memo
    );
    console.log('  Transfer Transaction:', transferTx);
    console.log('  ✓ Private transfer completed\n');
}
/**
 * Example 6: Private Swaps with Jupiter
 */
export async function example6_PrivateSwaps(client, userPublicKey) {
    console.log('Example 6: Private Swaps with Jupiter\n');
    const swapManager = new PrivateSwapManager(client, {
        jupiterApiKey: process.env.JUPITER_API_KEY,
    });
    // Define swap parameters
    const inputMint = new PublicKey('So11111111111111111111111111111111111111112'); // SOL
    const outputMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC
    // Get quote
    console.log('Getting Jupiter quote...');
    const quote = await swapManager.getQuote(inputMint, outputMint, BigInt(1000000000), // 1 SOL
    50 // 0.5% slippage
    );
    console.log('  Input:', quote.inputAmount.toString(), 'lamports');
    console.log('  Output:', quote.outputAmount.toString(), 'tokens');
    console.log('  Price Impact:', quote.priceImpactPct, '%');
    // Execute private swap
    console.log('\nExecuting private swap...');
    const swapTx = await swapManager.executePrivateSwap({
        inputMint,
        outputMint,
        inputAmount: BigInt(1000000000),
        minOutputAmount: quote.outputAmount,
        slippageBps: 50,
        userPublicKey,
    });
    console.log('  Swap Transaction:', swapTx);
    console.log('  ✓ Private swap completed\n');
}
/**
 * Example 7: AI Agent Integration
 */
export async function example7_AIAgents(client, owner) {
    console.log('Example 7: AI Agent Integration\n');
    const aiManager = new AIAgentManager(client, process.env.REDPILL_API_KEY);
    // Register new AI agent
    const agentKeypair = Keypair.generate();
    const teeAttestation = {
        measurement: new Uint8Array(32),
        timestamp: Date.now(),
        signature: new Uint8Array(64),
    };
    const capabilities = [
        { type: 'swap', enabled: true, maxAmount: BigInt(10000000000), requiresApproval: false },
        { type: 'transfer', enabled: true, maxAmount: BigInt(5000000000), requiresApproval: true },
    ];
    console.log('Registering AI agent...');
    const registerTx = await aiManager.registerAgent({
        agentPubkey: agentKeypair.publicKey,
        teeAttestation,
        capabilities,
        owner,
    });
    console.log('  Registration Transaction:', registerTx);
    // Get agent info
    const agentInfo = await aiManager.getAgent(agentKeypair.publicKey);
    console.log('  Agent Info:', agentInfo);
    // Request AI analysis
    console.log('\nRequesting portfolio analysis...');
    const analysis = await aiManager.requestAnalysis({
        agentPubkey: agentKeypair.publicKey,
        dataType: 'portfolio',
        encryptedData: new TextEncoder().encode(JSON.stringify({ balance: 1000 })),
    });
    console.log('  Analysis Result:', analysis);
    console.log('  ✓ AI agent operations completed\n');
}
/**
 * Example 8: Note Encryption and Decryption
 */
export async function example8_NoteEncryption(saplingWallet) {
    console.log('Example 8: Note Encryption and Decryption\n');
    // Get recipient address
    const recipientAddress = saplingWallet.getDefaultAddress();
    const senderOvk = saplingWallet.getFullViewingKey().ovk;
    // Create encrypted note
    console.log('Creating encrypted note...');
    const encryptedNote = await NoteEncryptionUtils.createEncryptedNote({
        recipientAddress,
        value: BigInt(1000000000),
        memo: 'Private payment for services',
        senderOvk,
    });
    console.log('  Note Commitment:', Buffer.from(encryptedNote.cm).toString('hex'));
    console.log('  Ephemeral Public Key:', Buffer.from(encryptedNote.epk).toString('hex'));
    console.log('  Encrypted Ciphertext Length:', encryptedNote.encCiphertext.length);
    // Try to decrypt note
    console.log('\nDecrypting note...');
    const ivk = saplingWallet.getIncomingViewingKey();
    const h_sig = new Uint8Array(32); // Signature hash
    const plaintext = await NoteEncryptionUtils.tryDecryptNote(encryptedNote, ivk, h_sig);
    if (plaintext) {
        console.log('  ✓ Note decrypted successfully');
        console.log('  Value:', plaintext.value.toString());
        console.log('  Memo:', NoteEncryptionUtils.memoToString(plaintext.memo));
    }
    console.log('\n✓ Note encryption completed\n');
}
/**
 * Example 9: Privacy Utilities
 */
export async function example9_PrivacyUtils() {
    console.log('Example 9: Privacy Utilities\n');
    // Generate commitment and nullifier
    const commitment = PrivacyUtils.generateCommitment();
    const nullifier = PrivacyUtils.generateNullifier();
    console.log('Generated:');
    console.log('  Commitment:', Buffer.from(commitment).toString('hex'));
    console.log('  Nullifier:', Buffer.from(nullifier).toString('hex'));
    // Generate viewing key
    const viewingKey = PrivacyUtils.generateViewingKey();
    console.log('  Viewing Key:', Buffer.from(viewingKey).toString('hex'));
    // Create ephemeral account for unlinkable transactions
    const ephemeralAccount = PrivacyUtils.createEphemeralAccount();
    console.log('\nEphemeral Account:');
    console.log('  Public Key:', ephemeralAccount.publicKey.toBase58());
    console.log('  Expires At:', new Date(ephemeralAccount.expiresAt).toISOString());
    // Encrypt and decrypt memo
    const memo = 'This is a secret message';
    const sharedSecret = new Uint8Array(32);
    crypto.getRandomValues(sharedSecret);
    const encrypted = await PrivacyUtils.encryptMemo(memo, sharedSecret);
    console.log('\nEncrypted Memo:', Buffer.from(encrypted).toString('hex'));
    const decrypted = await PrivacyUtils.decryptMemo(encrypted, sharedSecret);
    console.log('Decrypted Memo:', decrypted);
    console.log('\n✓ Privacy utilities demonstrated\n');
}
/**
 * Example 10: Complete Privacy Workflow
 */
export async function example10_CompleteWorkflow() {
    console.log('Example 10: Complete Privacy Workflow\n');
    // 1. Initialize client
    const client = await DarkProtocolClient.create({
        heliusApiKey: process.env.HELIUS_API_KEY || 'your-api-key',
        network: 'devnet',
        useSecureRpc: true,
    });
    console.log('✓ Client initialized');
    // 2. Create Solana wallet
    const { wallet, mnemonic } = await DarkWallet.generate(client);
    console.log('✓ Solana wallet created:', wallet.publicKey.toBase58());
    // 3. Create Sapling wallet
    const saplingWallet = await SaplingHDWallet.fromMnemonic(mnemonic);
    const saplingAddress = saplingWallet.getDefaultAddress();
    console.log('✓ Sapling address:', saplingAddress.toBase58());
    // 4. Initialize shielded address on-chain
    const fvk = saplingWallet.getFullViewingKey();
    const ivk = fvk.inViewingKey();
    const initTx = await wallet.initializeShieldedAddress(ivk.ivk, new Uint8Array(32) // spending key commitment
    );
    console.log('✓ Shielded address initialized:', initTx);
    // 5. Shield tokens
    const shieldTx = await wallet.shieldTokens(BigInt(1000000000), PublicKey.default);
    console.log('✓ Tokens shielded:', shieldTx);
    // 6. Private transfer
    const recipient = new PublicKey('RecipientPublicKeyHere...');
    const transferTx = await wallet.privateTransfer(recipient, BigInt(250000000), 'Private payment');
    console.log('✓ Private transfer:', transferTx);
    console.log('\n✓ Complete workflow finished!\n');
}
/**
 * Run all examples
 */
export async function runAllExamples() {
    console.log('='.repeat(60));
    console.log('Dark Protocol SDK - Complete Examples');
    console.log('='.repeat(60));
    console.log();
    try {
        // Example 1: Initialize client
        const client = await example1_InitializeClient();
        // Example 2: Create wallet
        const wallet = await example2_CreateWallet(client);
        // Example 3: Sapling addresses
        const saplingWallet = await example3_SaplingAddresses();
        // Example 4: Shield/Unshield
        // await example4_ShieldUnshield(client, wallet);
        // Example 5: Private transfers
        // await example5_PrivateTransfer(wallet);
        // Example 6: Private swaps
        // await example6_PrivateSwaps(client, wallet.publicKey);
        // Example 7: AI agents
        // await example7_AIAgents(client, wallet.publicKey);
        // Example 8: Note encryption
        await example8_NoteEncryption(saplingWallet);
        // Example 9: Privacy utilities
        await example9_PrivacyUtils();
        // Example 10: Complete workflow
        // await example10_CompleteWorkflow();
        console.log('='.repeat(60));
        console.log('All examples completed successfully!');
        console.log('='.repeat(60));
    }
    catch (error) {
        console.error('Error running examples:', error);
    }
}
// Run examples if executed directly
if (require.main === module) {
    runAllExamples().catch(console.error);
}
//# sourceMappingURL=examples.js.map