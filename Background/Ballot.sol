// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Ballot {

    uint startTime;

    constructor(bytes32[] memory proposalNames) {
        // ... existing code sets the chairperson and proposals

        // Start voting time when the ballot is created
        startTime = block.timestamp;
    }

    /**
     * @dev Give your vote (including votes delegated to you) to proposal 'proposals[proposal].name'.
     * @param proposal index of proposal in the proposals array
     */
    function vote(uint proposal) public {
        require(!voteEnded(), "Voting period ended");

        // ... existing code check voting rights and registers the vote
    }

    function voteEnded() public view returns (bool) {
      return startTime + 5 minutes < block.timestamp;
    }
}
