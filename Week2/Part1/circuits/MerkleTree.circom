pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

template CheckRoot(n) { // compute the root of a MerkleTree of n Levels
    signal input leaves[2**n];
    signal output root;

    //[assignment] insert your code here to calculate the Merkle root from 2^n leaves
    // Keep the hashes side-by-side as an array of size 2 * 2^n - 1
    // [1,2,3,4,5,6,7,8] + [12,34,56,78] + [1234,5678] + [12345678] -> 15 hashed elements for n=3
    var last = 2 * 2**n - 1;
    var hashes[last];
    component p[2**n];

    // Initialize the hashes with input leaves
    for (var i = 0; i < 2**n; i++) hashes[i] = leaves[i];

    // Upper level parent hashes
    for (var i = 0; i < 2**n-1; i++) {
        p[i] = Poseidon(2);
        p[i].inputs[0] <-- hashes[2*i];
        p[i].inputs[1] <-- hashes[2*i+1];
        hashes[2**n + i] = p[i].out;
    }

    root <== hashes[2 * 2**n - 2];
}

template MerkleTreeInclusionProof(n) {
    signal input leaf;
    signal input path_elements[n];
    signal input path_index[n]; // path index are 0's and 1's indicating whether the current element is on the left or right
    signal output root; // note that this is an OUTPUT signal

    //[assignment] insert your code here to compute the root from a leaf and elements along the path
    /* ie: { "leaf": h(1), "path_elements": [h(2), h(9), h(13)], "path_index": ["0", "0", "0"] }
                       root
                     /0     \1
                h(12)        node13
                 /0  \1       /   \
               h(8)  node9  h(10)  h(11)
               /0  \1
       leaf: h(1)  h(2)   . . . . . .
    */
    component p[n];
    var curHash = leaf;

    // Calculate hash of rest of the parents all the way up
    for (var i = 0; i < n; i++) {
        p[i] = Poseidon(2);
        p[i].inputs[0] <-- path_index[i] ? path_elements[i] : curHash; // path_index == 1 or 0
        p[i].inputs[1] <-- path_index[i] ? curHash : path_elements[i];
        curHash = p[i].out;
    }

    root <== curHash;
}
