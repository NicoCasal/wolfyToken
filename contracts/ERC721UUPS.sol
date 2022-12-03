// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

contract ERC721UUPS is
  Initializable,
  ERC721Upgradeable,
  ERC721URIStorageUpgradeable,
  OwnableUpgradeable,
  ERC721EnumerableUpgradeable,
  UUPSUpgradeable
{
  using CountersUpgradeable for CountersUpgradeable.Counter;

  CountersUpgradeable.Counter private _tokenIdCounter;  
  uint public fee;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() initializer {}

  function initialize(
    string calldata name_,
    string calldata symbol_,    
    string memory uri,
    uint256 amount,
    uint256 fee_,
    address owner_    
  ) public initializer {
    __ERC721_init(name_, symbol_);
    __ERC721URIStorage_init();
    __ERC721Enumerable_init();
    __Ownable_init();
    __UUPSUpgradeable_init();
    safeMint(owner_, amount, uri);
    setFee(fee_);
    transferOwnership(owner_);    
  }

  function setFee(uint fee_) public onlyOwner {
    if(fee_>1000)
    fee=1000;
    else
    fee=fee_;        
  }
  function safeMint(
    address to,
    uint256 amount,
    string memory uri
  ) internal {
    for (uint256 i = 0; i < amount; i++) {
      safeMint(to, uri);
    }
  }

  function safeMintBatch(address to, string[] memory uri) public onlyOwner {
    for (uint256 i = 0; i < uri.length; i++) {
      safeMint(to, uri[i]);
    }
  }

  function safeMint(address to, string memory uri) public onlyOwner {
    _tokenIdCounter.increment();
    uint256 tokenId = _tokenIdCounter.current();    
    _safeMint(to, tokenId);
    _setTokenURI(tokenId, uri);
  }

  function _authorizeUpgrade(address newImplementation)
    internal
    override
    onlyOwner
  {}

function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
  // The following functions are overrides required by Solidity.

  function _burn(uint256 tokenId)
    internal
    override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
  {
    super._burn(tokenId);
  }

  function tokenURI(uint256 tokenId)
    public
    view
    override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
    returns (string memory)
  {
    return super.tokenURI(tokenId);
  }

   function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }
  function totalSupply() public override view returns(uint){
    return _tokenIdCounter.current();
  }
  
  function tokensByOwner(address owner) external view returns (uint256[] memory) {
        uint256 length = balanceOf(owner);
        uint256[] memory tokens = new uint256[](length);
        for (uint256 i; i < length; i++) {
            tokens[i] = tokenOfOwnerByIndex(owner, i);
        }
        return tokens;
    }
}
