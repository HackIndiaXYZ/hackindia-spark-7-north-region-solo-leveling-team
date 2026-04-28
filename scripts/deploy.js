const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying MicroLend contract...");

  const MicroLend = await hre.ethers.getContractFactory("MicroLend");
  const microlend = await MicroLend.deploy();

  await microlend.waitForDeployment();

  const address = await microlend.getAddress();
  console.log("MicroLend deployed to:", address);

  // Update frontend contract address and ABI
  const abiDir = path.join(__dirname, "..", "frontend", "src", "utils");
  const abiFile = path.join(abiDir, "contractABI.js");

  const contractArtifact = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "artifacts", "contracts", "MicroLend.sol", "MicroLend.json"),
      "utf8"
    )
  );

  const abiContent = `
export const CONTRACT_ADDRESS = "${address}";
export const CONTRACT_ABI = ${JSON.stringify(contractArtifact.abi, null, 2)};
`;

  fs.writeFileSync(abiFile, abiContent);
  console.log("Updated frontend ABI and address.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
