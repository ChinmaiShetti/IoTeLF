export type LogLevel = 'info' | 'warn' | 'error' | 'success';

export type AnchorStatus =
  | 'captured'
  | 'pending_wallet'
  | 'pending_contract'
  | 'submitting'
  | 'anchored'
  | 'verified'
  | 'mismatch'
  | 'failed';

export interface AppLogEntry {
  recordId: `0x${string}`;
  logHash: `0x${string}`;
  metadataHash: `0x${string}`;
  createdAt: string;
  clientTimestamp: number;
  level: LogLevel;
  event: string;
  source: string;
  message: string;
  metadata: Record<string, unknown>;
  anchorStatus: AnchorStatus;
  txHash?: string;
  chainId?: number;
  anchoredAt?: string;
  error?: string;
}

export interface WalletSnapshot {
  connected: boolean;
  address: string | null;
  chainId: number | null;
  balanceEth: string | null;
  contractAddress: string | null;
}

export interface VerificationResult {
  success: boolean;
  reason: string;
  onChain?: {
    logHash: string;
    metadataHash: string;
    clientTimestamp: number;
    anchoredAt: number;
    submitter: string;
    exists: boolean;
  };
}
