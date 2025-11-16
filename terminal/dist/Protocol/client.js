"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DarkProtocolClient = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
class DarkProtocolClient {
    constructor(connection, program, helius, config) {
        this.connection = connection;
        this.program = program;
        this.helius = helius;
        this.config = config;
    }
    /**
     * Create a new Dark Protocol client
     */
    static async create(config) {
        // Determine RPC URL based on network and secure RPC preference
        let rpcUrl;
        if (config.rpcUrl) {
            rpcUrl = config.rpcUrl;
        }
        else {
            const network = config.network || 'mainnet';
            const useSecure = config.useSecureRpc || false;
            if (network === 'devnet') {
                rpcUrl = useSecure
                    ? 'https://cati-etnoqa-fast-devnet.helius-rpc.com'
                    : `https://devnet.helius-rpc.com/?api-key=${config.heliusApiKey}`;
            }
            else if (network === 'mainnet') {
                rpcUrl = useSecure
                    ? 'https://alli-pigt1b-fast-mainnet.helius-rpc.com'
                    : `https://mainnet.helius-rpc.com/?api-key=${config.heliusApiKey}`;
            }
            else {
                rpcUrl = 'http://localhost:8899';
            }
        }
        const connection = new web3_js_1.Connection(rpcUrl, config.commitment || 'confirmed');
        // Create Helius client (not used in current version)
        const helius = null;
        // Load program IDL and create Anchor program
        const programId = config.programId || new web3_js_1.PublicKey('DARKxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx');
        const provider = new anchor_1.AnchorProvider(connection, {}, {
            commitment: config.commitment || 'confirmed'
        });
        // Load IDL (in production, fetch from chain or bundle)
        const idl = await DarkProtocolClient.loadIdl();
        const program = new anchor_1.Program(idl, provider);
        // Set the program ID if needed
        if (config.programId) {
            program.programId = programId;
        }
        return new DarkProtocolClient(connection, program, helius, config);
    }
    /**
     * Load program IDL
     */
    static async loadIdl() {
        // In production, fetch from chain or bundle the IDL
        return {};
    }
    /**
     * Get protocol state
     */
    async getProtocolState() {
        const [protocolPDA] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('protocol')], this.program.programId);
        return await this.program.account.protocolState.fetch(protocolPDA);
    }
    /**
     * Get merkle tree state
     */
    async getMerkleTree() {
        const [merkleTreePDA] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('merkle_tree')], this.program.programId);
        return await this.program.account.merkleTree.fetch(merkleTreePDA);
    }
    /**
     * Create smart transaction with Helius
     */
    async createSmartTx(params) {
        // Helius smart transactions not used in this version
        return null;
    }
    /**
     * Get shielded address for a user
     */
    async getShieldedAddress(owner) {
        const [shieldedAddressPDA] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('shielded_address'), owner.toBuffer()], this.program.programId);
        try {
            return await this.program.account.shieldedAddress.fetch(shieldedAddressPDA);
        }
        catch {
            return null;
        }
    }
    /**
     * Get AI agent info
     */
    async getAIAgent(agentPubkey) {
        const [aiAgentPDA] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('ai_agent'), agentPubkey.toBuffer()], this.program.programId);
        try {
            return await this.program.account.aiAgent.fetch(aiAgentPDA);
        }
        catch {
            return null;
        }
    }
}
exports.DarkProtocolClient = DarkProtocolClient;
//# sourceMappingURL=client.js.map