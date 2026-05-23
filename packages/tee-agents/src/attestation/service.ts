import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  appendTransactionMessageInstruction,
  createTransactionMessage,
  getSignatureFromTransaction,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type Address,
  type Instruction,
  type Rpc,
  type RpcSubscriptions,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
  type TransactionSigner,
} from "@solana/kit";
import {
  deriveAttestationPda,
  deriveCredentialPda,
  deriveSchemaPda,
  fetchSchema,
  fetchAttestation,
  getCreateAttestationInstruction,
  getCreateCredentialInstruction,
  getCreateSchemaInstruction,
  serializeAttestationData,
  deserializeAttestationData,
} from "sas-lib";
import { DARK_CREDENTIAL_NAME, resolveEndpoints, type DarkNetwork } from "../config.js";
import type { SchemaDefinition } from "./schemas.js";

type RpcClient = {
  rpc: Rpc<SolanaRpcApi>;
  rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
};

export interface DarkAttestationServiceOptions {
  rpcUrl: string;
  rpcWsUrl: string;
}

/**
 * High-level client for anchoring Dark agent trust in the Solana Attestation
 * Service: create the Dark credential (issuer), register agent/receipt schemas,
 * and issue + read attestations.
 */
export class DarkAttestationService {
  private readonly rpc: Rpc<SolanaRpcApi>;
  private readonly rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;

  constructor(opts: DarkAttestationServiceOptions) {
    this.rpc = createSolanaRpc(opts.rpcUrl);
    this.rpcSubscriptions = createSolanaRpcSubscriptions(opts.rpcWsUrl);
  }

  static fromNetwork(network: DarkNetwork, heliusApiKey?: string): DarkAttestationService {
    const { http, ws } = resolveEndpoints(network, heliusApiKey);
    return new DarkAttestationService({ rpcUrl: http, rpcWsUrl: ws });
  }

  // ----- PDA derivation (offline) -----

  async credentialPda(authority: Address, name = DARK_CREDENTIAL_NAME): Promise<Address> {
    const [pda] = await deriveCredentialPda({ authority, name });
    return pda;
  }

  async schemaPda(credential: Address, def: SchemaDefinition<unknown>): Promise<Address> {
    const [pda] = await deriveSchemaPda({
      credential,
      name: def.name,
      version: def.version,
    });
    return pda;
  }

  async attestationPda(credential: Address, schema: Address, nonce: Address): Promise<Address> {
    const [pda] = await deriveAttestationPda({ credential, schema, nonce });
    return pda;
  }

  // ----- Lifecycle (on-chain) -----

  /** Create the Dark credential (issuer authority for all agent attestations). */
  async createCredential(params: {
    payer: TransactionSigner;
    authority: TransactionSigner;
    authorizedSigners: Address[];
    name?: string;
  }): Promise<{ signature: string; credential: Address }> {
    const name = params.name ?? DARK_CREDENTIAL_NAME;
    const credential = await this.credentialPda(params.authority.address, name);
    const ix = getCreateCredentialInstruction({
      payer: params.payer,
      authority: params.authority,
      credential,
      name,
      signers: params.authorizedSigners,
    });
    const signature = await this.send(params.payer, ix);
    return { signature, credential };
  }

  /** Register one of the Dark schemas under the credential. */
  async createSchema(params: {
    payer: TransactionSigner;
    authority: TransactionSigner;
    credential: Address;
    def: SchemaDefinition<unknown>;
  }): Promise<{ signature: string; schema: Address }> {
    const schema = await this.schemaPda(params.credential, params.def);
    const ix = getCreateSchemaInstruction({
      payer: params.payer,
      authority: params.authority,
      credential: params.credential,
      schema,
      name: params.def.name,
      description: params.def.description,
      layout: new Uint8Array(params.def.layout),
      fieldNames: params.def.fieldNames,
    });
    const signature = await this.send(params.payer, ix);
    return { signature, schema };
  }

  /** Issue an attestation. `data` is validated and serialized against the on-chain schema. */
  async attest<T extends Record<string, unknown>>(params: {
    payer: TransactionSigner;
    authority: TransactionSigner;
    credential: Address;
    schema: Address;
    nonce: Address;
    data: T;
    expiryUnixSeconds: number;
  }): Promise<{ signature: string; attestation: Address }> {
    const schemaAccount = await fetchSchema(this.rpc, params.schema);
    const attestation = await this.attestationPda(
      params.credential,
      params.schema,
      params.nonce
    );
    const ix = getCreateAttestationInstruction({
      payer: params.payer,
      authority: params.authority,
      credential: params.credential,
      schema: params.schema,
      attestation,
      nonce: params.nonce,
      data: serializeAttestationData(schemaAccount.data, params.data),
      expiry: BigInt(params.expiryUnixSeconds),
    });
    const signature = await this.send(params.payer, ix);
    return { signature, attestation };
  }

  /** Read and decode an attestation against its schema. */
  async readAttestation<T>(attestation: Address, schema: Address): Promise<T> {
    const [attAccount, schemaAccount] = await Promise.all([
      fetchAttestation(this.rpc, attestation),
      fetchSchema(this.rpc, schema),
    ]);
    return deserializeAttestationData<T>(
      schemaAccount.data,
      Uint8Array.from(attAccount.data.data)
    );
  }

  async attestationExists(attestation: Address): Promise<boolean> {
    const { value } = await this.rpc.getAccountInfo(attestation, { encoding: "base64" }).send();
    return value !== null;
  }

  private async send(payer: TransactionSigner, instruction: Instruction): Promise<string> {
    const { value: latestBlockhash } = await this.rpc.getLatestBlockhash().send();
    const message = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayer(payer.address, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) => appendTransactionMessageInstruction(instruction, tx)
    );
    const signed = await signTransactionMessageWithSigners(message);
    const sendAndConfirm = sendAndConfirmTransactionFactory({
      rpc: this.rpc,
      rpcSubscriptions: this.rpcSubscriptions,
    } as RpcClient);
    await sendAndConfirm(signed as Parameters<typeof sendAndConfirm>[0], {
      commitment: "confirmed",
    });
    return getSignatureFromTransaction(signed);
  }
}
