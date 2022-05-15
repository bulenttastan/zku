const { poseidonContract } = require("circomlibjs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { groth16 } = require("snarkjs");
const { wasm } = require("circom_tester");
const { F1Field, Scalar } = require("ffjavascript");

exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

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

describe("CheckRoot", function () {
  it("Should return Merkle tree root", async () => {
      const circuit = await wasm("circuits/checkroot.circom");
      await circuit.loadConstraints();

      // Provide 2^3 Merkle tree leaves as input
      const input = { "leaves": [
        "18586133768512220936620570745912940619677854269274689475585506675881198879027",
        "8645981980787649023086883978738420856660271013038108762834452721572614684349",
        "6018413527099068561047958932369318610297162528491556075919075208700178480084",
        "9900412353875306532763997210486973311966982345069434572804920993370933366268",
        "19065150524771031435284970883882288895168425523179566388456001105768498065277",
        "4204312525841135841975512941763794313765175850880841168060295322266705003157",
        "7061949393491957813657776856458368574501817871421526214197139795307327923534",
        "8761383103374198182292249284037598775384145428470309206166618811601037048804"
      ]};

      // Use the compiled circuit wasm file
      const witness = await circuit.calculateWitness(input, true);

      // Check that the process is completed
      expect(Fr.e(witness[0])).to.equal(Fr.e(1));
      // Check that the output returns the correct root hash
      expect(Fr.e(witness[1])).to.equal(Scalar.fromString("12926426738483865258950692701584522114385179899773452321739143007058691921961"));
  });
});

describe("MerkleTreeInclusionProof", function () {
  it("Should return root based on Merkle path", async () => {
      const circuit = await wasm("circuits/circuit.circom");
      await circuit.loadConstraints();
      const leaf = Scalar.fromString("18586133768512220936620570745912940619677854269274689475585506675881198879027");
      const node2 = Scalar.fromString("8645981980787649023086883978738420856660271013038108762834452721572614684349");
      const node9 = Scalar.fromString("15866811995824089293749468808478915337040145970836273016636380754543464442080");
      const node13 = Scalar.fromString("20874040434805832425693224819391964080617858315066708871530395886715480031506");

      // Provide the leaf, elements on the path to the root and direction indices
      const input = { leaf, "path_elements": [node2, node9, node13], "path_index": ["0", "0", "0"] };

      // Use the compiled circuit wasm file
      const witness = await circuit.calculateWitness(input, true);

      // Check that the process is completed
      expect(Fr.e(witness[0])).to.equal(Fr.e(1));
      // Check that the output returns the correct root hash
      expect(Fr.e(witness[1])).to.equal(Scalar.fromString("12926426738483865258950692701584522114385179899773452321739143007058691921961"));
  });
});
