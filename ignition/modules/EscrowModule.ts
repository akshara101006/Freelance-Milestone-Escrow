import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Hardhat Ignition deployment module for Freelance Milestone Escrow.
 * Deploys the master EscrowFactory which provisions standalone FreelanceEscrow contracts.
 */
const EscrowModule = buildModule("EscrowModule", (m) => {
  // Deploy the central EscrowFactory contract
  const escrowFactory = m.contract("EscrowFactory", []);

  return { escrowFactory };
});

export default EscrowModule;
