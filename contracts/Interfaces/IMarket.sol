// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

interface IMarket {
    struct TokenPrice {
        string symbol;
        uint256 price;
    }

    struct OrderShow {
        address owner;
        address NFTAddress;
        string _hash;
        uint256 quantity;
        uint256 tokenID;
        uint256 ethPrice;
        TokenPrice[] tokenPrices;
    }

    struct Order {
        address owner;
        uint256 quantity;
        address NFTAddress;
        uint256[] tokenID;
        uint256 currentIndex;
        uint256 ethPrice;
        uint256 tokenPrices;
        uint256 orderId;
    }

    struct Auction {
        address NFTAddress;
        uint256 tokenId;
        uint256 startTime;
        uint256 endTime;
        uint256 initPrice;
        uint256 currentPrice;
        bool byToken;
        address bestBidder;
        address seller;
        uint256 orderId;
        bool _isInfinity;
        bool finish;
    }

    event Ask(
        address seller,
        uint256 order,
        address NFTAddress,
        uint256 ethPrice,
        TokenPrice[] indexed tokenPrices,
        uint256 fee
    );
    event Trade(
        address indexed seller,
        address indexed buyer,
        uint256 tokenId,
        bool byToken,
        string symbol,
        uint256 quantity,
        uint256 price,
        uint256 fee
    );
    event CancelSellToken(address indexed seller, uint256 indexed order);
    event FeeAddressTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    event SetMakerFeePercent(
        address indexed setBy,
        uint256 oldFeePercent,
        uint256 newFeePercent
    );

    event SetTakerFeeFeePercent(
        address indexed setBy,
        uint256 oldFeePercent,
        uint256 newFeePercent
    );

    event setPrices(
        address indexed seller,
        uint256 indexed order,
        uint256 ethPrice,
        TokenPrice[] indexed tokenPrices
    );
}
