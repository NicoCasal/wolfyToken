/*import { time, constants } from "@openzeppelin/test-helpers";*/
import { expect } from "chai";
import { setupAddresses, setupEnvironment, minteado } from "./utils";

let wllt;
let cnt;
describe("Market", function () {
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
  //CASOS DE COMPRA

  describe("Fees", function () {
    it("should set maker fee", async function () {
      await expect(cnt.market.connect(wllt.owner).setMakerFee(200)).to.not.be
        .reverted;
    });

    it("should set taker fee", async function () {
      await expect(cnt.market.connect(wllt.owner).setTakerFee(200)).to.not.be
        .reverted;
    });
  });

  describe("When buying token", function () {
    it("should revert if token not listed", async function () {
      await expect(cnt.market.buyToken(1, 1)).to.be.revertedWith(
        "Token not in sell book"
      );
    });
    it("should not revert if token listed", async function () {
      await cnt.market
        .connect(wllt.seller)
        .readyToSellToken([2], 1, 1, 1, cnt.ercuups721.address);

      await expect(cnt.market.connect(wllt.buyer).buyToken(1, 1)).to.not
        .reverted;
    });
    it("should allow non-token buy", async function () {
      await cnt.market
        .connect(wllt.seller)
        .readyToSellToken([2], 1, 1, 0, cnt.ercuups721.address);
      await expect(
        cnt.market.connect(wllt.buyer).buyToken(1, 1, {
          value: 1,
        })
      ).to.not.reverted;
    });
    it("should revert if invalid buy amount", async function () {
      await cnt.market
        .connect(wllt.seller)
        .readyToSellToken([2], 1, 1, 0, cnt.ercuups721.address);

      await expect(
        cnt.market.connect(wllt.buyer).buyToken(1, 1)
      ).to.be.revertedWith("Invalid pay amount");
    });
    it("should revert if quantity is not enough", async function () {
      await cnt.market
        .connect(wllt.seller)
        .readyToSellToken([2], 1, 1, 1, cnt.ercuups721.address);
      await expect(cnt.market.buyToken(1, 0)).to.be.revertedWith(
        "Insufficient quantity"
      );
    });
    it("should not revert if quantity is correct", async function () {
      await cnt.market
        .connect(wllt.seller)
        .readyToSellToken([2], 1, 1, 1, cnt.ercuups721.address);

      await expect(cnt.market.buyToken(1, 1)).to.not.be.reverted;
    });
  });

  describe("Batch buy", function () {
    it("should revert if trying to buy over amount", async function () {
      await cnt.market
        .connect(wllt.seller)
        .readyToSellToken([2], 1, 1, 1, cnt.ercuups721.address);

      await expect(cnt.market.buyToken(1, 2)).to.be.revertedWith(
        "Excessive quantity"
      );
    });
    it("should not revert if quantity is in parameters", async function () {
      await cnt.market
        .connect(wllt.seller)
        .readyToSellToken([2], 1, 1, 1, cnt.ercuups721.address);
      await cnt.erc20.connect(wllt.owner).approve(cnt.auctionv2.address, 10000);

      await expect(cnt.market.buyToken(1, 1)).to.not.be.reverted;
    });
  });

  describe("When selling tokens", function () {
    it("should revert if price is less than one", async function () {
      await expect(
        cnt.market
          .connect(wllt.seller)
          .readyToSellToken([2], 1, 0, 0, cnt.ercuups721.address)
      ).to.be.revertedWith("Price must be geater than zero");
    });
    it("should not revert if price is over one", async function () {
      await expect(
        cnt.market
          .connect(wllt.seller)
          .readyToSellToken([2], 1, 1, 1, cnt.ercuups721.address)
      ).to.not.be.reverted;
    });
    it("should revert if non seller tries to cancel", async function () {
      await cnt.market
        .connect(wllt.seller)
        .readyToSellToken([2], 1, 1, 1, cnt.ercuups721.address);

      await expect(
        cnt.market.connect(wllt.owner).cancelSellToken(3)
      ).to.be.revertedWith("Only Seller can cancel sale");
    });
    it("should revert if seller cancels", async function () {
      await cnt.market
        .connect(wllt.seller)
        .readyToSellToken([2], 1, 1, 1, cnt.ercuups721.address);

      await expect(cnt.market.connect(wllt.seller).cancelSellToken(1)).to.not.be
        .reverted;
    });
  });
  describe("View functions", function () {
    it("should return all asks", async function () {
      await expect(cnt.market.connect(wllt.owner).getAsks()).to.not.reverted;
    });
    it("should return asks lengths", async function () {
      await expect(cnt.market.connect(wllt.owner).getAskLength()).to.not
        .reverted;
    });
    it("should get order info", async function () {
      await cnt.market
        .connect(wllt.seller)
        .readyToSellToken([2], 1, 1, 1, cnt.ercuups721.address);
      await expect(cnt.market.connect(wllt.owner).getOrder(2)).to.not.reverted;
    });
  });
});
