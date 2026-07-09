// Thin ethers wrapper around the LogAnchor contract. Degrades gracefully:
// works with no wallet (returns clear errors) and no deployment (reports it),
// so the dashboard never hard-crashes when the chain side isn't set up.
import { BrowserProvider, Contract, type Eip1193Provider } from 'ethers';
import { LOG_ANCHOR_ABI } from './generated/logAnchorAbi';
import deployments from './generated/deployments.json';
import type { AppLogEntry, VerificationResult } from './types';

export interface WalletConnection {
  provider: BrowserProvider;
  address: string;
  chainId: number;
  contractAddress: string | null;
}

function injected(): Eip1193Provider | null {
  const eth = (globalThis as { ethereum?: Eip1193Provider }).ethereum;
  return eth ?? null;
}

export function hasWallet(): boolean {
  return injected() !== null;
}

export function contractAddressFor(chainId: number): string | null {
  const map = deployments as Record<string, string | null>;
  return map[String(chainId)] ?? null;
}

/** First numeric chain id in deployments.json that has a contract, or null. */
export function firstDeployedChainId(): number | null {
  const map = deployments as Record<string, string | null>;
  for (const [k, v] of Object.entries(map)) {
    const id = Number(k);
    if (Number.isInteger(id) && v) return id;
  }
  return null;
}

// Known parameters for adding a network if the wallet doesn't have it yet.
const CHAIN_PARAMS: Record<number, Record<string, unknown>> = {
  31337: {
    chainId: '0x7a69',
    chainName: 'Hardhat Local',
    rpcUrls: ['http://127.0.0.1:8545'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
};

/** Ask the wallet to switch to `chainId`, adding the network if unknown. */
export async function switchChain(chainId: number): Promise<void> {
  const eth = injected();
  if (!eth) throw new Error('No Ethereum wallet found.');
  const hexId = '0x' + chainId.toString(16);
  try {
    await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexId }] });
  } catch (err) {
    // 4902 = chain not added to the wallet yet → add it, then it becomes active.
    const code = (err as { code?: number }).code;
    if (code === 4902 && CHAIN_PARAMS[chainId]) {
      await eth.request({ method: 'wallet_addEthereumChain', params: [CHAIN_PARAMS[chainId]] });
    } else {
      throw err;
    }
  }
}

export async function connectWallet(): Promise<WalletConnection> {
  const eth = injected();
  if (!eth) {
    throw new Error('No Ethereum wallet found. Install MetaMask to anchor logs.');
  }
  const provider = new BrowserProvider(eth);
  await provider.send('eth_requestAccounts', []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const chainId = Number((await provider.getNetwork()).chainId);
  return { provider, address, chainId, contractAddress: contractAddressFor(chainId) };
}

function contractFrom(conn: WalletConnection, signer = false) {
  if (!conn.contractAddress) {
    throw new Error(
      `LogAnchor is not deployed on chain ${conn.chainId}. Run "npm run deploy:local" or "npm run deploy:sepolia".`,
    );
  }
  const runner = signer ? undefined : conn.provider;
  return { addr: conn.contractAddress, runner };
}

/** Anchor a single log entry on-chain; returns the tx hash. */
export async function anchorEntry(conn: WalletConnection, entry: AppLogEntry): Promise<string> {
  contractFrom(conn); // validates deployment
  const signer = await conn.provider.getSigner();
  const contract = new Contract(conn.contractAddress as string, LOG_ANCHOR_ABI, signer);
  const tx = await contract.anchorLog(
    entry.recordId,
    entry.logHash,
    entry.metadataHash,
    BigInt(Math.floor(entry.clientTimestamp / 1000)),
  );
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}

/** Check whether an entry's hashes match what's stored on-chain. */
export async function verifyEntry(
  conn: WalletConnection,
  entry: AppLogEntry,
): Promise<VerificationResult> {
  contractFrom(conn);
  const contract = new Contract(conn.contractAddress as string, LOG_ANCHOR_ABI, conn.provider);
  const ok: boolean = await contract.verifyLog(entry.recordId, entry.logHash, entry.metadataHash);
  return {
    success: ok,
    reason: ok ? 'On-chain hashes match — log is untampered.' : 'No matching anchor found (not anchored or altered).',
  };
}
