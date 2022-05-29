pragma circom 2.0.3;
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/eddsaposeidon.circom";

template VerifyEdDSAPoseidon(k) {
    signal input from_x;
    signal input from_y;
    signal input R8x;
    signal input R8y;
    signal input S;
    signal input leaf[k];
    
    // [assignment] Hash leaf using poseidon hasher
    component hasher;
    
    // [assignment] Add inputs to verifier
    component verifier = EdDSAPoseidonVerifier();   

}

component main{public[from_x, from_y, R8x, R8y, S]} = VerifyEdDSAPoseidon(3);
