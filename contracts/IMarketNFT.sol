// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMarketNFT {

    function buyToken(uint256 _order, uint256 _quantity)  payable external;

    function setCurrentPrice(uint256 _order, uint256 _price) external;

    function readyToSellToken(uint256[] memory _tokenIds, uint256 _price) external;

    function cancelSellToken(uint256 _order) external;

}
