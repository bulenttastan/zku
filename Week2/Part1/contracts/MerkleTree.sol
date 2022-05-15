//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import 'hardhat/console.sol';
import { PoseidonT3 } from "./Poseidon.sol"; //an existing library to perform Poseidon hash on solidity
import "./verifier.sol"; //inherits with the MerkleTreeInclusionProof verifier contract

contract MerkleTree is Verifier {
    uint256[] public hashes; // the Merkle tree in flattened array form
    uint256 public index = 0; // the current index of the first unfilled leaf
    uint256 public root; // the current Merkle root
    uint16 private n;
    uint16 private size;

    constructor() {
        // [assignment] initialize a Merkle tree of 8 with blank leaves
        n = 3; // Number of levels in the tree
        size = 8; // Number of leaves

        hashes = new uint256[](2 * size - 1);
        for (uint i = 0; i < size; i++) {
            hashes[i] = 0;
        }

        computeMerkleTree();
    }

     /*                 14
                    12      13
                  8   9    10   11
                / |   /\   | \   | \
               0  1  2  3  4  5  6  7
        ie. index:  2 -> 3: h(2,3)
                    8 + index/2:  9 -> 8:  h(8,9)
                    12 + index/4:  12 -> 13:  h(12,13) */
    function insertLeaf(uint256 hashedLeaf) public returns (uint256) {
        // [assignment] insert a hashed leaf into the Merkle tree
        hashes[index] = hashedLeaf;

        // We could just re-compute the entire Merkle tree, but that is not optimal
        // Instead we go higher in the tree and set the hashes as we go
        uint start = 0;
        uint offset = index;

        for (uint i = 1; i < size; i *= 2) {
            uint cur = start + offset;
            start += size / i;
            offset /= 2;

            hashes[start + offset] = cur % 2 == 0
                ? PoseidonT3.poseidon([hashes[cur], hashes[cur + 1]])
                : PoseidonT3.poseidon([hashes[cur - 1], hashes[cur]]);
        }

        ++index;
        root = hashes[hashes.length - 1];
        return root;
    }

    function verify(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[1] memory input
        ) public view returns (bool) {

        // [assignment] verify an inclusion proof and check that the proof root matches current root
        a; b; c; // Just to avoid unused variable warnings

        return root == input[0];
    }

    function computeMerkleTree() private {
        for (uint i = 0; i < size - 1; i++) {
            hashes[size + i] = PoseidonT3.poseidon([hashes[2*i], hashes[2*i+1]]);
        }

        root = hashes[hashes.length - 1];
    }
}
