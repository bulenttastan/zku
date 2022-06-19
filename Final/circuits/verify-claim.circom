pragma circom 2.0.0;

include "check-query.circom";
include "./iden3/lib/utils/claimUtils.circom";

template VerifyClaim(valueArraySize) {
    signal input claim[8];

    /** Signature */
    signal input sigR8x;
    signal input sigR8y;
    signal input sigS;
    signal input pubKeyX;
    signal input pubKeyY;

    /** Query */
    signal input claimSchema;
    signal input slotIndex;
    signal input operator;
    signal input value[valueArraySize];

    // Verify signature
    component signature = verifyClaimSignature();

    for (var i = 0; i < 8; i++) {
        signature.claim[i] <== claim[i];
    }
    signature.sigR8x <== sigR8x;
    signature.sigR8y <== sigR8y;
    signature.sigS <== sigS;
    signature.pubKeyX <== pubKeyX;
    signature.pubKeyY <== pubKeyY;

    // Verify query
    component query = CheckQuery(valueArraySize);
    for (var i = 0; i < 8; i++) {
        query.issuerClaim[i] <== claim[i];
    }
    query.claimSchema <== claimSchema;
    query.slotIndex <== slotIndex;
    query.operator <== operator;
    for(var i = 0; i < valueArraySize; i++) {
        query.value[i] <== value[i];
    }
}
