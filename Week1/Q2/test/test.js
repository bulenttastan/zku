const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const { groth16, plonk } = require("snarkjs");

function unstringifyBigInts(o) {
    if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
        return BigInt(o);
    } else if ((typeof(o) == "string") && (/^0x[0-9a-fA-F]+$/.test(o) ))  {
        return BigInt(o);
    } else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts);
    } else if (typeof o == "object") {
        if (o===null) return null;
        const res = {};
        const keys = Object.keys(o);
        keys.forEach( (k) => {
            res[k] = unstringifyBigInts(o[k]);
        });
        return res;
    } else {
        return o;
    }
}

describe("HelloWorld", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("HelloWorldVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing
        // Generate proof parameters for the input 1 * 2 => 2
        const { proof, publicSignals } = await groth16.fullProve({"a":"1","b":"2"}, "contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm","contracts/circuits/HelloWorld/circuit_final.zkey");

        // Public signals are the Circom circuit input parameters
        console.log('1x2 =',publicSignals[0]);

        // Convert parameter array elements from string to BigInt
        const editedPublicSignals = unstringifyBigInts(publicSignals);
        const editedProof = unstringifyBigInts(proof);
        // Generate copy-pasteable input parameters to call the verify method in the Solidity contract
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);

        // Flatten the array. 2nd calldata element is a nested array, we flatten it to generate single array
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());

        // Re-construct the a, b, c parameters for the verification
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        // Last element is the public output. It is "2" for the current input
        const Input = argv.slice(8);

        // Verify the ZK proof with hashed params (a, b, c) and public output 2 (Input)
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        // Any missing or incorrectly hashed parameters would result in an invalid proof
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with Groth16", function () {
    let verifier;

    beforeEach(async function () {
        //[assignment] insert your script here
        const Verifier = await ethers.getContractFactory('Multiplier3Verifier');
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        const { proof, publicSignals } = await groth16.fullProve({'a': '1', 'b': '2', 'c': '3'}, 'contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm', 'contracts/circuits/Multiplier3/circuit_final.zkey');
        console.log('(1+2)*(2+3) =', publicSignals[0]);

        const editedProof = unstringifyBigInts(proof);
        const editedPublicSignals = unstringifyBigInts(publicSignals);

        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);
        const argv = calldata.replace(/["[\]\s]/g, '').split(',').map(x => BigInt(x).toString());

        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);

        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        expect(await verifier.verifyProof([0, 0], [[0, 0], [0, 0]], [0, 0], [0])).to.be.false;
    });
});


describe("Multiplier3 with PLONK", function () {
    let verifier;

    beforeEach(async function () {
        //[assignment] insert your script here
        const Verifier = await ethers.getContractFactory('Multiplier3Verifier_plonk');
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        const { proof, publicSignals } = await plonk.fullProve({'a': '1', 'b': '2', 'c': '3'}, 'contracts/circuits/Multiplier3_plonk/Multiplier3_js/Multiplier3.wasm', 'contracts/circuits/Multiplier3_plonk/circuit_final.zkey');
        console.log('(1+2)*(2+3) =', publicSignals[0]);

        const editedProof = unstringifyBigInts(proof);
        const editedPublicSignals = unstringifyBigInts(publicSignals);

        const calldata = await plonk.exportSolidityCallData(editedProof, editedPublicSignals);
        const argv = calldata.replace(/[["\]]/g, '').split(',');

        const proofInput = argv[0];
        const publicSignalsInput = [argv[1]];

        expect(await verifier.verifyProof(proofInput, publicSignalsInput)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        expect(await verifier.verifyProof(0, [0])).to.be.false;
    });
});
