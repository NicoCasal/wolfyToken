import { ethers } from "hardhat";

async function main() {
    
const AuctionV2 = await ethers.getContractFactory("AuctionV2");
const auctionv2 = await AuctionV2.deploy();//delcarar la addres necesaria

await auctionv2.deployed(); 

console.log("auctionv2 deployed to:", auctionv2.address);
}
main().catch((error) => {
console.error(error);
process.exitCode = 1;
});
