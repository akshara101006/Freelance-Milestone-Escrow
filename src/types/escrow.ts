export type AgreementState = 'Unfunded' | 'Active' | 'Completed' | 'Cancelled';

export type MilestoneState =
  | 'Pending'
  | 'Submitted'
  | 'Released'
  | 'Disputed'
  | 'Resolved'
  | 'Refunded';

export interface Milestone {
  index: number;
  title: string;
  amount: string; // in ETH
  amountWei: bigint;
  deadline: number; // Unix timestamp
  state: MilestoneState;
  submissionNote: string;
  freelancerShare: string; // in ETH
  clientRefund: string; // in ETH
}

export interface Agreement {
  address: string;
  title: string;
  client: string;
  freelancer: string;
  arbitrator: string;
  agreementState: AgreementState;
  totalRequired: string; // in ETH
  totalRequiredWei: bigint;
  totalReserved: string; // in ETH
  totalReservedWei: bigint;
  totalCredited: string; // in ETH
  totalWithdrawn: string; // in ETH
  createdAt: number;
  milestones: Milestone[];
}

export interface HardhatAccount {
  id: string;
  name: string;
  username: string;
  role: 'client' | 'freelancer' | 'arbitrator';
  roleLabel: string;
  roleDescription?: string;
  address: string;
  balance: string; // in ETH
  privateKey: string;
  avatarSeed?: string;
}

export interface DecodedEvent {
  name: string;
  signature: string;
  args: Record<string, any>;
}

export interface TransactionRecord {
  hash: string;
  blockNumber: number;
  blockHash?: string;
  transactionIndex?: number;
  nonce?: number;
  from: string;
  to: string;
  action: string;
  value: string;
  status: 'success' | 'reverted';
  revertReason?: string;
  gasUsed: number;
  cumulativeGasUsed?: number;
  effectiveGasPriceGwei?: string;
  calldata?: string;
  timestamp: number;
  events: DecodedEvent[];
  contractAddress?: string;
  verifiedOnChain?: boolean;
  executionSource?: 'hardhat_rpc' | 'metamask_rpc' | 'local_evm';
}

export interface RpcNodeStatus {
  isNodeOnline: boolean;
  rpcUrl: string;
  chainId: number | null;
  latestBlock: number | null;
  lastChecked: number;
  metaMaskConnected: boolean;
  metaMaskAddress: string | null;
  metaMaskChainId: number | null;
  factoryDeployedAddress: string | null;
  errorMessage?: string;
}

export interface NotificationRecord {
  id: string;
  recipientAddress?: string; // Specific recipient address or undefined for all
  type: 'funded' | 'completed' | 'disputed' | 'submitted' | 'resolved' | 'refunded' | 'created' | 'withdrawn';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  contractAddress?: string;
  milestoneIndex?: number;
  txHash?: string;
  amountEth?: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}
