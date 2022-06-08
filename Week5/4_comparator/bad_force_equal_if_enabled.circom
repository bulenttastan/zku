pragma circom 2.0.3;

template BadForceEqualIfEnabled() {
    signal input enabled;
    signal input in[2];

    // Circom doesn't support this constraint anymore, because of the same issue
    if (enabled) {
    //  ^^^^^^^ There are constraints depending on the value of the condition and
    // it can be unknown during the constraint generation phase
        in[1] === in[0];
    }
}

component main = BadForceEqualIfEnabled();
