// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Ballot {

    uint startTime;

    constructor(bytes32[] memory proposalNames) {
        // ... existing code sets the chairperson and proposals

        // Start voting time when the ballot is created
        startTime = block.timestamp;
    }

    function vote(uint proposal) public voteHasntEnded() {
        // ... existing code check voting rights and registers the vote
    }

    modifier voteHasntEnded() {
      require(block.timestamp < startTime + 5 minutes, "Voting period ended");
        _;
    }
}
