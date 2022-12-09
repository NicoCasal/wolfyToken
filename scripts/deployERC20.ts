import { ethers } from "hardhat";

async function main() {
  const ERC20 = await ethers.getContractFactory("MyToken2");
  const erc20 = await ERC20.deploy();

  await erc20.deployed();

  console.log("ERC20 deployed to:", erc20.address);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
