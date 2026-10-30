const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("FreelanceMilestoneEscrowModule", (m) => {
  // Deploy the EscrowFactory contract
  const escrowFactory = m.contract("EscrowFactory", []);

  return { escrowFactory };
});
