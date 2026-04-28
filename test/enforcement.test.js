const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Repayment Enforcement & SBT", function () {
  let MicroLend, microlend;
  let ReputationSBT, sbt;
  let owner, borrower, lender;

  beforeEach(async function () {
    [owner, borrower, lender] = await ethers.getSigners();

    // Deploy SBT
    ReputationSBT = await ethers.getContractFactory("ReputationSBT");
    sbt = await ReputationSBT.deploy();

    // Deploy MicroLend
    MicroLend = await ethers.getContractFactory("MicroLend");
    microlend = await MicroLend.deploy();

    // Link SBT to MicroLend
    await microlend.setReputationContract(await sbt.getAddress());

    // Give MicroLend permission to mint SBTs
    await sbt.transferOwnership(await microlend.getAddress());
  });

  it("Should mint GOOD_BORROWER SBT on successful repayment", async function () {
    // Borrower applies for a loan
    await microlend.connect(borrower).applyForLoan(
      ethers.parseEther("0.1"), // amount
      700, // creditScore
      "Business", // purpose
      30, // duration
      "Vehicle", // collateralAsset
      50000, // collateralValue
      false // extensionRequested
    );

    // Lender funds the loan
    await microlend.connect(lender).fundLoan(borrower.address, 1, { value: ethers.parseEther("0.1") });

    // Calculate repayment amount (0.1 ETH + 6% interest for 30 days)
    // 6% = 600 bps. Interest = 0.1 * 600 / 10000 = 0.006 ETH. Total = 0.106 ETH
    const repaymentAmount = ethers.parseEther("0.106");

    // Borrower repays the loan
    await microlend.connect(borrower).repayLoan(1, { value: repaymentAmount });

    // Check SBT balance and type
    expect(await sbt.balanceOf(borrower.address)).to.equal(1);
    
    // First token minted will have ID 0
    const badgeType = await sbt.tokenBadges(0);
    expect(badgeType).to.equal(1n); // 1 = GOOD_BORROWER

    // Check user badges array
    const badges = await sbt.getUserBadges(borrower.address);
    expect(badges.length).to.equal(1);
    expect(badges[0]).to.equal(1n);
  });

  it("Should mint DEFAULTER SBT after grace period", async function () {
    // Borrower applies for a loan
    await microlend.connect(borrower).applyForLoan(
      ethers.parseEther("0.1"), // amount
      700, // creditScore
      "Business", // purpose
      30, // duration
      "Vehicle", // collateralAsset
      50000, // collateralValue
      false // extensionRequested
    );

    // Lender funds the loan
    await microlend.connect(lender).fundLoan(borrower.address, 1, { value: ethers.parseEther("0.1") });

    // Fast forward time past repayment deadline + grace period
    // Duration is 30 days, grace period is 7 days = 37 days total
    await time.increase(38 * 24 * 60 * 60);

    // Call markAsDefaulted (anyone can call it)
    await microlend.connect(owner).markAsDefaulted(borrower.address, 1);

    // Check SBT balance and type
    expect(await sbt.balanceOf(borrower.address)).to.equal(1);
    
    // First token minted will have ID 0
    const badgeType = await sbt.tokenBadges(0);
    expect(badgeType).to.equal(2n); // 2 = DEFAULTER

    const badges = await sbt.getUserBadges(borrower.address);
    expect(badges[0]).to.equal(2n);
  });

  it("Should prevent transfers of SBT", async function () {
    // Mock the mint manually by reverting ownership back temporarily? No, we can just use the loan flow
    await microlend.connect(borrower).applyForLoan(
      ethers.parseEther("0.1"), 700, "Business", 30, "Vehicle", 50000, false
    );
    await microlend.connect(lender).fundLoan(borrower.address, 1, { value: ethers.parseEther("0.1") });
    await microlend.connect(borrower).repayLoan(1, { value: ethers.parseEther("0.106") });

    // Attempt to transfer SBT (Token ID 0)
    await expect(
      sbt.connect(borrower).transferFrom(borrower.address, lender.address, 0)
    ).to.be.revertedWith("SBT: transfers are blocked");
  });
});
