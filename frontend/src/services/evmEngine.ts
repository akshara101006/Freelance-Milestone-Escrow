import { ethers } from 'ethers';
import { web3Service } from './web3Service';
import {
  Agreement,
  HardhatAccount,
  Milestone,
  NotificationRecord,
  RpcNodeStatus,
  TransactionRecord,
} from '../types/escrow';

export const HARDHAT_ACCOUNTS: HardhatAccount[] = [
  {
    id: 'account-0',
    name: 'Alex',
    username: 'alex.eth',
    role: 'client',
    roleLabel: 'Client',
    roleDescription: 'Dedicated Client: Commissions contracts, funds escrow, and releases payments.',
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    balance: '10000.0000',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    avatarSeed: 'alex',
  },
  {
    id: 'account-1',
    name: 'Stark',
    username: 'stark.eth',
    role: 'freelancer',
    roleLabel: 'Freelancer',
    roleDescription: 'Dedicated Freelancer: Submits deliverables, receives milestone approvals, withdraws earnings.',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    balance: '10000.0000',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    avatarSeed: 'stark',
  },
  {
    id: 'account-2',
    name: 'Mark',
    username: 'mark.eth',
    role: 'arbitrator',
    roleLabel: 'Arbitrator',
    roleDescription: 'Dedicated Arbitrator: Impartial third-party mediator for resolving milestone disputes.',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    balance: '10000.0000',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    avatarSeed: 'mark',
  },
];

export const DEFAULT_FACTORY_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

class EVMEngine {
  private accounts: HardhatAccount[] = [];
  private activeAccount: HardhatAccount = HARDHAT_ACCOUNTS[0];
  private agreements: Map<string, Agreement> = new Map();
  private contractBalances: Map<string, bigint> = new Map(); // address => balance in wei
  private withdrawableCredits: Map<string, Map<string, bigint>> = new Map(); // contractAddress => (userAddress => wei)
  private transactions: TransactionRecord[] = [];
  private notifications: NotificationRecord[] = [];
  private latestToast: NotificationRecord | null = null;
  private currentBlock: number = 0;
  private factoryAddress: string = DEFAULT_FACTORY_ADDRESS;
  private rpcStatus: RpcNodeStatus = web3Service.getStatus();
  private listeners: Set<() => void> = new Set();
  private storageKey = 'freelance_escrow_evm_state_v10';

  constructor() {
    this.init();
    web3Service.subscribeStatus((status) => {
      const wasOnline = this.rpcStatus.isNodeOnline;
      this.rpcStatus = status;
      if (status.latestBlock !== null) {
        this.currentBlock = status.latestBlock;
      }
      if (status.factoryDeployedAddress) {
        this.factoryAddress = status.factoryDeployedAddress;
      }
      if (status.isNodeOnline && !wasOnline) {
        this.syncWithLiveChain();
      }
      this.notify(false);
    });
  }

