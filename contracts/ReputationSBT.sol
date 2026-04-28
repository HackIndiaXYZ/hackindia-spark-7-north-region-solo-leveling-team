// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC5192 {
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);
    function locked(uint256 tokenId) external view returns (bool);
}

contract ReputationSBT is ERC721, Ownable, IERC5192 {
    uint256 private _nextTokenId;

    // Badge Types
    enum BadgeType { NONE, GOOD_BORROWER, DEFAULTER }
    mapping(uint256 => BadgeType) public tokenBadges;
    mapping(address => uint256[]) private _userTokens;

    constructor() ERC721("MicroLendReputation", "MLREP") Ownable(msg.sender) {}

    function mint(address to, BadgeType badge) external onlyOwner {
        require(badge != BadgeType.NONE, "Invalid badge");
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        tokenBadges[tokenId] = badge;
        _userTokens[to].push(tokenId);
        emit Locked(tokenId);
    }

    function locked(uint256 /*tokenId*/) external pure override returns (bool) {
        return true;
    }

    function getUserBadges(address user) external view returns (BadgeType[] memory) {
        uint256[] memory tokens = _userTokens[user];
        BadgeType[] memory badges = new BadgeType[](tokens.length);
        for(uint i = 0; i < tokens.length; i++) {
            badges[i] = tokenBadges[tokens[i]];
        }
        return badges;
    }

    // Override _update to prevent transfers
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0) || to == address(0), "SBT: transfers are blocked");
        return super._update(to, tokenId, auth);
    }
}
