const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("FreelanceMilestoneEscrow — Access Control & Role Boundaries", function () {
  it("should prevent unauthorized callers from executing privileged operations", async function () {
    const [client, freelancer, arbitrator, attacker] = await ethers.getSigners();
    const titles = ["Milestone 1"];
    const amounts = [ethers.parseEther("1.0")];
    const currentTime = await time.latest();
    const deadlines = [currentTime + 10000];

    const Factory = await ethers.getContractFactory("FreelanceMilestoneEscrow");
    const escrow = await Factory.deploy(
      client.address,
      freelancer.address,
      arbitrator.address,
      "Access Control Test",
      titles,
      amounts,
      deadlines
    );

    // Attacker cannot fund
    await expect(
      escrow.connect(attacker).fundAgreement({ value: amounts[0] })
    ).to.be.revertedWith("FreelanceMilestoneEscrow: caller is not client");

    // Client funds properly
    await escrow.connect(client).fundAgreement({ value: amounts[0] });

    // Attacker cannot submit milestone
    await expect(
      escrow.connect(attacker).submitMilestone(0, "Hacker note")
    ).to.be.revertedWith("FreelanceMilestoneEscrow: caller is not freelancer");

    // Freelancer submits milestone
    await escrow.connect(freelancer).submitMilestone(0, "Valid note");

    // Attacker cannot approve
    await expect(
      escrow.connect(attacker).approveMilestone(0)
    ).to.be.revertedWith("FreelanceMilestoneEscrow: caller is not client");

    // Freelancer cannot approve their own milestone
    await expect(
      escrow.connect(freelancer).approveMilestone(0)
    ).to.be.revertedWith("FreelanceMilestoneEscrow: caller is not client");

    // Attacker and freelancer cannot raise dispute (onlyClient)
    await expect(
      escrow.connect(attacker).raiseDispute(0)
    ).to.be.revertedWith("FreelanceMilestoneEscrow: caller is not client");

    await expect(
      escrow.connect(freelancer).raiseDispute(0)
    ).to.be.revertedWith("FreelanceMilestoneEscrow: caller is not client");

    // Client raises dispute
    await escrow.connect(client).raiseDispute(0);

    // Neither client nor freelancer can resolve dispute
    await expect(
      escrow.connect(client).resolveDispute(0, 5000)
    ).to.be.revertedWith("FreelanceMilestoneEscrow: caller is not arbitrator");

    await expect(
      escrow.connect(freelancer).resolveDispute(0, 5000)
    ).to.be.revertedWith("FreelanceMilestoneEscrow: caller is not arbitrator");

    // Attacker cannot resolve dispute
    await expect(
      escrow.connect(attacker).resolveDispute(0, 5000)
    ).to.be.revertedWith("FreelanceMilestoneEscrow: caller is not arbitrator");

    // Arbitrator resolves dispute successfully
    await escrow.connect(arbitrator).resolveDispute(0, 6000);

    // Attacker cannot withdraw others' funds
    await expect(
      escrow.connect(attacker).withdraw()
    ).to.be.revertedWith("FreelanceMilestoneEscrow: no withdrawable balance");
  });
});
