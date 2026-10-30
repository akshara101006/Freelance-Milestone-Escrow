const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("EscrowFactory — Independent Agreement Deployment & Indexing", function () {
  it("should deploy independent escrows and track addresses per participant", async function () {
    const [client, freelancer, arbitrator] = await ethers.getSigners();
    const FactoryContract = await ethers.getContractFactory("EscrowFactory");
    const factory = await FactoryContract.deploy();

    const titles = ["Milestone A", "Milestone B"];
    const amounts = [ethers.parseEther("0.4"), ethers.parseEther("0.6")];
    const currentTime = await time.latest();
    const deadlines = [currentTime + 10000, currentTime + 20000];

    const tx = await factory.connect(client).createAgreement(
      freelancer.address,
      arbitrator.address,
      "Website Redesign",
      titles,
      amounts,
      deadlines
    );
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);

    expect(await factory.getEscrowCount()).to.equal(1);
    const all = await factory.getAllEscrows();
    expect(all.length).to.equal(1);

    const clientEscrows = await factory.getEscrowsForClient(client.address);
    expect(clientEscrows[0]).to.equal(all[0]);

    const freelancerEscrows = await factory.getEscrowsForFreelancer(freelancer.address);
    expect(freelancerEscrows[0]).to.equal(all[0]);
  });
});
