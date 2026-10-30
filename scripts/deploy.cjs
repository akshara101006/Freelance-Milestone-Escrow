const { ethers } = require("hardhat");

async function main() {
  console.log("=================================================");
  console.log("Deploying Freelance Milestone Escrow Smart Contracts");
  console.log("=================================================");

  const [client, freelancer, arbitrator] = await ethers.getSigners();

  console.log("Client (Alex):      ", client.address);
  console.log("Freelancer (Stark): ", freelancer.address);
  console.log("Arbitrator (Mark):  ", arbitrator.address);
  console.log("-------------------------------------------------");

  // 1. Deploy Factory
  const Factory = await ethers.getContractFactory("EscrowFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("✅ EscrowFactory deployed to:", factoryAddress);

  // 2. Deploy Sample Agreement via Factory
  const titles = [
    "Milestone 1: Smart Contract Architecture & Specification",
    "Milestone 2: Frontend dApp UI & Web3 Integration",
    "Milestone 3: Mainnet Security Audit & Production Release",
  ];
  const amounts = [
    ethers.parseEther("0.30"),
    ethers.parseEther("0.50"),
    ethers.parseEther("0.20"),
  ];
  const now = Math.floor(Date.now() / 1000);
  const deadlines = [now + 86400 * 7, now + 86400 * 14, now + 86400 * 21];

  const tx = await factory.connect(client).createAgreement(
    freelancer.address,
    arbitrator.address,
    "Decentralized Milestone Escrow dApp Agreement",
    titles,
    amounts,
    deadlines
  );
  await tx.wait();

  const escrows = await factory.getAllEscrows();
  const escrowAddress = escrows[0];

  console.log("✅ Sample FreelanceMilestoneEscrow deployed via Factory to:", escrowAddress);
  console.log("   Total Required Funding:", ethers.formatEther(amounts.reduce((a, b) => a + b, 0n)), "ETH");
  console.log("=================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
