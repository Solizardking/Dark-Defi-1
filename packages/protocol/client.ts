import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
// import { createHelius } from 'helius-sdk'; // Not used in current version
import type { DarkProtocol } from './types/dark_protocol';
import { DARK_PROTOCOL_PROGRAM_ID } from './programs';

export type Network = 'devnet' | 'mainnet' | 'localnet';

export interface DarkProtocolConfig {
  heliusApiKey: string;
  network?: Network;
  useSecureRpc?: boolean;
  jupiterApiKey?: string;
  redpillApiKey?: string;
  rpcUrl?: string;
  programId?: PublicKey;
  commitment?: 'processed' | 'confirmed' | 'finalized';
}

export class DarkProtocolClient {
  public readonly connection: Connection;
  public readonly program: Program<any>;
  public readonly helius: any;
  public readonly config: DarkProtocolConfig;

  private constructor(
    connection: Connection,
    program: Program<any>,
    helius: any,
    config: DarkProtocolConfig
  ) {
    this.connection = connection;
    this.program = program;
    this.helius = helius;
    this.config = config;
  }

  /**
   * Create a new Dark Protocol client
   */
  static async create(config: DarkProtocolConfig): Promise<DarkProtocolClient> {
    // Determine RPC URL based on network and secure RPC preference
    let rpcUrl: string;
    if (config.rpcUrl) {
      rpcUrl = config.rpcUrl;
    } else {
      const network = config.network || 'mainnet';
      const useSecure = config.useSecureRpc || false;

      const secureRpcUrl = process.env.HELIUS_SECURE_RPC_URL;
      if (network === 'devnet') {
        rpcUrl = useSecure && secureRpcUrl
          ? secureRpcUrl
          : `https://devnet.helius-rpc.com/?api-key=${config.heliusApiKey}`;
      } else if (network === 'mainnet') {
        rpcUrl = useSecure && secureRpcUrl
          ? secureRpcUrl
          : `https://mainnet.helius-rpc.com/?api-key=${config.heliusApiKey}`;
      } else {
        rpcUrl = 'http://localhost:8899';
      }
    }

    const connection = new Connection(rpcUrl, config.commitment || 'confirmed');

    // Create Helius client (not used in current version)
    const helius = null as any;

    // Load program IDL and create Anchor program
    const programId = config.programId || new PublicKey(DARK_PROTOCOL_PROGRAM_ID);
    const provider = new AnchorProvider(connection, {} as any, {
      commitment: config.commitment || 'confirmed'
    });

    // Load IDL (in production, fetch from chain or bundle)
    const idl = await DarkProtocolClient.loadIdl();

    // Create Anchor Program instance
    // For Anchor 0.30.0: new Program(idl, programId, provider)
    // We pass programId directly to avoid IDL address parsing issues
    const program = new Program(idl as any, programId as any, provider as any) as any;

    return new DarkProtocolClient(connection, program, helius, config);
  }

  /**
   * Load program IDL
   */
  private static async loadIdl(): Promise<Idl> {
    // Return a minimal valid IDL structure without address field
    // The address will be passed separately to the Program constructor
    // In production, this would be fetched from chain or bundled
    return {
      version: '0.1.0',
      name: 'dark_protocol',
      instructions: [],
      accounts: []
    } as any as Idl;
  }

  /**
   * Get protocol state
   */
  async getProtocolState(): Promise<any> {
    const [protocolPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('protocol')],
      this.program.programId
    );

    return await (this.program.account as any).protocolState.fetch(protocolPDA);
  }

  /**
   * Get merkle tree state
   */
  async getMerkleTree(): Promise<any> {
    const [merkleTreePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('merkle_tree')],
      this.program.programId
    );

    return await (this.program.account as any).merkleTree.fetch(merkleTreePDA);
  }

  /**
   * Create smart transaction with Helius
   */
  async createSmartTx(params: {
    instructions: any[];
    signers: Keypair[];
    feePayer?: PublicKey;
  }) {
    // Helius smart transactions not used in this version
    return null as any;
  }

  /**
   * Get shielded address for a user
   */
  async getShieldedAddress(owner: PublicKey): Promise<any> {
    const [shieldedAddressPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('shielded_address'), owner.toBuffer()],
      this.program.programId
    );

    try {
      return await (this.program.account as any).shieldedAddress.fetch(shieldedAddressPDA);
    } catch {
      return null;
    }
  }

  /**
   * Get AI agent info
   */
  async getAIAgent(agentPubkey: PublicKey): Promise<any> {
    const [aiAgentPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('ai_agent'), agentPubkey.toBuffer()],
      this.program.programId
    );

    try {
      return await (this.program.account as any).aiAgent.fetch(aiAgentPDA);
    } catch {
      return null;
    }
  }
}
