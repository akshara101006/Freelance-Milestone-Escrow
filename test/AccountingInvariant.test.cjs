const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("FreelanceMilestoneEscrow — Financial Invariants & Zero-Leakage Accounting", function () {
  it("should preserve contract balance == totalReserved + sum(withdrawable) at all times", async function () {
    const [client, freelancer, arbitrator] = await ethers.getSigners();
    const titles = ["Phase 1", "Phase 2", "Phase 3"];
    const amounts = [ethers.parseEther("1.0"), ethers.parseEther("2.0"), ethers.parseEther("1.5")];
    const currentTime = await time.latest();
    const deadlines = [currentTime + 1000, currentTime + 2000, currentTime + 3000];

    const Factory = await ethers.getContractFactory("FreelanceMilestoneEscrow");
    const escrow = await Factory.deploy(
      client.address,
      freelancer.address,
      arbitrator.address,
      "Invariant Project",
      titles,
      amounts,
      deadlines
    );

    // Initial state: 0 balance, 0 reserved, 0 withdrawable
    let inv = await escrow.verifyAccountingInvariant();
    expect(inv.isHolding).to.be.true;

    // 1. Funding
    const total = amounts[0] + amounts[1] + amounts[2];
    await escrow.connect(client).fundAgreement({ value: total });
    inv = await escrow.verifyAccountingInvariant();
    expect(inv.isHolding).to.be.true;
    expect(inv.currentBalance).to.equal(total);

    // 2. Submit & Approve Phase 1 (1.0 ETH)
    await escrow.connect(freelancer).submitMilestone(0, "Work note");
    await escrow.connect(client).approveMilestone(0);
    inv = await escrow.verifyAccountingInvariant();
    expect(inv.isHolding).to.be.true;
    expect(await escrow.withdrawable(freelancer.address)).to.equal(amounts[0]);

    // 3. Submit & Dispute Phase 2 (2.0 ETH) -> 70/30 split (7000 bps)
    await escrow.connect(freelancer).submitMilestone(1, "Phase 2 done");
    await escrow.connect(client).raiseDispute(1);
    await escrow.connect(arbitrator).resolveDispute(1, 7000); // 70% freelancer (1.4 ETH), 30% client (0.6 ETH)
    inv = await escrow.verifyAccountingInvariant();
    expect(inv.isHolding).to.be.true;

    // 4. Refund Phase 3 (1.5 ETH) unstarted
    await escrow.connect(client).refundMilestone(2);
    inv = await escrow.verifyAccountingInvariant();
    expect(inv.isHolding).to.be.true;

    // All reserved should now be 0, totalCredited == total
    expect(await escrow.totalReserved()).to.equal(0n);
    expect(await escrow.agreementState()).to.equal(2); // Completed

    // 5. Freelancer withdraws
    await escrow.connect(freelancer).withdraw();
    inv = await escrow.verifyAccountingInvariant();
    expect(inv.isHolding).to.be.true;

    // 6. Client withdraws refund credits
    await escrow.connect(client).withdraw();
    inv = await escrow.verifyAccountingInvariant();
    expect(inv.isHolding).to.be.true;
    expect(await ethers.provider.getBalance(await escrow.getAddress())).to.equal(0n);
  });
});
