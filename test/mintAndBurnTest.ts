/*import { time, constants } from "@openzeppelin/test-helpers";*/
import { expect } from "chai";
import { setupAddresses, setupEnvironment, minteado } from "./utils";
let wllt;
let cnt;
describe("Mint", function () {
  beforeEach(async () => {
    wllt = await setupAddresses();
    cnt = await setupEnvironment(wllt.owner);
    await minteado(
      wllt.owner,
      wllt.buyer,
      wllt.seller,
      cnt.erc20,
      cnt.ercuups721,
      cnt.market
    );
  });
  it("should mint token correctly", async function () {
    await cnt.ercuups721.connect(wllt.owner).safeMint(wllt.seller.address, 1);
    const tokensByOwner = await cnt.ercuups721.tokensByOwner(
      wllt.seller.address
    );
    expect(tokensByOwner.length).to.be.greaterThan(1);
  });
  it("should revert if not owner", async function () {
    await expect(
      cnt.ercuups721.connect(wllt.seller).safeMint(wllt.seller.address, 1)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });
});
