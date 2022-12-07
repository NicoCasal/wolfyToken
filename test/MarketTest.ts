/*import { time, constants } from "@openzeppelin/test-helpers";*/
import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAddresses, setupEnvironment, minteado } from "./utils";
import { time } from "@nomicfoundation/hardhat-network-helpers";

let wllt;
let cnt;
describe("MArket", function () {
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
  //CASOS DE COMPRA

  describe("maker and taker fee", function () {
    it("maker = maker fee", async function () {
      await expect(cnt.Market.connect(wllt.owner).setMakerFee(200)).to.not.be
        .reverted;
    });

    it("taker = maker fee", async function () {
      await expect(cnt.Market.connect(wllt.owner).setTakerFee(200)).to.not.be
        .reverted;
    });
  });

  describe("intento de compra de token", function () {
    describe(" token en venta", function () {
      it("token no listado", async function () {
        await expect(cnt.Market.buyToken(1, 1)).to.be.revertedWith(
          "Token not in sell book"
        );
      });
    });
    it("token listado", async function () {
      await cnt.Market.connect(wllt.seller).readyToSellToken(
        [2],
        1,
        1,
        1,
        cnt.ercuups721.address
      );

      await expect(cnt.Market.connect(wllt.buyer).buyToken(1, 1)).to.not
        .reverted;
    });
    it("token listado, comprado en eth", async function () {
      await cnt.Market.connect(wllt.seller).readyToSellToken(
        [2],
        1,
        1,
        0,
        cnt.ercuups721.address
      );
      await expect(
        cnt.Market.connect(wllt.buyer).buyToken(1, 1, {
          value: 1,
        })
      ).to.not.reverted;
    });
    it("priece == 0", async function () {
      await cnt.Market.connect(wllt.seller).readyToSellToken(
        [2],
        1,
        1,
        0,
        cnt.ercuups721.address
      );

      await expect(
        cnt.Market.connect(wllt.buyer).buyToken(1, 1)
      ).to.be.revertedWith("invalid pay amount");
    });
  });
  describe("intento de compra", function () {
    it("cantidad insuficiente", async function () {
      await cnt.Market.connect(wllt.seller).readyToSellToken(
        [2],
        1,
        1,
        1,
        cnt.ercuups721.address
      );
      await expect(cnt.Market.buyToken(1, 0)).to.be.revertedWith(
        "insufficient quantity"
      );
    });
  });
  describe("intento de compra", function () {
    it("cantidad suficiente", async function () {
      await cnt.Market.connect(wllt.seller).readyToSellToken(
        [2],
        1,
        1,
        1,
        cnt.ercuups721.address
      );

      await expect(cnt.Market.buyToken(1, 1)).to.not.be.reverted;
    });
  });

  describe("intento de compra en catidad", function () {
    it("exeso de cantidad", async function () {
      await cnt.Market.connect(wllt.seller).readyToSellToken(
        [2],
        1,
        1,
        1,
        cnt.ercuups721.address
      );

      await expect(cnt.Market.buyToken(1, 2)).to.be.revertedWith(
        "excessive quantity"
      );
    });
    it("cantidad aprobada", async function () {
      await cnt.Market.connect(wllt.seller).readyToSellToken(
        [2],
        1,
        1,
        1,
        cnt.ercuups721.address
      );
      await cnt.erc20.connect(wllt.owner).approve(cnt.auctionv2.address, 10000);

      await expect(cnt.Market.buyToken(1, 1)).to.not.be.reverted;
    });
  });

  //CASOS DE VENTA
  describe("intento de venta en valor 0", function () {
    it("precio del token < 1", async function () {
      await expect(
        cnt.Market.connect(wllt.seller).readyToSellToken(
          [2],
          1,
          0,
          0,
          cnt.ercuups721.address
        )
      ).to.be.revertedWith("Price must be granter than zero");
    });
    it("precio del token => 1", async function () {
      await expect(
        cnt.Market.connect(wllt.seller).readyToSellToken(
          [2],
          1,
          1,
          1,
          cnt.ercuups721.address
        )
      ).to.not.be.reverted;
    });
  });
  describe("cancelar la venta", function () {
    it("cancelando", async function () {
      await cnt.Market.connect(wllt.seller).readyToSellToken(
        [2],
        1,
        1,
        1,
        cnt.ercuups721.address
      );

      await expect(
        cnt.Market.connect(wllt.owner).cancelSellToken(3)
      ).to.be.revertedWith("Only Seller can cancel sell token");
    });
  });
  describe("cancelar la venta", function () {
    it("cancelando", async function () {
      await cnt.Market.connect(wllt.seller).readyToSellToken(
        [2],
        1,
        1,
        1,
        cnt.ercuups721.address
      );

      await expect(cnt.Market.connect(wllt.seller).cancelSellToken(1)).to.not.be
        .reverted;
    });
  });
  describe("consulta de ordenes", function () {
    it("consulta general", async function () {
      await expect(cnt.Market.connect(wllt.owner).getAsks()).to.not.reverted;
    });
    it("consulta general", async function () {
      await expect(cnt.Market.connect(wllt.owner).getAskLength()).to.not
        .reverted;
    });
    it("consulta general", async function () {
      await cnt.Market.connect(wllt.seller).readyToSellToken(
        [2],
        1,
        1,
        1,
        cnt.ercuups721.address
      );
      await expect(cnt.Market.connect(wllt.owner).getOrder(2)).to.not.reverted;
    });
  });
});
