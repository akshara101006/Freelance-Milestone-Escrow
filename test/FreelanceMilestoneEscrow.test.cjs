const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("FreelanceMilestoneEscrow — Core Lifecycle & Pull-over-Push Withdrawals", function () {
  async function deployEscrowFixture() {
    const [client, freelancer, arbitrator, attacker] = await ethers.getSigners();

    const titles = ["Milestone 1: UI Prototype", "Milestone 2: Backend Core", "Milestone 3: Final Delivery"];
    const amounts = [
      ethers.parseEther("0.3"),
      ethers.parseEther("0.5"),
      ethers.parseEther("0.2"),
    ];
    const currentTime = await time.latest();
    const deadlines = [
      currentTime + 3600 * 24 * 7,
      currentTime + 3600 * 24 * 14,
      currentTime + 3600 * 24 * 21,
    ];

    const Factory = await ethers.getContractFactory("FreelanceMilestoneEscrow");
    const escrow = await Factory.deploy(
      client.address,
      freelancer.address,
      arbitrator.address,
      "DApp Development Agreement",
      titles,
      amounts,
      deadlines
    );

    return { escrow, client, freelancer, arbitrator, attacker, titles, amounts, deadlines };
  }

  it("should initialize with correct roles, totalRequired, and Unfunded state", async function () {
    const { escrow, client, freelancer, arbitrator, amounts } = await deployEscrowFixture();

    expect(await escrow.client()).to.equal(client.address);
    expect(await escrow.freelancer()).to.equal(freelancer.address);
    expect(await escrow.arbitrator()).to.equal(arbitrator.address);
    expect(await escrow.agreementState()).to.equal(0); // Unfunded

    const totalExpected = amounts.reduce((acc, curr) => acc + curr, 0n);
    expect(await escrow.totalRequired()).to.equal(totalExpected);
    expect(await escrow.getMilestonesCount()).to.equal(3);
  });

  it("should accept exact funding only from client", async function () {
    const { escrow, client, attacker, amounts } = await deployEscrowFixture();
    const total = amounts.reduce((acc, curr) => acc + curr, 0n);

    // Non-client funding reverts
    await expect(
      escrow.connect(attacker).fundAgreement({ value: total })
    ).to.be.revertedWith("FreelanceMilestoneEscrow: caller is not client");

    // Underfunding reverts
    await expect(
      escrow.connect(client).fundAgreement({ value: total - 100n })
    ).to.be.revertedWith("FreelanceMilestoneEscrow: funding amount must exactly match totalRequired");

    // Overfunding reverts
    await expect(
      escrow.connect(client).fundAgreement({ value: total + 100n })
    ).to.be.revertedWith("FreelanceMilestoneEscrow: funding amount must exactly match totalRequired");

    // Exact funding succeeds
    await expect(escrow.connect(client).fundAgreement({ value: total }))
      .to.emit(escrow, "FundingReceived")
      .withArgs(client.address, total, anyValue);

    expect(await escrow.agreementState()).to.equal(1); // Active
    expect(await escrow.totalReserved()).to.equal(total);
  });

  it("should allow freelancer to submit milestone and client to approve into withdrawable credit", async function () {
    const { escrow, client, freelancer, amounts } = await deployEscrowFixture();
    const total = amounts.reduce((acc, curr) => acc + curr, 0n);
    await escrow.connect(client).fundAgreement({ value: total });

    // Freelancer submits milestone 0
    await expect(
      escrow.connect(freelancer).submitMilestone(0, "UI prototype completed at ipfs/demo-ref")
    )
      .to.emit(escrow, "MilestoneSubmitted")
      .withArgs(0, "UI prototype completed at ipfs/demo-ref", anyValue);

    const m = await escrow.getMilestone(0);
    expect(m.state_).to.equal(1); // Submitted

    // Client approves milestone 0
    await expect(escrow.connect(client).approveMilestone(0))
      .to.emit(escrow, "MilestoneReleased")
      .withArgs(0, amounts[0], freelancer.address, anyValue);

    // Freelancer withdrawable balance increases by milestone 0 amount
    expect(await escrow.withdrawable(freelancer.address)).to.equal(amounts[0]);

    // Pull-over-push withdrawal
    const preBalance = await ethers.provider.getBalance(freelancer.address);
    const tx = await escrow.connect(freelancer).withdraw();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;

    const postBalance = await ethers.provider.getBalance(freelancer.address);
    expect(postBalance).to.equal(preBalance + amounts[0] - gasUsed);
    expect(await escrow.withdrawable(freelancer.address)).to.equal(0n);
  });
});
