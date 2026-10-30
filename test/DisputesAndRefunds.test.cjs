const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("FreelanceMilestoneEscrow — Disputes, Basis Point Allocation, and Refunds", function () {
  it("should split disputed milestone using integer basis points without rounding leakage", async function () {
    const [client, freelancer, arbitrator] = await ethers.getSigners();
    const oddAmount = 1000000000000000001n; // 1 wei above 1 ETH
    const regularAmount = ethers.parseEther("0.5");
    const currentTime = await time.latest();

    const Factory = await ethers.getContractFactory("FreelanceMilestoneEscrow");
    const escrow = await Factory.deploy(
      client.address,
      freelancer.address,
      arbitrator.address,
      "Dispute Project",
      ["Disputed Phase", "Remaining Phase"],
      [oddAmount, regularAmount],
      [currentTime + 5000, currentTime + 10000]
    );

    const total = oddAmount + regularAmount;
    await escrow.connect(client).fundAgreement({ value: total });
    await escrow.connect(freelancer).submitMilestone(0, "Work delivered");
    await escrow.connect(client).raiseDispute(0);

    // Arbitrator allocates 33.33% (3333 bps)
    await escrow.connect(arbitrator).resolveDispute(0, 3333);

    const m = await escrow.getMilestone(0);
    const fShare = m.freelancerShare_;
    const cRefund = m.clientRefund_;

    // Invariant: sum of shares must equal exactly oddAmount (zero leakage)
    expect(fShare + cRefund).to.equal(oddAmount);
    expect(await escrow.withdrawable(freelancer.address)).to.equal(fShare);
    expect(await escrow.withdrawable(client.address)).to.equal(cRefund);

    // Resolved milestone cannot be disputed or approved again
    await expect(escrow.connect(client).approveMilestone(0)).to.be.revertedWith(
      "FreelanceMilestoneEscrow: milestone not in Submitted state"
    );
    await expect(escrow.connect(client).raiseDispute(0)).to.be.revertedWith(
      "FreelanceMilestoneEscrow: can only dispute Submitted milestone"
    );
  });

  it("should refund unstarted milestone and prevent duplicate refunds", async function () {
    const [client, freelancer, arbitrator] = await ethers.getSigners();
    const amount = ethers.parseEther("0.5");
    const currentTime = await time.latest();

    const Factory = await ethers.getContractFactory("FreelanceMilestoneEscrow");
    const escrow = await Factory.deploy(
      client.address,
      freelancer.address,
      arbitrator.address,
      "Refund Project",
      ["Phase 1", "Phase 2"],
      [amount, amount],
      [currentTime + 5000, currentTime + 10000]
    );

    const total = amount + amount;
    await escrow.connect(client).fundAgreement({ value: total });

    // Client refunds unstarted milestone 0
    await expect(escrow.connect(client).refundMilestone(0))
      .to.emit(escrow, "MilestoneRefunded")
      .withArgs(0, amount, client.address, anyValue);

    expect(await escrow.withdrawable(client.address)).to.equal(amount);

    // Cannot refund milestone 0 again because its state is now Refunded
    await expect(escrow.connect(client).refundMilestone(0)).to.be.revertedWith(
      "FreelanceMilestoneEscrow: can only refund Pending milestone"
    );
  });
});
