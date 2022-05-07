pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/comparators.circom";

template SystemOfEquations(n) { // n is the number of variables in the system of equations
    signal input x[n]; // this is the solution to the system of equations
    signal input A[n][n]; // this is the coefficient matrix
    signal input b[n]; // this are the constants in the system of equations
    signal output out; // 1 for correct solution, 0 for incorrect solution

    // [bonus] insert your code here
    var correct = 1;
    for (var i = 0; i < n; i++) {
        var total = 0;

        for (var j = 0; j < n; j++) {
            total += A[i][j] * x[j];
        }

        if (b[i] != total) correct = 0;
    }

    out <-- correct;
}

component main {public [A, b]} = SystemOfEquations(3);
