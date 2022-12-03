// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
interface IERC721UUPS is IERC721 {
    function fee() external view returns (uint);
    function owner() external view returns (address);

}
