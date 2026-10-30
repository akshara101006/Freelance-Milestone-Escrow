import { ethers } from 'ethers';
import {
  ESCROW_FACTORY_ARTIFACT,
  FREELANCE_MILESTONE_ESCROW_ARTIFACT,
} from './contractArtifacts';
import { DecodedEvent, RpcNodeStatus } from '../types/escrow';

export const FACTORY_ABI = ESCROW_FACTORY_ARTIFACT.abi;
export const ESCROW_ABI = FREELANCE_MILESTONE_ESCROW_ARTIFACT.abi;

// Dedicated Hardhat Account #9 used strictly for deploying EscrowFactory so Client/Freelancer/Arbitrator nonces are never touched outside MetaMask
const FACTORY_DEPLOYER_PRIVATE_KEY =
  '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6';

export interface OnChainTxResult {
  hash: string;
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  nonce: number;
  gasUsed: number;
  cumulativeGasUsed: number;
  effectiveGasPriceGwei: string;
  calldata: string;
  from: string;
  to: string;
  contractAddress?: string;
  events: DecodedEvent[];
  timestamp: number;
  executionSource: 'hardhat_rpc' | 'metamask_rpc';
}

export interface LiveReceiptVerification {
  verified: boolean;
  checkedAt: number;
  rpcUrl: string;
  blockNumber?: number;
  blockHash?: string;
  transactionIndex?: number;
  gasUsed?: string;
  effectiveGasPriceGwei?: string;
  status?: string;
  confirmations?: number;
  from?: string;
  to?: string;
  nonce?: number;
  rawReceipt?: Record<string, any>;
  error?: string;
}

class Web3Service {
  private browserProvider: ethers.BrowserProvider | null = null;
  private jsonRpcProvider: ethers.JsonRpcProvider | null = null;
  private hardhatRpcUrl = 'http://127.0.0.1:8545';
  private listeners: Set<(status: RpcNodeStatus) => void> = new Set();
  private heartbeatTimer: any = null;

  public readonly factoryInterface = new ethers.Interface(FACTORY_ABI);
  public readonly escrowInterface = new ethers.Interface(ESCROW_ABI);

  private status: RpcNodeStatus = {
    isNodeOnline: false,
    rpcUrl: 'http://127.0.0.1:8545',
    chainId: null,
    latestBlock: null,
    lastChecked: Date.now(),
    metaMaskConnected: false,
    metaMaskAddress: null,
    metaMaskChainId: null,
    factoryDeployedAddress: null,
    errorMessage: 'Checking Hardhat RPC server at http://127.0.0.1:8545...',
  };

  constructor() {
    this.initProvider();
    this.startHeartbeat();
    this.setupMetaMaskListeners();
  }

