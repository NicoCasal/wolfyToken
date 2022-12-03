
import { ethers } from "hardhat";


async function main() {
    
const ERC20 = await ethers.getContractFactory("ERC20");
const erc20 = await ERC20.deploy("ARG", "AR");

await erc20.deployed();

console.log("ERC20 deployed to:", erc20.address);
//address "0x3ab007bf80819D606BED310EDfa283732C531ba0"
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});