import { expect } from "chai";
import { ethers } from "hardhat";
import { setupAddresses, setupEnvironment, minteadoAlAuction } from "./utils";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { values } from "underscore";

let wllt;
let cnt;

describe("AuctionV2", function () {
  beforeEach(async () => {
    wllt = await setupAddresses();
    cnt = await setupEnvironment(wllt.owner);
    await minteadoAlAuction(
      wllt.owner,
      wllt.buyer,
      wllt.seller,
      cnt.erc20,
      cnt.ercuups721,
      cnt.auctionv2
    );
  });
  describe("TARIFAS", function () {
    it("no hace falta alctualizar", async function () {
      await expect(
        cnt.auctionv2.connect(wllt.owner).setFeeTakerFee(10)
      ).to.be.revertedWith("Not need update");
    });
    it("actualizar valor", async function () {
      await expect(cnt.auctionv2.connect(wllt.owner).setFeeTakerFee(9)).to.not
        .be.reverted;
    });
  });
  describe("TARIFAS", function () {
    it("tarifa acorde", async function () {
      await expect(
        cnt.auctionv2.connect(wllt.owner).setFeeTakerFee(10000)
      ).to.be.revertedWith("Taker percent must be less than 10000");
    });
    it("valor superior de tarifas", async function () {
      await expect(cnt.auctionv2.connect(wllt.owner).setFeeTakerFee(100)).to.not
        .be.reverted;
    });
    describe("TARIFAS de transaccion", function () {
      it("no hace falta alctualizar", async function () {
        await expect(
          cnt.auctionv2
            .connect(wllt.owner)
            .transferFeeAddress(wllt.owner.address)
        ).to.be.revertedWith("Not need update");
      });
      it("hace falta actualizar", async function () {
        await expect(
          cnt.auctionv2
            .connect(wllt.owner)
            .transferFeeAddress(wllt.seller.address)
        ).to.not.be.reverted;
      });
    });
    describe("SUBASTAS", function () {
      describe("SUBASTA SIMPLE", function () {
        it("timpo minimo no aprobado", async function () {
          await expect(
            cnt.auctionv2
              .connect(wllt.seller)
              .createAuctionSingle(cnt.ercuups721.address, [2], 10, 30, true)
          ).to.be.revertedWith(
            "Duration must be greater than MMINIMAL_DURATION"
          );
        });
        it("tiempo minimo aprobado", async function () {
          await expect(
            cnt.auctionv2
              .connect(wllt.seller)
              .createAuctionSingle(cnt.ercuups721.address, [2], 10, 60, true)
          ).to.not.be.reverted;
        });
      });
      describe("tiempo maximo superado", function () {
        it("timpo de subaste", async function () {
          await expect(
            cnt.auctionv2
              .connect(wllt.seller)
              .createAuctionSingle(cnt.ercuups721.address, [2], 10, 700, true)
          ).to.be.reverted;
        });
        it("tiempo minimo aprobado", async function () {
          await expect(
            cnt.auctionv2
              .connect(wllt.seller)
              .createAuctionSingle(cnt.ercuups721.address, [2], 1, 500, true)
          ).to.not.be.reverted;
        });
      });
      describe("OFERTAS", function () {
        describe("subasta activa", function () {
          it("subasta no esta activa", async function () {
            await expect(
              cnt.auctionv2.connect(wllt.owner).bid(1, 10)
            ).to.be.revertedWith("Auction is not active");
          });
          it("subasta si esta activa", async function () {
            await cnt.auctionv2
              .connect(wllt.seller)
              .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);

            await expect(cnt.auctionv2.connect(wllt.owner).bid(1, 10)).to.not.be
              .reverted;
          });
        });
        describe("se espera que la subasta haya terminado", function () {
          it("subasta finalizada", async function () {
            await cnt.auctionv2
              .connect(wllt.seller)
              .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);

            const newOrder = await cnt.auctionv2.currentOrder();
            //console.log(newOrder);
            const OrderId = await cnt.auctionv2.getAllAuctionsID();
            console.log(OrderId);
            await time.increase(61 * 60 * 60);

            await expect(
              cnt.auctionv2.connect(wllt.owner).bid(newOrder, 2)
            ).to.be.revertedWith("Auction is over");
          });
          it("subasta no finalizada", async function () {
            await cnt.auctionv2
              .connect(wllt.seller)
              .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);

            const newOrder = await cnt.auctionv2.currentOrder();

            await expect(cnt.auctionv2.connect(wllt.owner).bid(newOrder, 2)).to
              .not.be.reverted;
          });
        });
        describe("se espera que la subasta no haya comenzado", function () {
          it("subasta sin comenzar", async function () {
            await cnt.ercuups721
              .connect(wllt.owner)
              .safeMint(wllt.seller.address, 1);
            await cnt.ercuups721
              .connect(wllt.seller)
              .approve(cnt.auctionv2.address, 3);
            await cnt.auctionv2
              .connect(wllt.seller)
              .createAuctionSingle(cnt.ercuups721.address, [2, 3], 1, 60, true);
            const newOrder = await cnt.auctionv2.currentOrder();

            await expect(
              cnt.auctionv2.connect(wllt.seller).bid(newOrder, 3)
            ).to.be.revertedWith("Auction is not started");
          });
          it("subasta comenzo", async function () {
            await cnt.auctionv2
              .connect(wllt.seller)
              .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);

            const newOrder = await cnt.auctionv2.currentOrder();
            await expect(cnt.auctionv2.connect(wllt.seller).bid(newOrder, 2)).to
              .not.reverted;
          });
        });
        describe("precio de oferta", function () {
          it("compra de oferta", async function () {
            await cnt.auctionv2
              .connect(wllt.seller)
              .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);

            const newOrder = await cnt.auctionv2.currentOrder();

            await expect(cnt.auctionv2.connect(wllt.owner).bid(newOrder, 2)).to
              .not.reverted;
          });

          it("precio menor a la oferta", async function () {
            await cnt.auctionv2
              .connect(wllt.seller)
              .createAuctionSingle(cnt.ercuups721.address, [2], 3, 60, true);

            const newOrder = await cnt.auctionv2.currentOrder();

            await expect(
              cnt.auctionv2.connect(wllt.owner).bid(newOrder, 1)
            ).to.be.revertedWith(
              "Bid must be greater than current price Token"
            );
          });
          it("oferta mayor al precio", async function () {
            await cnt.auctionv2
              .connect(wllt.seller)
              .createAuctionSingle(cnt.ercuups721.address, [2], 3, 60, true);

            const newOrder = await cnt.auctionv2.currentOrder();

            await expect(cnt.auctionv2.connect(wllt.owner).bid(newOrder, 4)).to
              .not.be.reverted;
          });
        });

        describe("finalizar oferta", function () {
          describe("OFERTAS", function () {
            describe("subasta activa", function () {
              it("finalizar subasta con oferta no activa", async function () {
                await expect(
                  cnt.auctionv2.connect(wllt.owner).finishAuction(1)
                ).to.be.revertedWith("Auction is not active");
              });
              it("finalizar subasta", async function () {
                await cnt.auctionv2
                  .connect(wllt.seller)
                  .createAuctionSingle(
                    cnt.ercuups721.address,
                    [2],
                    1,
                    60,
                    true
                  );
                const newOrder = await cnt.auctionv2.currentOrder();
                await time.increase(61 * 60 * 60);

                await expect(
                  cnt.auctionv2.connect(wllt.seller).finishAuction(newOrder)
                ).to.not.reverted;
              });
            });
            describe("se espera que la subasta haya terminado", function () {
              it("subasta finalizada", async function () {
                await cnt.auctionv2
                  .connect(wllt.seller)
                  .createAuctionSingle(
                    cnt.ercuups721.address,
                    [2],
                    1,
                    60,
                    true
                  );

                const newOrder = await cnt.auctionv2.currentOrder();
                //console.log(newOrder);

                await time.increase(60 * 60 * 60);

                await expect(
                  cnt.auctionv2.connect(wllt.seller).finishAuction(newOrder)
                ).to.not.reverted;
              });
              it("subasta finalizada con 2 ofertas", async function () {
                await cnt.auctionv2
                  .connect(wllt.seller)
                  .createAuctionSingle(
                    cnt.ercuups721.address,
                    [2],
                    1,
                    60,
                    true
                  );

                const newOrder = await cnt.auctionv2.currentOrder();
                //console.log(newOrder);

                await cnt.auctionv2.connect(wllt.seller).bid(newOrder, 5);

                await cnt.auctionv2.connect(wllt.buyer).bid(newOrder, 10);
                await time.increase(60 * 60 * 60);
                await expect(
                  cnt.auctionv2.connect(wllt.buyer).finishAuction(newOrder)
                ).to.not.reverted;
              });
              it("subasta no finalizada", async function () {
                await cnt.auctionv2
                  .connect(wllt.seller)
                  .createAuctionSingle(
                    cnt.ercuups721.address,
                    [2],
                    1,
                    60,
                    true
                  );

                const newOrder = await cnt.auctionv2.currentOrder();

                await expect(
                  cnt.auctionv2.connect(wllt.owner).finishAuction(newOrder)
                ).to.be.revertedWith("Auction is not over");

                //acepta la oferta
                //rechaza
                //expira el tiem[po
              });
            });

            it("subasta comenzo", async function () {
              await cnt.auctionv2
                .connect(wllt.seller)
                .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);

              const newOrder = await cnt.auctionv2.currentOrder();
              console.log(newOrder);
              await expect(
                cnt.auctionv2.connect(wllt.owner).finishAuction(newOrder)
              ).to.be.revertedWith("Auction is not over");
            });
          });
        });
      });
      describe("removiendo el bid", function () {
        it("revover offer", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();

          await expect(cnt.auctionv2.connect(wllt.seller).removeOffer(newOrder))
            .to.not.reverted;
        });
        it("remove offer best bid", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, true);

          const newOrder = await cnt.auctionv2.currentOrder();
          await cnt.auctionv2.connect(wllt.seller).bid(newOrder, 5);

          await cnt.auctionv2.connect(wllt.buyer).bid(newOrder, 10);
          await time.increase(60 * 60 * 60);

          await expect(cnt.auctionv2.connect(wllt.seller).removeOffer(newOrder))
            .to.not.reverted;
        });
      });
      describe("auction timelong", function () {
        it("create aution time long", async function () {
          await expect(
            cnt.auctionv2
              .connect(wllt.seller)
              .createAuctionTimeLong(cnt.ercuups721.address, [2], 1, true)
          ).to.not.reverted;
        });
      });
      describe("bid ByToken false", function () {
        it("byToken false", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 1, 60, false);

          const newOrder = await cnt.auctionv2.currentOrder();
          await cnt.auctionv2
            .connect(wllt.seller)
            .bid(newOrder, 2, { value: 2 });

          await expect(
            cnt.auctionv2.connect(wllt.seller).bid(newOrder, 2, { value: 4 })
          ).to.not.reverted;
        });
      });

      describe("removiendo la oferta", function () {
        it("remove Bid", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionTimeLong(cnt.ercuups721.address, [2], 1, true);

          const newOrder = await cnt.auctionv2.currentOrder();
          await cnt.auctionv2.connect(wllt.seller).bid(newOrder, 5);

          await cnt.auctionv2.connect(wllt.buyer).bid(newOrder, 10);

          await expect(cnt.auctionv2.connect(wllt.buyer).removeBid(newOrder)).to
            .not.reverted;
        });
      });
      describe("acepta oferta", function () {
        it("aceptando oferta", async function () {
          await cnt.auctionv2
            .connect(wllt.seller)
            .createAuctionSingle(cnt.ercuups721.address, [2], 1, 61, true);

          const newOrder = await cnt.auctionv2.currentOrder();
          await cnt.auctionv2.connect(wllt.seller).bid(newOrder, 5);

          await cnt.auctionv2.connect(wllt.buyer).bid(newOrder, 10);
          await time.increase(60 * 60 * 60);
          await expect(cnt.auctionv2.connect(wllt.seller).acepOffert(newOrder))
            .to.not.reverted;
        });
      });
    });
  });
});