  private init() {
    // Purge legacy storage keys from previous sessions
    [
      'freelance_escrow_evm_state_v1',
      'freelance_escrow_evm_state_v2',
      'freelance_escrow_evm_state_v3',
      'freelance_escrow_evm_state_v4',
      'freelance_escrow_evm_state_v5',
      'freelance_escrow_evm_state_v6',
      'freelance_escrow_evm_state_v7',
      'freelance_escrow_evm_state_v8',
      'freelance_escrow_evm_state_v9',
    ].forEach((k) => localStorage.removeItem(k));

    // Strictly enforce the 3 single-role accounts (Alex, Stark, Mark)
    this.accounts = JSON.parse(JSON.stringify(HARDHAT_ACCOUNTS));
    this.activeAccount = this.accounts[0];

    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.currentBlock = parsed.currentBlock || 0;
        this.factoryAddress = parsed.factoryAddress || DEFAULT_FACTORY_ADDRESS;
        this.transactions = parsed.transactions || [];
        this.notifications = parsed.notifications || [];
        if (parsed.activeAccountId) {
          const found = this.accounts.find((a) => a.id === parsed.activeAccountId);
          if (found) this.activeAccount = found;
        }
        if (parsed.agreements && parsed.agreements.length > 0) {
          for (const item of parsed.agreements) {
            this.agreements.set(item.address, {
              ...item,
              totalRequiredWei: BigInt(item.totalRequiredWei || '0'),
              totalReservedWei: BigInt(item.totalReservedWei || '0'),
              milestones: item.milestones.map((m: any) => ({
                ...m,
                amountWei: BigInt(m.amountWei || '0'),
              })),
            });
            this.contractBalances.set(item.address, BigInt(item.contractBalanceWei || '0'));

            const creditMap = new Map<string, bigint>();
            if (item.withdrawable) {
              for (const [addr, amt] of Object.entries(item.withdrawable)) {
                creditMap.set(addr.toLowerCase(), BigInt(amt as string));
              }
            }
            this.withdrawableCredits.set(item.address, creditMap);
          }
          this.syncWithLiveChain();
          return;
        }
      } catch (e) {
        console.warn('Failed to load EVM state from localStorage');
      }
    }

    this.clearAllData();
  }

  /**
   * Synchronizes account balances and verifies agreement contracts against the live Hardhat RPC node.
   * If the Hardhat node was restarted (fresh chain with no bytecode for stored agreements),
   * automatically clears stale agreements from the old chain session.
   */
  public async syncWithLiveChain() {
    const liveBalances = await web3Service.fetchLiveBalances(
      this.accounts.map((a) => a.address)
    );
    if (liveBalances) {
      for (const acc of this.accounts) {
        const bal = liveBalances[acc.address.toLowerCase()];
        if (bal !== undefined) {
          acc.balance = bal;
        }
      }
    }

    // Check if stored agreements still exist on the running Hardhat chain
    if (this.agreements.size > 0 && this.rpcStatus.isNodeOnline) {
      const firstAgreementAddr = Array.from(this.agreements.keys())[0];
      const codeExists = await web3Service.hasContractCode(firstAgreementAddr);
      if (!codeExists) {
        // Hardhat server was restarted with a fresh chain; purge stale agreements from previous run
        this.agreements.clear();
        this.contractBalances.clear();
        this.withdrawableCredits.clear();
        this.transactions = [];
        this.notifications = [];
        this.factoryAddress = DEFAULT_FACTORY_ADDRESS;
      }
    }

    this.notify();
  }

  public resetState() {
    localStorage.removeItem(this.storageKey);
    this.clearAllData();
    this.syncWithLiveChain();
    this.notify();
  }

  private clearAllData() {
    this.agreements.clear();
    this.contractBalances.clear();
    this.withdrawableCredits.clear();
    this.transactions = [];
    this.notifications = [];
    this.latestToast = null;
    this.currentBlock = this.rpcStatus.latestBlock ?? 0;
    this.factoryAddress = DEFAULT_FACTORY_ADDRESS;
    this.accounts = JSON.parse(JSON.stringify(HARDHAT_ACCOUNTS));
    this.activeAccount = this.accounts[0];
    this.persist();
  }

  private persist() {
    const list: any[] = [];
    for (const [addr, agr] of this.agreements.entries()) {
      const balance = this.contractBalances.get(addr) || 0n;
      const creditMap = this.withdrawableCredits.get(addr);
      const creditsObj: Record<string, string> = {};
      if (creditMap) {
        for (const [user, val] of creditMap.entries()) {
          creditsObj[user] = val.toString();
        }
      }
      list.push({
        ...agr,
        totalRequiredWei: agr.totalRequiredWei.toString(),
        totalReservedWei: agr.totalReservedWei.toString(),
        contractBalanceWei: balance.toString(),
        withdrawable: creditsObj,
        milestones: agr.milestones.map((m) => ({
          ...m,
          amountWei: m.amountWei.toString(),
        })),
      });
    }

    const payload = {
      currentBlock: this.currentBlock,
      factoryAddress: this.factoryAddress,
      activeAccountId: this.activeAccount.id,
      transactions: this.transactions,
      notifications: this.notifications,
      agreements: list,
    };
    localStorage.setItem(this.storageKey, JSON.stringify(payload));
  }

  private notify(shouldPersist: boolean = true) {
    if (shouldPersist) {
      this.persist();
    }
    this.listeners.forEach((l) => l());
  }

  public subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public getRpcStatus(): RpcNodeStatus {
    return this.rpcStatus;
  }

  public getFactoryAddress(): string {
    return this.factoryAddress;
  }

  private async assertHardhatNodeOnline(): Promise<void> {
    const isOnline = await web3Service.checkLocalNode();
    if (!isOnline) {
      throw new Error(
        'Hardhat RPC Server (http://127.0.0.1:8545) is CLOSED / OFFLINE. Your wallet is disconnected from the blockchain. Start "npx hardhat node" in your terminal to execute verifiable transactions.'
      );
    }
  }

  // --- Notification Methods ---
  public getNotifications(userAddress?: string): NotificationRecord[] {
    if (!userAddress) return this.notifications;
    const lower = userAddress.toLowerCase();
    return this.notifications.filter(
      (n) => !n.recipientAddress || n.recipientAddress.toLowerCase() === lower
    );
  }

  public getUnreadCount(userAddress?: string): number {
    return this.getNotifications(userAddress).filter((n) => !n.read).length;
  }

  public markAsRead(id: string) {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.notify();
    }
  }

  public markAllAsRead(userAddress?: string) {
    const notifs = this.getNotifications(userAddress);
    for (const n of notifs) {
      n.read = true;
    }
    this.notify();
  }

  public deleteNotification(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notify();
  }

  public getLatestToast(): NotificationRecord | null {
    return this.latestToast;
  }

  public clearLatestToast() {
    this.latestToast = null;
    this.notify();
  }

  private addNotification(notif: Omit<NotificationRecord, 'id' | 'timestamp' | 'read'>) {
    const record: NotificationRecord = {
      ...notif,
      id: 'notif_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
      timestamp: Math.floor(Date.now() / 1000),
      read: false,
    };
    this.notifications.unshift(record);
    this.latestToast = record;
  }

  // --- Getters ---
  public getAccounts(): HardhatAccount[] {
    return this.accounts;
  }

  public getActiveAccount(): HardhatAccount {
    return this.activeAccount;
  }

  public setActiveAccount(id: string) {
    const acc = this.accounts.find((a) => a.id === id);
    if (acc) {
      this.activeAccount = acc;
      this.syncWithLiveChain();
      this.notify();
    }
  }

  public getAgreements(): Agreement[] {
    return Array.from(this.agreements.values());
  }

  public getAgreement(address: string): Agreement | undefined {
    return this.agreements.get(address);
  }

  public getContractBalance(address: string): { eth: string; wei: bigint } {
    const b = this.contractBalances.get(address) || 0n;
    return { eth: ethers.formatEther(b), wei: b };
  }

  public getWithdrawable(
    contractAddress: string,
    userAddress: string
  ): { eth: string; wei: bigint } {
    const credits = this.withdrawableCredits.get(contractAddress);
    const amt = credits?.get(userAddress.toLowerCase()) || 0n;
    return { eth: ethers.formatEther(amt), wei: amt };
  }

  public getTransactions(): TransactionRecord[] {
    return this.transactions;
  }

  public getCurrentBlock(): number {
    return this.currentBlock;
  }

  public verifyAccountingInvariant(contractAddress: string): {
    holds: boolean;
    balanceEth: string;
    totalReservedEth: string;
    totalWithdrawableEth: string;
    totalLiabilitiesEth: string;
  } {
    const agr = this.agreements.get(contractAddress);
    const balance = this.contractBalances.get(contractAddress) || 0n;
    if (!agr) {
      return {
        holds: true,
        balanceEth: '0',
        totalReservedEth: '0',
        totalWithdrawableEth: '0',
        totalLiabilitiesEth: '0',
      };
    }

    const credits = this.withdrawableCredits.get(contractAddress);
    let sumWithdrawable = 0n;
    if (credits) {
      for (const val of credits.values()) {
        sumWithdrawable += val;
      }
    }

    const liabilities = agr.totalReservedWei + sumWithdrawable;
    const holds = balance === liabilities;

    return {
      holds,
      balanceEth: ethers.formatEther(balance),
      totalReservedEth: ethers.formatEther(agr.totalReservedWei),
      totalWithdrawableEth: ethers.formatEther(sumWithdrawable),
      totalLiabilitiesEth: ethers.formatEther(liabilities),
    };
  }

  // --- Real On-Chain Smart Contract Transactions ---

  /**
   * Factory: createAgreement (Deployed on live Hardhat RPC via EscrowFactory.sol)
   */
  public async createAgreement(params: {
    freelancer: string;
    arbitrator: string;
    title: string;
    milestoneTitles: string[];
    milestoneAmounts: string[]; // ETH
    milestoneDeadlinesDays: number[];
  }): Promise<{ receipt: TransactionRecord; agreementAddress: string }> {
    await this.assertHardhatNodeOnline();

    const sender = this.activeAccount;
    const now = Math.floor(Date.now() / 1000);

    // Validation matching FreelanceMilestoneEscrow.sol constructor
    if (!ethers.isAddress(params.freelancer) || params.freelancer === ethers.ZeroAddress) {
      throw new Error('FreelanceMilestoneEscrow: freelancer cannot be zero address');
    }
    if (!ethers.isAddress(params.arbitrator) || params.arbitrator === ethers.ZeroAddress) {
      throw new Error('FreelanceMilestoneEscrow: arbitrator cannot be zero address');
    }
    if (sender.address.toLowerCase() === params.freelancer.toLowerCase()) {
      throw new Error('FreelanceMilestoneEscrow: client and freelancer must differ');
    }
    if (sender.address.toLowerCase() === params.arbitrator.toLowerCase()) {
      throw new Error('FreelanceMilestoneEscrow: client and arbitrator must differ');
    }
    if (params.freelancer.toLowerCase() === params.arbitrator.toLowerCase()) {
      throw new Error('FreelanceMilestoneEscrow: freelancer and arbitrator must differ');
    }
    if (params.milestoneTitles.length === 0) {
      throw new Error('FreelanceMilestoneEscrow: must have at least one milestone');
    }
    if (params.milestoneTitles.length > 10) {
      throw new Error('FreelanceMilestoneEscrow: milestone count exceeds max 10');
    }

    let sumWei = 0n;
    const milestones: Milestone[] = [];
    const milestoneAmountsWei: bigint[] = [];
    const milestoneDeadlines: bigint[] = [];

    for (let i = 0; i < params.milestoneTitles.length; i++) {
      const amtEth = params.milestoneAmounts[i];
      const amtWei = ethers.parseEther(amtEth || '0');
      if (amtWei <= 0n) {
        throw new Error('FreelanceMilestoneEscrow: milestone amount must be > 0');
      }
      const deadline = now + params.milestoneDeadlinesDays[i] * 86400;

      milestones.push({
        index: i,
        title: params.milestoneTitles[i],
        amount: parseFloat(amtEth).toFixed(2),
        amountWei: amtWei,
        deadline,
        state: 'Pending',
        submissionNote: '',
        freelancerShare: '0.00',
        clientRefund: '0.00',
      });
      milestoneAmountsWei.push(amtWei);
      milestoneDeadlines.push(BigInt(deadline));
      sumWei += amtWei;
    }

    const cleanTitle = params.title.trim() || 'Freelance Agreement';
    const checksumFreelancer = ethers.getAddress(params.freelancer);
    const checksumArbitrator = ethers.getAddress(params.arbitrator);

    // Ensure EscrowFactory is deployed on the live Hardhat node
    const clientAccount = this.accounts.find((a) => a.role === 'client') || sender;
    this.factoryAddress = await web3Service.ensureFactoryDeployed(
      clientAccount.privateKey,
      this.factoryAddress
    );

    // Execute real on-chain createAgreement transaction on EscrowFactory
    const onChainResult = await web3Service.executeCreateAgreementOnChain({
      senderAddress: sender.address,
      senderPrivateKey: sender.privateKey,
      factoryAddress: this.factoryAddress,
      freelancer: checksumFreelancer,
      arbitrator: checksumArbitrator,
      title: cleanTitle,
      milestoneTitles: milestones.map((m) => m.title),
      milestoneAmountsWei,
      milestoneDeadlines,
    });

    const escrowAddr = onChainResult.deployedEscrowAddress;
    this.currentBlock = onChainResult.blockNumber;

    const agreement: Agreement = {
      address: escrowAddr,
      title: cleanTitle,
      client: sender.address,
      freelancer: checksumFreelancer,
      arbitrator: checksumArbitrator,
      agreementState: 'Unfunded',
      totalRequired: ethers.formatEther(sumWei),
      totalRequiredWei: sumWei,
      totalReserved: '0.00',
      totalReservedWei: 0n,
      totalCredited: '0.00',
      totalWithdrawn: '0.00',
      createdAt: onChainResult.timestamp,
      milestones,
    };

    this.agreements.set(escrowAddr, agreement);
    this.contractBalances.set(escrowAddr, 0n);

    const credits = new Map<string, bigint>();
    credits.set(sender.address.toLowerCase(), 0n);
    credits.set(checksumFreelancer.toLowerCase(), 0n);
    this.withdrawableCredits.set(escrowAddr, credits);

    await this.syncWithLiveChain();

    const tx: TransactionRecord = {
      hash: onChainResult.hash,
      blockNumber: onChainResult.blockNumber,
      blockHash: onChainResult.blockHash,
      transactionIndex: onChainResult.transactionIndex,
      nonce: onChainResult.nonce,
      from: onChainResult.from,
      to: onChainResult.to,
      action: 'createAgreement',
      value: '0.00 ETH',
      status: 'success',
      gasUsed: onChainResult.gasUsed,
      cumulativeGasUsed: onChainResult.cumulativeGasUsed,
      effectiveGasPriceGwei: onChainResult.effectiveGasPriceGwei,
      calldata: onChainResult.calldata,
      timestamp: onChainResult.timestamp,
      contractAddress: escrowAddr,
      events: onChainResult.events,
      verifiedOnChain: true,
      executionSource: onChainResult.executionSource,
    };

    this.transactions.unshift(tx);

    this.addNotification({
      type: 'created',
      title: 'New Escrow Agreement Deployed On-Chain',
      message: `Agreement "${agreement.title}" was deployed at ${escrowAddr.substring(0, 10)}... in Block #${tx.blockNumber}.`,
      contractAddress: escrowAddr,
      txHash: tx.hash,
      amountEth: agreement.totalRequired,
      severity: 'info',
    });

    this.notify();
    return { receipt: tx, agreementAddress: escrowAddr };
  }

  /**
   * Escrow: fundAgreement (Executes fundAgreement() payable on FreelanceMilestoneEscrow.sol)
   */
  public async fundAgreement(contractAddress: string): Promise<TransactionRecord> {
    await this.assertHardhatNodeOnline();

    const sender = this.activeAccount;
    const agr = this.agreements.get(contractAddress);
    if (!agr) throw new Error('Contract not found on local chain');

    if (sender.address.toLowerCase() !== agr.client.toLowerCase()) {
      throw new Error('FreelanceMilestoneEscrow: caller is not client');
    }

    if (agr.agreementState !== 'Unfunded') {
      throw new Error('FreelanceMilestoneEscrow: invalid agreement state (already funded)');
    }

    const clientBal = parseFloat(sender.balance);
    const reqEth = parseFloat(agr.totalRequired);
    if (clientBal < reqEth) {
      throw new Error('Insufficient local test ETH balance');
    }

    const onChainResult = await web3Service.executeEscrowMethodOnChain({
      senderAddress: sender.address,
      senderPrivateKey: sender.privateKey,
      contractAddress,
      methodName: 'fundAgreement',
      args: [],
      valueWei: agr.totalRequiredWei,
    });

    this.currentBlock = onChainResult.blockNumber;
    this.contractBalances.set(contractAddress, agr.totalRequiredWei);

    agr.agreementState = 'Active';
    agr.totalReservedWei = agr.totalRequiredWei;
    agr.totalReserved = agr.totalRequired;

    await this.syncWithLiveChain();

    const tx: TransactionRecord = {
      hash: onChainResult.hash,
      blockNumber: onChainResult.blockNumber,
      blockHash: onChainResult.blockHash,
      transactionIndex: onChainResult.transactionIndex,
      nonce: onChainResult.nonce,
      from: onChainResult.from,
      to: onChainResult.to,
      action: 'fundAgreement',
      value: `${agr.totalRequired} ETH`,
      status: 'success',
      gasUsed: onChainResult.gasUsed,
      cumulativeGasUsed: onChainResult.cumulativeGasUsed,
      effectiveGasPriceGwei: onChainResult.effectiveGasPriceGwei,
      calldata: onChainResult.calldata,
      timestamp: onChainResult.timestamp,
      events: onChainResult.events,
      verifiedOnChain: true,
      executionSource: onChainResult.executionSource,
    };

    this.transactions.unshift(tx);

    this.addNotification({
      type: 'funded',
      title: 'Milestone Escrow Funded On-Chain!',
      message: `Agreement "${agr.title}" was funded with ${agr.totalRequired} ETH by ${sender.name} in Block #${tx.blockNumber}.`,
      contractAddress,
      txHash: tx.hash,
      amountEth: agr.totalRequired,
      severity: 'success',
    });

    this.notify();
    return tx;
  }

  /**
   * Escrow: submitMilestone (Executes submitMilestone(index, note) on FreelanceMilestoneEscrow.sol)
   */
  public async submitMilestone(
    contractAddress: string,
    milestoneIndex: number,
    note: string
  ): Promise<TransactionRecord> {
    await this.assertHardhatNodeOnline();

    const sender = this.activeAccount;
    const agr = this.agreements.get(contractAddress);
    if (!agr) throw new Error('Contract not found');

    if (sender.address.toLowerCase() !== agr.freelancer.toLowerCase()) {
      throw new Error('FreelanceMilestoneEscrow: caller is not freelancer');
    }

    if (agr.agreementState !== 'Active') {
      throw new Error('FreelanceMilestoneEscrow: invalid agreement state');
    }

    const m = agr.milestones[milestoneIndex];
    if (!m) throw new Error('FreelanceMilestoneEscrow: invalid milestone index');
    if (m.state !== 'Pending') {
      throw new Error('FreelanceMilestoneEscrow: milestone not in Pending state');
    }

    const cleanNote = note.trim() || 'Work delivered for review';

    const onChainResult = await web3Service.executeEscrowMethodOnChain({
      senderAddress: sender.address,
      senderPrivateKey: sender.privateKey,
      contractAddress,
      methodName: 'submitMilestone',
      args: [BigInt(milestoneIndex), cleanNote],
    });

    this.currentBlock = onChainResult.blockNumber;
    m.state = 'Submitted';
    m.submissionNote = cleanNote;

    await this.syncWithLiveChain();

    const tx: TransactionRecord = {
      hash: onChainResult.hash,
      blockNumber: onChainResult.blockNumber,
      blockHash: onChainResult.blockHash,
      transactionIndex: onChainResult.transactionIndex,
      nonce: onChainResult.nonce,
      from: onChainResult.from,
      to: onChainResult.to,
      action: `submitMilestone[${milestoneIndex}]`,
      value: '0.00 ETH',
      status: 'success',
      gasUsed: onChainResult.gasUsed,
      cumulativeGasUsed: onChainResult.cumulativeGasUsed,
      effectiveGasPriceGwei: onChainResult.effectiveGasPriceGwei,
      calldata: onChainResult.calldata,
      timestamp: onChainResult.timestamp,
      events: onChainResult.events,
      verifiedOnChain: true,
      executionSource: onChainResult.executionSource,
    };

    this.transactions.unshift(tx);

    this.addNotification({
      type: 'submitted',
      title: 'Milestone Work Submitted On-Chain',
      message: `Milestone ${milestoneIndex + 1} (${m.title}) was submitted by ${sender.name} in Block #${tx.blockNumber}.`,
      contractAddress,
      milestoneIndex,
      txHash: tx.hash,
      amountEth: m.amount,
      severity: 'info',
    });

    this.notify();
    return tx;
  }

  /**
   * Escrow: approveMilestone (Executes approveMilestone(index) on FreelanceMilestoneEscrow.sol)
   */
  public async approveMilestone(
    contractAddress: string,
    milestoneIndex: number
  ): Promise<TransactionRecord> {
    await this.assertHardhatNodeOnline();

    const sender = this.activeAccount;
    const agr = this.agreements.get(contractAddress);
    if (!agr) throw new Error('Contract not found');

    if (sender.address.toLowerCase() !== agr.client.toLowerCase()) {
      throw new Error('FreelanceMilestoneEscrow: caller is not client');
    }

    if (agr.agreementState !== 'Active') {
      throw new Error('FreelanceMilestoneEscrow: invalid agreement state');
    }

    const m = agr.milestones[milestoneIndex];
    if (!m) throw new Error('FreelanceMilestoneEscrow: invalid milestone index');
    if (m.state !== 'Submitted') {
      throw new Error('FreelanceMilestoneEscrow: milestone not in Submitted state');
    }

    const onChainResult = await web3Service.executeEscrowMethodOnChain({
      senderAddress: sender.address,
      senderPrivateKey: sender.privateKey,
      contractAddress,
      methodName: 'approveMilestone',
      args: [BigInt(milestoneIndex)],
    });

    this.currentBlock = onChainResult.blockNumber;
    m.state = 'Released';
    m.freelancerShare = m.amount;
    m.clientRefund = '0.00';

    agr.totalReservedWei -= m.amountWei;
    agr.totalReserved = ethers.formatEther(agr.totalReservedWei);

    const credits = this.withdrawableCredits.get(contractAddress)!;
    const currCredit = credits.get(agr.freelancer.toLowerCase()) || 0n;
    credits.set(agr.freelancer.toLowerCase(), currCredit + m.amountWei);

    const prevCredited = ethers.parseEther(agr.totalCredited);
    agr.totalCredited = ethers.formatEther(prevCredited + m.amountWei);

    this.checkAndSetCompletion(agr);
    await this.syncWithLiveChain();

    const tx: TransactionRecord = {
      hash: onChainResult.hash,
      blockNumber: onChainResult.blockNumber,
      blockHash: onChainResult.blockHash,
      transactionIndex: onChainResult.transactionIndex,
      nonce: onChainResult.nonce,
      from: onChainResult.from,
      to: onChainResult.to,
      action: `approveMilestone[${milestoneIndex}]`,
      value: '0.00 ETH',
      status: 'success',
      gasUsed: onChainResult.gasUsed,
      cumulativeGasUsed: onChainResult.cumulativeGasUsed,
      effectiveGasPriceGwei: onChainResult.effectiveGasPriceGwei,
      calldata: onChainResult.calldata,
      timestamp: onChainResult.timestamp,
      events: onChainResult.events,
      verifiedOnChain: true,
      executionSource: onChainResult.executionSource,
    };

    this.transactions.unshift(tx);

    this.addNotification({
      type: 'completed',
      title: 'Milestone Approved On-Chain!',
      message: `Milestone ${milestoneIndex + 1} (${m.title}) approved by ${sender.name} in Block #${tx.blockNumber}. ${m.amount} ETH credited for pull withdrawal.`,
      contractAddress,
      milestoneIndex,
      txHash: tx.hash,
      amountEth: m.amount,
      severity: 'success',
    });

    this.notify();
    return tx;
  }

  /**
   * Escrow: raiseDispute (Executes raiseDispute(index) on FreelanceMilestoneEscrow.sol)
   */
  public async raiseDispute(
    contractAddress: string,
    milestoneIndex: number
  ): Promise<TransactionRecord> {
    await this.assertHardhatNodeOnline();

    const sender = this.activeAccount;
    const agr = this.agreements.get(contractAddress);
    if (!agr) throw new Error('Contract not found');

    const isClient = sender.address.toLowerCase() === agr.client.toLowerCase();
    if (!isClient) {
      throw new Error('FreelanceMilestoneEscrow: caller is not client');
    }

    const m = agr.milestones[milestoneIndex];
    if (!m) throw new Error('FreelanceMilestoneEscrow: invalid milestone index');
    if (m.state !== 'Submitted') {
      throw new Error('FreelanceMilestoneEscrow: can only dispute Submitted milestone');
    }

    const onChainResult = await web3Service.executeEscrowMethodOnChain({
      senderAddress: sender.address,
      senderPrivateKey: sender.privateKey,
      contractAddress,
      methodName: 'raiseDispute',
      args: [BigInt(milestoneIndex)],
    });

    this.currentBlock = onChainResult.blockNumber;
    m.state = 'Disputed';

    await this.syncWithLiveChain();

    const tx: TransactionRecord = {
      hash: onChainResult.hash,
      blockNumber: onChainResult.blockNumber,
      blockHash: onChainResult.blockHash,
      transactionIndex: onChainResult.transactionIndex,
      nonce: onChainResult.nonce,
      from: onChainResult.from,
      to: onChainResult.to,
      action: `raiseDispute[${milestoneIndex}]`,
      value: '0.00 ETH',
      status: 'success',
      gasUsed: onChainResult.gasUsed,
      cumulativeGasUsed: onChainResult.cumulativeGasUsed,
      effectiveGasPriceGwei: onChainResult.effectiveGasPriceGwei,
      calldata: onChainResult.calldata,
      timestamp: onChainResult.timestamp,
      events: onChainResult.events,
      verifiedOnChain: true,
      executionSource: onChainResult.executionSource,
    };

    this.transactions.unshift(tx);

    this.addNotification({
      type: 'disputed',
      title: 'Dispute Raised On-Chain',
      message: `Dispute opened on Milestone ${milestoneIndex + 1} (${m.title}) by ${sender.name} in Block #${tx.blockNumber}.`,
      contractAddress,
      milestoneIndex,
      txHash: tx.hash,
      amountEth: m.amount,
      severity: 'warning',
    });

    this.notify();
    return tx;
  }

  /**
   * Escrow: resolveDispute (Executes resolveDispute(index, bps) on FreelanceMilestoneEscrow.sol)
   */
  public async resolveDispute(
    contractAddress: string,
    milestoneIndex: number,
    freelancerShareBps: number // 0 to 10,000
  ): Promise<TransactionRecord> {
    await this.assertHardhatNodeOnline();

    const sender = this.activeAccount;
    const agr = this.agreements.get(contractAddress);
    if (!agr) throw new Error('Contract not found');

    if (sender.address.toLowerCase() !== agr.arbitrator.toLowerCase()) {
      throw new Error('FreelanceMilestoneEscrow: caller is not arbitrator');
    }

    if (freelancerShareBps < 0 || freelancerShareBps > 10000) {
      throw new Error('FreelanceMilestoneEscrow: basis points must be <= 10000');
    }

    const m = agr.milestones[milestoneIndex];
    if (!m) throw new Error('FreelanceMilestoneEscrow: invalid milestone index');
    if (m.state !== 'Disputed') {
      throw new Error('FreelanceMilestoneEscrow: milestone is not in Disputed state');
    }

    const onChainResult = await web3Service.executeEscrowMethodOnChain({
      senderAddress: sender.address,
      senderPrivateKey: sender.privateKey,
      contractAddress,
      methodName: 'resolveDispute',
      args: [BigInt(milestoneIndex), BigInt(freelancerShareBps)],
    });

    this.currentBlock = onChainResult.blockNumber;

    // Exact Integer arithmetic without remainder leakage
    const fShareWei = (m.amountWei * BigInt(freelancerShareBps)) / 10000n;
    const cRefundWei = m.amountWei - fShareWei;

    m.state = 'Resolved';
    m.freelancerShare = ethers.formatEther(fShareWei);
    m.clientRefund = ethers.formatEther(cRefundWei);

    agr.totalReservedWei -= m.amountWei;
    agr.totalReserved = ethers.formatEther(agr.totalReservedWei);

    const credits = this.withdrawableCredits.get(contractAddress)!;
    if (fShareWei > 0n) {
      const fCurr = credits.get(agr.freelancer.toLowerCase()) || 0n;
      credits.set(agr.freelancer.toLowerCase(), fCurr + fShareWei);
    }
    if (cRefundWei > 0n) {
      const cCurr = credits.get(agr.client.toLowerCase()) || 0n;
      credits.set(agr.client.toLowerCase(), cCurr + cRefundWei);
    }

    const prevCredited = ethers.parseEther(agr.totalCredited);
    agr.totalCredited = ethers.formatEther(prevCredited + m.amountWei);

    this.checkAndSetCompletion(agr);
    await this.syncWithLiveChain();

    const tx: TransactionRecord = {
      hash: onChainResult.hash,
      blockNumber: onChainResult.blockNumber,
      blockHash: onChainResult.blockHash,
      transactionIndex: onChainResult.transactionIndex,
      nonce: onChainResult.nonce,
      from: onChainResult.from,
      to: onChainResult.to,
      action: `resolveDispute[${milestoneIndex}]`,
      value: '0.00 ETH',
      status: 'success',
      gasUsed: onChainResult.gasUsed,
      cumulativeGasUsed: onChainResult.cumulativeGasUsed,
      effectiveGasPriceGwei: onChainResult.effectiveGasPriceGwei,
      calldata: onChainResult.calldata,
      timestamp: onChainResult.timestamp,
      events: onChainResult.events,
      verifiedOnChain: true,
      executionSource: onChainResult.executionSource,
    };

    this.transactions.unshift(tx);

    this.addNotification({
      type: 'resolved',
      title: 'Dispute Resolved On-Chain by Arbitrator',
      message: `Arbitrator ${sender.name} settled Milestone ${milestoneIndex + 1} in Block #${tx.blockNumber}: Stark received ${m.freelancerShare} ETH, Alex refunded ${m.clientRefund} ETH.`,
      contractAddress,
      milestoneIndex,
      txHash: tx.hash,
      amountEth: m.amount,
      severity: 'info',
    });

    this.notify();
    return tx;
  }

  /**
   * Escrow: refundMilestone (Executes refundMilestone(index) on FreelanceMilestoneEscrow.sol)
   */
  public async refundMilestone(
    contractAddress: string,
    milestoneIndex: number
  ): Promise<TransactionRecord> {
    await this.assertHardhatNodeOnline();

    const sender = this.activeAccount;
    const agr = this.agreements.get(contractAddress);
    if (!agr) throw new Error('Contract not found');

    if (sender.address.toLowerCase() !== agr.client.toLowerCase()) {
      throw new Error('FreelanceMilestoneEscrow: caller is not client');
    }

    const m = agr.milestones[milestoneIndex];
    if (!m) throw new Error('FreelanceMilestoneEscrow: invalid milestone index');
    if (m.state !== 'Pending') {
      throw new Error('FreelanceMilestoneEscrow: can only refund Pending milestone');
    }

    const onChainResult = await web3Service.executeEscrowMethodOnChain({
      senderAddress: sender.address,
      senderPrivateKey: sender.privateKey,
      contractAddress,
      methodName: 'refundMilestone',
      args: [BigInt(milestoneIndex)],
    });

    this.currentBlock = onChainResult.blockNumber;

    m.state = 'Refunded';
    m.freelancerShare = '0.00';
    m.clientRefund = m.amount;

    agr.totalReservedWei -= m.amountWei;
    agr.totalReserved = ethers.formatEther(agr.totalReservedWei);

    const credits = this.withdrawableCredits.get(contractAddress)!;
    const cCurr = credits.get(agr.client.toLowerCase()) || 0n;
    credits.set(agr.client.toLowerCase(), cCurr + m.amountWei);

    const prevCredited = ethers.parseEther(agr.totalCredited);
    agr.totalCredited = ethers.formatEther(prevCredited + m.amountWei);

    this.checkAndSetCompletion(agr);
    await this.syncWithLiveChain();

    const tx: TransactionRecord = {
      hash: onChainResult.hash,
      blockNumber: onChainResult.blockNumber,
      blockHash: onChainResult.blockHash,
      transactionIndex: onChainResult.transactionIndex,
      nonce: onChainResult.nonce,
      from: onChainResult.from,
      to: onChainResult.to,
      action: `refundMilestone[${milestoneIndex}]`,
      value: '0.00 ETH',
      status: 'success',
      gasUsed: onChainResult.gasUsed,
      cumulativeGasUsed: onChainResult.cumulativeGasUsed,
      effectiveGasPriceGwei: onChainResult.effectiveGasPriceGwei,
      calldata: onChainResult.calldata,
      timestamp: onChainResult.timestamp,
      events: onChainResult.events,
      verifiedOnChain: true,
      executionSource: onChainResult.executionSource,
    };

    this.transactions.unshift(tx);

    this.addNotification({
      type: 'refunded',
      title: 'Milestone Refunded On-Chain',
      message: `Milestone ${milestoneIndex + 1} (${m.title}) refunded ${m.amount} ETH to Client ${sender.name} in Block #${tx.blockNumber}.`,
      contractAddress,
      milestoneIndex,
      txHash: tx.hash,
      amountEth: m.amount,
      severity: 'info',
    });

    this.notify();
    return tx;
  }

  /**
   * Escrow: withdraw (Executes withdraw() nonReentrant on FreelanceMilestoneEscrow.sol)
   */
  public async withdraw(contractAddress: string): Promise<TransactionRecord> {
    await this.assertHardhatNodeOnline();

    const sender = this.activeAccount;
    const agr = this.agreements.get(contractAddress);
    if (!agr) throw new Error('Contract not found');

    const credits = this.withdrawableCredits.get(contractAddress);
    const amountWei = credits?.get(sender.address.toLowerCase()) || 0n;

    if (amountWei <= 0n) {
      throw new Error('FreelanceMilestoneEscrow: no withdrawable balance');
    }

    const onChainResult = await web3Service.executeEscrowMethodOnChain({
      senderAddress: sender.address,
      senderPrivateKey: sender.privateKey,
      contractAddress,
      methodName: 'withdraw',
      args: [],
    });

    this.currentBlock = onChainResult.blockNumber;
    credits!.set(sender.address.toLowerCase(), 0n);

    const contractBal = this.contractBalances.get(contractAddress) || 0n;
    this.contractBalances.set(contractAddress, contractBal - amountWei);

    const prevWithdrawn = ethers.parseEther(agr.totalWithdrawn);
    agr.totalWithdrawn = ethers.formatEther(prevWithdrawn + amountWei);

    await this.syncWithLiveChain();

    const tx: TransactionRecord = {
      hash: onChainResult.hash,
      blockNumber: onChainResult.blockNumber,
      blockHash: onChainResult.blockHash,
      transactionIndex: onChainResult.transactionIndex,
      nonce: onChainResult.nonce,
      from: onChainResult.from,
      to: onChainResult.to,
      action: 'withdraw',
      value: `${ethers.formatEther(amountWei)} ETH`,
      status: 'success',
      gasUsed: onChainResult.gasUsed,
      cumulativeGasUsed: onChainResult.cumulativeGasUsed,
      effectiveGasPriceGwei: onChainResult.effectiveGasPriceGwei,
      calldata: onChainResult.calldata,
      timestamp: onChainResult.timestamp,
      events: onChainResult.events,
      verifiedOnChain: true,
      executionSource: onChainResult.executionSource,
    };

    this.transactions.unshift(tx);

    this.addNotification({
      type: 'withdrawn',
      recipientAddress: sender.address,
      title: 'Escrow Earnings Withdrawn On-Chain',
      message: `Transferred ${ethers.formatEther(amountWei)} ETH from escrow contract to ${sender.name}'s wallet in Block #${tx.blockNumber}.`,
      contractAddress,
      txHash: tx.hash,
      amountEth: ethers.formatEther(amountWei),
      severity: 'success',
    });

    this.notify();
    return tx;
  }

  /**
   * Add Milestone before funding: re-deploys agreement on-chain with updated milestone array
   */
  public async addMilestoneToAgreement(
    contractAddress: string,
    title: string,
    amount: string,
    deadlineDays: number
  ): Promise<TransactionRecord> {
    await this.assertHardhatNodeOnline();

    const sender = this.activeAccount;
    const agr = this.agreements.get(contractAddress);
    if (!agr) throw new Error('Contract not found on local chain');

    if (sender.address.toLowerCase() !== agr.client.toLowerCase()) {
      throw new Error('Only the client can add milestones to an agreement');
    }

    if (agr.agreementState !== 'Unfunded') {
      throw new Error('Milestones can only be added prior to contract funding');
    }

    const amtEth = parseFloat(amount);
    if (isNaN(amtEth) || amtEth <= 0) {
      throw new Error('Milestone amount must be greater than 0 ETH');
    }

    const updatedTitles = [...agr.milestones.map((m) => m.title), title.trim() || `Milestone ${agr.milestones.length + 1}`];
    const updatedAmounts = [...agr.milestones.map((m) => m.amount), amtEth.toFixed(2)];
    const now = Math.floor(Date.now() / 1000);
    const updatedDays = [
      ...agr.milestones.map((m) => Math.max(1, Math.round((m.deadline - now) / 86400))),
      deadlineDays || 7,
    ];

    this.agreements.delete(contractAddress);
    this.contractBalances.delete(contractAddress);
    this.withdrawableCredits.delete(contractAddress);

    const { receipt } = await this.createAgreement({
      freelancer: agr.freelancer,
      arbitrator: agr.arbitrator,
      title: agr.title,
      milestoneTitles: updatedTitles,
      milestoneAmounts: updatedAmounts,
      milestoneDeadlinesDays: updatedDays,
    });

    return receipt;
  }

  /**
   * Refresh live ETH balances from Hardhat RPC node
   */
  public async requestFaucet(): Promise<TransactionRecord> {
    await this.assertHardhatNodeOnline();
    await this.syncWithLiveChain();
    throw new Error(
      'Balances are synced directly from the live Hardhat RPC server (10,000 ETH per account on Chain 31337).'
    );
  }

  private checkAndSetCompletion(agr: Agreement) {
    if (agr.totalReservedWei === 0n) {
      const allTerminal = agr.milestones.every(
        (m) => m.state === 'Released' || m.state === 'Resolved' || m.state === 'Refunded'
      );
      if (allTerminal) {
        agr.agreementState = 'Completed';
      }
    }
  }
}

export const evm = new EVMEngine();
