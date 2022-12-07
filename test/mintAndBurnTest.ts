/*import { time, constants } from "@openzeppelin/test-helpers";*/
import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAddresses, setupEnvironment, minteado } from "./utils";
let wllt;
let cnt;
describe("mint y burn ", function () {
  beforeEach(async () => {
    wllt = await setupAddresses();
    cnt = await setupEnvironment(wllt.owner);
    await minteado(
      wllt.owner,
      wllt.buyer,
      wllt.seller,
      cnt.erc20,
      cnt.ercuups721,
      cnt.Market
    );
  });
  it("minteo", async function () {
    await cnt.erc20.connect(wllt.owner).transfer(wllt.buyer.address, 1000000);
    await cnt.erc20.connect(wllt.owner).transfer(wllt.seller.address, 1000000);
    await cnt.erc20.connect(wllt.owner).approve(cnt.Market.address, 1000);
    await cnt.erc20.connect(wllt.buyer).approve(cnt.Market.address, 1000);
    await cnt.erc20.connect(wllt.seller).approve(cnt.Market.address, 1000);

    await cnt.ercuups721.connect(wllt.owner).safeMint(wllt.seller.address, 1);
  });
  it("burneo", async function () {
    console.log("Burn function not exists");
  });
});
