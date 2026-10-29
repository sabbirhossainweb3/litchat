// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal public on-chain wallet-to-wallet message board for LitVM LiteForge.
/// @dev Message content is PUBLIC forever. Do not send passwords, private keys, or sensitive data.
contract LitChat {
    struct Message {
        address sender;
        address receiver;
        uint64 timestamp;
        string content;
    }

    uint256 public messageCount;
    mapping(uint256 => Message) private messages;
    mapping(address => uint256[]) private inboxIds;
    mapping(address => uint256[]) private sentIds;

    event MessageSent(
        uint256 indexed messageId,
        address indexed sender,
        address indexed receiver,
        uint64 timestamp,
        string content
    );

    error InvalidReceiver();
    error EmptyMessage();
    error MessageTooLong();

    function sendMessage(address receiver, string calldata content) external returns (uint256 id) {
        if (receiver == address(0)) revert InvalidReceiver();
        if (bytes(content).length == 0) revert EmptyMessage();
        if (bytes(content).length > 500) revert MessageTooLong();

        id = ++messageCount;
        uint64 sentAt = uint64(block.timestamp);
        messages[id] = Message({sender: msg.sender, receiver: receiver, timestamp: sentAt, content: content});
        inboxIds[receiver].push(id);
        sentIds[msg.sender].push(id);
        emit MessageSent(id, msg.sender, receiver, sentAt, content);
    }

    function getMessage(uint256 id) external view returns (Message memory) {
        require(id > 0 && id <= messageCount, "Message does not exist");
        return messages[id];
    }

    function getInbox(address user) external view returns (uint256[] memory) {
        return inboxIds[user];
    }

    function getSent(address user) external view returns (uint256[] memory) {
        return sentIds[user];
    }
}
