pragma circom 2.0.0;

include "./iden3/lib/query/query.circom";
include "./iden3/lib/utils/claimUtils.circom";

template CheckQuery(valueArraySize) {
    signal input issuerClaim[8];
    /** Query */
    signal input claimSchema;
    signal input slotIndex;
    signal input operator;
    signal input value[valueArraySize];

    // Verify issuer claim schema
    component claimSchemaCheck = verifyCredentialSchema();
    for (var i = 0; i < 8; i++) {
        claimSchemaCheck.claim[i] <== issuerClaim[i];
    }
    claimSchemaCheck.schema <== claimSchema;

    // Query
    component getClaimValue = getValueByIndex();
    for (var i = 0; i < 8; i++) {
        getClaimValue.claim[i] <== issuerClaim[i];
    }

    getClaimValue.index <== slotIndex;

    component q = Query(valueArraySize);
    q.in <== getClaimValue.value;
    q.operator <== operator;
    for(var i = 0; i < valueArraySize; i++){
        q.value[i] <== value[i];
    }

    q.out === 1;
}