  private initProvider() {
    this.jsonRpcProvider = new ethers.JsonRpcProvider(this.hardhatRpcUrl, undefined, {
      staticNetwork: false,
      batchMaxCount: 1,
      cacheTimeout: -1,
    });
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.browserProvider = new ethers.BrowserProvider((window as any).ethereum);
    }
  }

  private setupMetaMaskListeners() {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      if (typeof ethereum.on === 'function') {
        ethereum.on('accountsChanged', (accounts: string[]) => {
          if (!accounts || accounts.length === 0) {
            this.status.metaMaskConnected = false;
            this.status.metaMaskAddress = null;
          } else {
            this.status.metaMaskConnected = true;
            this.status.metaMaskAddress = ethers.getAddress(accounts[0]);
            this.browserProvider = new ethers.BrowserProvider(ethereum);
          }
          this.notifyListeners();
        });

        ethereum.on('chainChanged', (chainIdHex: string) => {
          this.status.metaMaskChainId = parseInt(chainIdHex, 16);
          if ((window as any).ethereum) {
            this.browserProvider = new ethers.BrowserProvider((window as any).ethereum);
          }
          this.checkLocalNode();
        });

        ethereum.on('disconnect', () => {
          this.status.metaMaskConnected = false;
          this.status.metaMaskAddress = null;
          this.notifyListeners();
        });
      }
    }
  }

  public startHeartbeat() {
    this.checkLocalNode();
    if (typeof window !== 'undefined') {
      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = setInterval(() => {
        this.checkLocalNode();
      }, 2500);

      window.addEventListener('focus', () => {
        this.checkLocalNode();
      });
    }
  }

  public subscribeStatus(fn: (status: RpcNodeStatus) => void) {
    this.listeners.add(fn);
    fn(this.status);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notifyListeners() {
    const snapshot = { ...this.status };
    this.listeners.forEach((fn) => fn(snapshot));
  }

  public getStatus(): RpcNodeStatus {
    return { ...this.status };
  }

  /**
   * Detects if an error thrown by MetaMask / Ethers v6 was caused by the user clicking Reject / Cancel.
   */
  public isUserRejection(err: any): boolean {
    if (!err) return false;
    const code = err?.code ?? err?.info?.error?.code ?? err?.error?.code;
    if (code === 4001 || code === 'ACTION_REJECTED') {
      return true;
    }
    const msg = String(err?.shortMessage || err?.reason || err?.message || '').toLowerCase();
    return (
      msg.includes('user rejected') ||
      msg.includes('user denied') ||
      msg.includes('rejected by user') ||
      msg.includes('action_rejected') ||
      msg.includes('request rejected')
    );
  }

  /**
   * Queries the exact next pending transaction nonce directly from the Hardhat RPC server
   */
  public async getFreshNonce(address: string): Promise<number> {
    const response = await fetch(this.hardhatRpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionCount',
        params: [address, 'pending'],
        id: Date.now(),
      }),
      cache: 'no-store',
    });
    const data = await response.json();
    if (data && typeof data.result === 'string') {
      return parseInt(data.result, 16);
    }
    if (this.jsonRpcProvider) {
      return await this.jsonRpcProvider.getTransactionCount(address, 'pending');
    }
    return 0;
  }

  /**
   * If the user restarted `npx hardhat node` and MetaMask's cached account nonce is higher than
   * Hardhat's fresh nonce, aligns Hardhat's account nonce via `hardhat_setNonce` so MetaMask
   * transactions succeed cleanly upon user confirmation.
   */
  private async alignHardhatNonceIfNeeded(address: string, errorMessage: string): Promise<boolean> {
    const match = errorMessage.match(/Expected nonce to be (\d+) but got (\d+)/i);
    if (!match) return false;
    const gotNonce = parseInt(match[2], 10);
    if (isNaN(gotNonce)) return false;

    try {
      const hexNonce = '0x' + gotNonce.toString(16);
      await fetch(this.hardhatRpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'hardhat_setNonce',
          params: [address, hexNonce],
          id: Date.now(),
        }),
        cache: 'no-store',
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Performs an uncached JSON-RPC ping to http://127.0.0.1:8545
   */
  public async checkLocalNode(): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    try {
      const response = await fetch(this.hardhatRpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          { jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 },
          { jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 2 },
        ]),
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const chainRes = Array.isArray(data) ? data.find((d) => d.id === 1) : data;
      const blockRes = Array.isArray(data) ? data.find((d) => d.id === 2) : null;

      const chainId = chainRes?.result ? parseInt(chainRes.result, 16) : 31337;
      const latestBlock = blockRes?.result ? parseInt(blockRes.result, 16) : 0;

      if (!this.jsonRpcProvider) {
        this.initProvider();
      }

      this.status = {
        ...this.status,
        isNodeOnline: true,
        chainId,
        latestBlock,
        lastChecked: Date.now(),
        errorMessage: undefined,
      };
      this.notifyListeners();
      return true;
    } catch (err: any) {
      clearTimeout(timeoutId);
      this.status = {
        ...this.status,
        isNodeOnline: false,
        chainId: null,
        latestBlock: null,
        lastChecked: Date.now(),
        errorMessage:
          'Hardhat RPC server (http://127.0.0.1:8545) is offline or unreachable. Run "npx hardhat node" in your terminal.',
      };
      this.notifyListeners();
      return false;
    }
  }

  /**
   * Fetches live ETH balances for an array of addresses directly from Hardhat RPC
   */
  public async fetchLiveBalances(addresses: string[]): Promise<Record<string, string> | null> {
    const isOnline = await this.checkLocalNode();
    if (!isOnline) return null;

    try {
      const results: Record<string, string> = {};
      await Promise.all(
        addresses.map(async (addr) => {
          const response = await fetch(this.hardhatRpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getBalance',
              params: [addr, 'latest'],
              id: Date.now(),
            }),
            cache: 'no-store',
          });
          const data = await response.json();
          const balWei = data?.result ? BigInt(data.result) : 0n;
          results[addr.toLowerCase()] = parseFloat(ethers.formatEther(balWei)).toFixed(4);
        })
      );
      return results;
    } catch {
      return null;
    }
  }

  /**
   * Checks if bytecode exists at a given contract address on the live Hardhat node
   */
  public async hasContractCode(address: string): Promise<boolean> {
    if (!this.status.isNodeOnline) return false;
    try {
      const response = await fetch(this.hardhatRpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getCode',
          params: [address, 'latest'],
          id: Date.now(),
        }),
        cache: 'no-store',
      });
      const data = await response.json();
      const code = data?.result;
      return Boolean(code && code !== '0x' && code !== '0x0');
    } catch {
      return false;
    }
  }

  /**
   * Ensures EscrowFactory is deployed on the running Hardhat node.
   * Uses Hardhat Account #9 (FACTORY_DEPLOYER_PRIVATE_KEY) so that Client (Account #0),
   * Freelancer (Account #1), and Arbitrator (Account #2) nonces are never incremented outside MetaMask.
   */
  public async ensureFactoryDeployed(
    _unusedKey?: string,
    knownFactoryAddress?: string
  ): Promise<string> {
    const isOnline = await this.checkLocalNode();
    if (!isOnline) {
      throw new Error(
        'Hardhat RPC Server (http://127.0.0.1:8545) is OFFLINE. Wallet disconnected from local blockchain. Please run "npx hardhat node" in your terminal.'
      );
    }

    if (knownFactoryAddress && ethers.isAddress(knownFactoryAddress)) {
      const exists = await this.hasContractCode(knownFactoryAddress);
      if (exists) {
        this.status.factoryDeployedAddress = knownFactoryAddress;
        this.notifyListeners();
        return knownFactoryAddress;
      }
    }

    if (this.status.factoryDeployedAddress) {
      const exists = await this.hasContractCode(this.status.factoryDeployedAddress);
      if (exists) {
        return this.status.factoryDeployedAddress;
      }
    }

    const freshProvider = new ethers.JsonRpcProvider(this.hardhatRpcUrl, undefined, {
      staticNetwork: false,
      batchMaxCount: 1,
      cacheTimeout: -1,
    });
    const wallet = new ethers.Wallet(FACTORY_DEPLOYER_PRIVATE_KEY, freshProvider);
    const freshNonce = await this.getFreshNonce(wallet.address);

    const factory = new ethers.ContractFactory(
      ESCROW_FACTORY_ARTIFACT.abi,
      ESCROW_FACTORY_ARTIFACT.bytecode,
      wallet
    );
    const contract = await factory.deploy({ nonce: freshNonce });
    await contract.waitForDeployment();
    const deployedAddress = await contract.getAddress();

    this.status.factoryDeployedAddress = deployedAddress;
    this.notifyListeners();
    return deployedAddress;
  }

  /**
   * Ensures MetaMask is connected, on Hardhat Chain ID 31337 (0x7a69), and returns an Ethers JsonRpcSigner
   * for `senderAddress` so that MetaMask ALWAYS pops up its confirmation window for every transaction.
   */
  private async getMetaMaskSignerForSender(senderAddress: string): Promise<ethers.JsonRpcSigner> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error(
        'MetaMask browser extension not detected. Please install or enable MetaMask to confirm transactions.'
      );
    }

    const ethereum = (window as any).ethereum;
    this.browserProvider = new ethers.BrowserProvider(ethereum);

    // 1. Ensure MetaMask is on Chain ID 31337 (0x7a69)
    const chainIdHex: string = await ethereum.request({ method: 'eth_chainId' });
    if (parseInt(chainIdHex, 16) !== 31337) {
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x7a69' }],
        });
      } catch (switchError: any) {
        if (this.isUserRejection(switchError)) {
          throw new Error('Network switch to Hardhat (Chain ID 31337) was rejected in MetaMask.');
        }
        if (switchError.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x7a69',
                chainName: 'Hardhat Localhost 8545',
                rpcUrls: ['http://127.0.0.1:8545'],
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
      this.browserProvider = new ethers.BrowserProvider(ethereum);
    }

    // 2. Check authorized accounts in MetaMask
    let accounts: string[] = await ethereum.request({ method: 'eth_accounts' });
    const targetLower = senderAddress.toLowerCase();

    // If no accounts are authorized yet, or the required role account is not authorized in MetaMask,
    // force open the MetaMask permissions popup so the user can select/authorize the account.
    if (!accounts || accounts.length === 0 || !accounts.some((a) => a.toLowerCase() === targetLower)) {
      try {
        await ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
        accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      } catch (permErr: any) {
        if (this.isUserRejection(permErr)) {
          throw new Error('Transaction cancelled: Account authorization was rejected in MetaMask.');
        }
        throw permErr;
      }
    }

    if (!accounts || !accounts.some((a) => a.toLowerCase() === targetLower)) {
      throw new Error(
        `Required role wallet (${senderAddress.substring(0, 10)}...) is not selected in MetaMask. Please select or import ${senderAddress} in MetaMask and try again.`
      );
    }

    // Update status
    this.status.metaMaskConnected = true;
    this.status.metaMaskAddress = ethers.getAddress(senderAddress);
    this.status.metaMaskChainId = 31337;
    this.notifyListeners();

    return await this.browserProvider.getSigner(ethers.getAddress(senderAddress));
  }

  /**
   * Formats decoded event args cleanly for display in the receipt inspector
   */
  private formatEventArgs(fragment: ethers.EventFragment, args: ethers.Result): Record<string, any> {
    const formatted: Record<string, any> = {};
    fragment.inputs.forEach((input, idx) => {
      const key = input.name || `param_${idx}`;
      const val = args[idx];
      if (typeof val === 'bigint') {
        if (
          key.toLowerCase().includes('amount') ||
          key.toLowerCase().includes('share') ||
          key.toLowerCase().includes('refund')
        ) {
          formatted[key] = `${val.toString()} wei (${ethers.formatEther(val)} ETH)`;
        } else {
          formatted[key] = Number(val);
        }
      } else {
        formatted[key] = val;
      }
    });
    return formatted;
  }

  /**
   * Decodes all logs from a transaction receipt using EscrowFactory & FreelanceMilestoneEscrow ABIs
   */
  public decodeReceiptLogs(logs: readonly ethers.Log[]): DecodedEvent[] {
    const decoded: DecodedEvent[] = [];
    for (const log of logs) {
      let parsed = this.factoryInterface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });
      if (!parsed) {
        parsed = this.escrowInterface.parseLog({
          topics: [...log.topics],
          data: log.data,
        });
      }
      if (parsed && parsed.fragment) {
        decoded.push({
          name: parsed.name,
          signature: parsed.signature,
          args: this.formatEventArgs(parsed.fragment, parsed.args),
        });
      }
    }
    return decoded;
  }

  /**
   * Deploys a new FreelanceMilestoneEscrow contract via EscrowFactory.
   * Requires explicit MetaMask confirmation when MetaMask is available and NEVER generates a receipt if rejected.
   */
  public async executeCreateAgreementOnChain(params: {
    senderAddress: string;
    senderPrivateKey: string;
    factoryAddress: string;
    freelancer: string;
    arbitrator: string;
    title: string;
    milestoneTitles: string[];
    milestoneAmountsWei: bigint[];
    milestoneDeadlines: bigint[];
  }): Promise<OnChainTxResult & { deployedEscrowAddress: string }> {
    const isOnline = await this.checkLocalNode();
    if (!isOnline) {
      throw new Error(
        'Hardhat RPC Server (http://127.0.0.1:8545) is CLOSED / OFFLINE. Cannot execute transaction while disconnected from the Hardhat server.'
      );
    }

    const freshProvider = new ethers.JsonRpcProvider(this.hardhatRpcUrl, undefined, {
      staticNetwork: false,
      batchMaxCount: 1,
      cacheTimeout: -1,
    });

    const mmSigner = await this.getMetaMaskSignerForSender(params.senderAddress);
    const factoryContract = new ethers.Contract(params.factoryAddress, FACTORY_ABI, mmSigner);

    let txResponse: ethers.ContractTransactionResponse;
    try {
      txResponse = await factoryContract.createAgreement(
        params.freelancer,
        params.arbitrator,
        params.title,
        params.milestoneTitles,
        params.milestoneAmountsWei,
        params.milestoneDeadlines
      );
    } catch (mmErr: any) {
      if (this.isUserRejection(mmErr)) {
        throw new Error('Transaction rejected by user in MetaMask.');
      }
      const errMsg = String(mmErr?.message || '');
      const aligned = await this.alignHardhatNonceIfNeeded(params.senderAddress, errMsg);
      if (aligned) {
        try {
          txResponse = await factoryContract.createAgreement(
            params.freelancer,
            params.arbitrator,
            params.title,
            params.milestoneTitles,
            params.milestoneAmountsWei,
            params.milestoneDeadlines
          );
        } catch (retryErr: any) {
          if (this.isUserRejection(retryErr)) {
            throw new Error('Transaction rejected by user in MetaMask.');
          }
          throw retryErr;
        }
      } else {
        throw new Error(mmErr?.shortMessage || mmErr?.reason || mmErr?.message || 'MetaMask transaction failed');
      }
    }

    const receipt = await txResponse.wait();
    if (!receipt || receipt.status === 0) {
      throw new Error('Transaction failed or reverted on the Hardhat blockchain.');
    }

    const block = await freshProvider.getBlock(receipt.blockNumber);
    const events = this.decodeReceiptLogs(receipt.logs);

    let deployedEscrowAddress = '';
    for (const log of receipt.logs) {
      const parsed = this.factoryInterface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });
      if (parsed && parsed.name === 'AgreementCreated') {
        deployedEscrowAddress = ethers.getAddress(parsed.args[0]);
        break;
      }
    }

    if (!deployedEscrowAddress) {
      const readerContract = new ethers.Contract(params.factoryAddress, FACTORY_ABI, freshProvider);
      const allEscrows: string[] = await readerContract.getAllEscrows();
      deployedEscrowAddress = ethers.getAddress(allEscrows[allEscrows.length - 1]);
    }

    await this.checkLocalNode();

    return {
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      transactionIndex: receipt.index,
      nonce: txResponse.nonce,
      gasUsed: Number(receipt.gasUsed),
      cumulativeGasUsed: Number(receipt.cumulativeGasUsed),
      effectiveGasPriceGwei: ethers.formatUnits(receipt.gasPrice ?? 0n, 'gwei'),
      calldata: txResponse.data,
      from: ethers.getAddress(receipt.from),
      to: ethers.getAddress(receipt.to ?? params.factoryAddress),
      contractAddress: deployedEscrowAddress,
      deployedEscrowAddress,
      events,
      timestamp: block ? Number(block.timestamp) : Math.floor(Date.now() / 1000),
      executionSource: 'metamask_rpc',
    };
  }

  /**
   * Executes a state-changing method on a deployed FreelanceMilestoneEscrow contract.
   * Always prompts for MetaMask confirmation and aborts immediately if rejected in MetaMask.
   */
  public async executeEscrowMethodOnChain(params: {
    senderAddress: string;
    senderPrivateKey: string;
    contractAddress: string;
    methodName:
      | 'fundAgreement'
      | 'submitMilestone'
      | 'approveMilestone'
      | 'raiseDispute'
      | 'resolveDispute'
      | 'refundMilestone'
      | 'withdraw';
    args: any[];
    valueWei?: bigint;
  }): Promise<OnChainTxResult> {
    const isOnline = await this.checkLocalNode();
    if (!isOnline) {
      throw new Error(
        'Hardhat RPC Server (http://127.0.0.1:8545) is CLOSED / OFFLINE. Cannot execute transaction while disconnected from the Hardhat server.'
      );
    }

    const codeExists = await this.hasContractCode(params.contractAddress);
    if (!codeExists) {
      throw new Error(
        `No contract bytecode found at ${params.contractAddress} on Hardhat node (http://127.0.0.1:8545). If you restarted "npx hardhat node", click "Reset Data" to sync with the fresh chain.`
      );
    }

    const freshProvider = new ethers.JsonRpcProvider(this.hardhatRpcUrl, undefined, {
      staticNetwork: false,
      batchMaxCount: 1,
      cacheTimeout: -1,
    });

    const mmSigner = await this.getMetaMaskSignerForSender(params.senderAddress);
    const escrowContract = new ethers.Contract(params.contractAddress, ESCROW_ABI, mmSigner);
    const overrides: Record<string, any> = {};
    if (params.valueWei && params.valueWei > 0n) {
      overrides.value = params.valueWei;
    }

    let txResponse: ethers.ContractTransactionResponse;
    try {
      txResponse = await escrowContract[params.methodName](...params.args, overrides);
    } catch (mmErr: any) {
      if (this.isUserRejection(mmErr)) {
        throw new Error('Transaction rejected by user in MetaMask.');
      }
      const errMsg = String(mmErr?.message || '');
      const aligned = await this.alignHardhatNonceIfNeeded(params.senderAddress, errMsg);
      if (aligned) {
        try {
          txResponse = await escrowContract[params.methodName](...params.args, overrides);
        } catch (retryErr: any) {
          if (this.isUserRejection(retryErr)) {
            throw new Error('Transaction rejected by user in MetaMask.');
          }
          throw retryErr;
        }
      } else {
        throw new Error(mmErr?.shortMessage || mmErr?.reason || mmErr?.message || 'MetaMask transaction failed');
      }
    }

    const receipt = await txResponse.wait();
    if (!receipt || receipt.status === 0) {
      throw new Error('Transaction failed or reverted on the Hardhat blockchain.');
    }

    const block = await freshProvider.getBlock(receipt.blockNumber);
    const events = this.decodeReceiptLogs(receipt.logs);

    await this.checkLocalNode();

    return {
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      transactionIndex: receipt.index,
      nonce: txResponse.nonce,
      gasUsed: Number(receipt.gasUsed),
      cumulativeGasUsed: Number(receipt.cumulativeGasUsed),
      effectiveGasPriceGwei: ethers.formatUnits(receipt.gasPrice ?? 0n, 'gwei'),
      calldata: txResponse.data,
      from: ethers.getAddress(receipt.from),
      to: ethers.getAddress(receipt.to ?? params.contractAddress),
      events,
      timestamp: block ? Number(block.timestamp) : Math.floor(Date.now() / 1000),
      executionSource: 'metamask_rpc',
    };
  }

  /**
   * Queries the live Hardhat RPC server (`eth_getTransactionReceipt` & `eth_getTransactionByHash`)
   * to cryptographically verify that a transaction hash exists on-chain.
   */
  public async verifyTransactionOnChain(txHash: string): Promise<LiveReceiptVerification> {
    const isOnline = await this.checkLocalNode();
    if (!isOnline) {
      return {
        verified: false,
        checkedAt: Date.now(),
        rpcUrl: this.hardhatRpcUrl,
        error:
          'Hardhat RPC Server (http://127.0.0.1:8545) is OFFLINE. Cannot verify transaction while the Hardhat node is closed.',
      };
    }

    try {
      const freshProvider = new ethers.JsonRpcProvider(this.hardhatRpcUrl, undefined, {
        staticNetwork: false,
        batchMaxCount: 1,
        cacheTimeout: -1,
      });

      const [receipt, tx, currentBlock] = await Promise.all([
        freshProvider.getTransactionReceipt(txHash),
        freshProvider.getTransaction(txHash),
        freshProvider.getBlockNumber(),
      ]);

      if (!receipt || !tx) {
        return {
          verified: false,
          checkedAt: Date.now(),
          rpcUrl: this.hardhatRpcUrl,
          error: `Transaction ${txHash.substring(0, 14)}... was not found on the current Hardhat node (Chain 31337). The node may have been restarted since this transaction was recorded.`,
        };
      }

      return {
        verified: true,
        checkedAt: Date.now(),
        rpcUrl: this.hardhatRpcUrl,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        transactionIndex: receipt.index,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPriceGwei: ethers.formatUnits(receipt.gasPrice ?? 0n, 'gwei'),
        status: receipt.status === 1 ? '0x1 (Success)' : '0x0 (Reverted)',
        confirmations: Math.max(1, currentBlock - receipt.blockNumber + 1),
        from: receipt.from,
        to: receipt.to ?? undefined,
        nonce: tx.nonce,
        rawReceipt: {
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          blockHash: receipt.blockHash,
          transactionIndex: receipt.index,
          from: receipt.from,
          to: receipt.to,
          gasUsed: receipt.gasUsed.toString(),
          cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
          effectiveGasPrice: (receipt.gasPrice ?? 0n).toString(),
          status: receipt.status,
          logsCount: receipt.logs.length,
        },
      };
    } catch (err: any) {
      return {
        verified: false,
        checkedAt: Date.now(),
        rpcUrl: this.hardhatRpcUrl,
        error: err.message || 'RPC verification query failed',
      };
    }
  }

  /**
   * Connects to MetaMask and ALWAYS opens the MetaMask permission & account selection popup
   * via `wallet_requestPermissions` (EIP-2255).
   */
  public async connectMetaMask(preferredAddress?: string): Promise<{ address: string; chainId: string }> {
    const isOnline = await this.checkLocalNode();
    if (!isOnline) {
      throw new Error(
        'Hardhat RPC Server (http://127.0.0.1:8545) is offline! Please start "npx hardhat node" before connecting your wallet.'
      );
    }

    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('MetaMask or Web3 wallet extension not detected in browser');
    }

    const ethereum = (window as any).ethereum;
    this.browserProvider = new ethers.BrowserProvider(ethereum);

    // Force MetaMask to open the account selection & permissions popup every single time
    try {
      await ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });
    } catch (permErr: any) {
      if (this.isUserRejection(permErr)) {
        throw new Error('MetaMask connection cancelled by user.');
      }
      throw permErr;
    }

    const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error('No account authorized in MetaMask');
    }

    // Ensure Hardhat network (Chain ID 31337 / 0x7a69) is selected
    const chainIdHexCurrent: string = await ethereum.request({ method: 'eth_chainId' });
    if (parseInt(chainIdHexCurrent, 16) !== 31337) {
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x7a69' }], // 31337 in hex
        });
      } catch (switchError: any) {
        if (this.isUserRejection(switchError)) {
          throw new Error('Network switch to Hardhat Localhost 8545 was rejected in MetaMask.');
        }
        if (switchError.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x7a69',
                chainName: 'Hardhat Localhost 8545',
                rpcUrls: ['http://127.0.0.1:8545'],
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              },
            ],
          });
        }
      }
      this.browserProvider = new ethers.BrowserProvider(ethereum);
    }

    let selectedAddr = accounts[0];
    if (preferredAddress) {
      const matchedInAuthorized = accounts.find(
        (a) => a.toLowerCase() === preferredAddress.toLowerCase()
      );
      if (matchedInAuthorized) {
        selectedAddr = matchedInAuthorized;
      }
    }

    const checksumAddr = ethers.getAddress(selectedAddr);
    this.status.metaMaskConnected = true;
    this.status.metaMaskAddress = checksumAddr;
    this.status.metaMaskChainId = 31337;
    this.notifyListeners();

    return { address: checksumAddr, chainId: '0x7a69' };
  }

  public getJsonRpcProvider(): ethers.JsonRpcProvider | null {
    return this.jsonRpcProvider;
  }

  public getBrowserProvider(): ethers.BrowserProvider | null {
    return this.browserProvider;
  }
}

export const web3Service = new Web3Service();
