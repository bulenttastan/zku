// [bonus] unit test for bonus.circom
const { expect, AssertionError } = require('chai');
const { ethers } = require('hardhat');
const { wasm } = require('circom_tester');
const { buildPoseidon } = require('circomlibjs');
const { F1Field, Scalar } = require('ffjavascript');

exports.p = Scalar.fromString('21888242871839275222246405745257275088548364400416034343698204186575808495617');
const Fr = new F1Field(exports.p);

describe('Rock Paper Scissors', function () {
  let circuit;
  let poseidon;

  before(async () => {
    circuit = await wasm('contracts/circuits/bonus.circom');
    await circuit.loadConstraints();
    poseidon = await buildPoseidon();
  });

  /* Generate an input parameter for the witness.
   * myHand: my hand of rock, paper or scissors from 0 to 2
   * opponentHand: opponent's hand
   * win: 1 win, 0 tie, -1 lose
   * salt: (optional) secret salt used as trapdoor against brute-force attacks */
  const generateInput = (myHand, opponentHand, win, salt = 123) => {
    const opponentHash = poseidon.F.toObject(poseidon([salt, opponentHand]));

    return {
      myHand,
      win: Fr.e(win),
      opponentHash,
      opponentHand,
      salt,
    };
  };

  it('Should return true for correct proof to all hand combinations', async () => {
    // Provide all possible input hand combinations
    const combinations = [
      [0, 0, 0], // Rock, Rock, Tie
      [0, 1, -1], // Rock, Paper, Lose
      [0, 2, 1], // Rock, Scissors, Win
      [1, 0, 1], // Paper, Rock, Win
      [1, 1, 0], // Paper, Paper, Tie
      [1, 2, -1], // Paper, Scissors, Lose
      [2, 0, -1], // Scissors, Rock, Lose
      [2, 1, 1], // Scissors, Paper, Win
      [2, 2, 0], // Scissors, Scissors, Tie
    ];

    for (combination of combinations) {
      const input = generateInput(...combination);
      // Use the compiled circuit wasm file and get the outputs
      const witness = await circuit.calculateWitness(input, true);
      const isProved = Fr.e(witness[0]);
      const hashOut = Fr.e(witness[1]);

      // Check that the process is completed
      expect(isProved).to.equal(Fr.e(1));
      // Check that the output hash value is correct
      expect(hashOut).to.equal(input.opponentHash);
    }
  });

  it('Should fail for wrong player input value', async () => {
    // Negative value for player hand
    let input = generateInput(-1, 0, 0);
    try {
      await circuit.calculateWitness(input, true);
    } catch (err) {
      return expect(err).to.be.an('error');
    }
    // Over 2 value for player hand
    input = generateInput(3, 0, 0);
    try {
      await circuit.calculateWitness(input, true);
    } catch (err) {
      return expect(err).to.be.an('error');
    }
    expect.fail('Wrong player hand should fail');
  });

  it('Should fail for wrong opponent input value', async () => {
    // Negative value for opponent hand
    let input = generateInput(0, -1, 0);
    try {
      await circuit.calculateWitness(input, true);
    } catch (err) {
      return expect(err).to.be.an('error');
    }
    // Over 2 value for opponent hand
    input = generateInput(0, 3, 0);
    try {
      await circuit.calculateWitness(input, true);
    } catch (err) {
      return expect(err).to.be.an('error');
    }
    expect.fail('Wrong opponent hand should fail');
  });

  it('Should fail for wrong winning number', async () => {
    const input = generateInput(0, 1, 1);
    try {
      await circuit.calculateWitness(input, true);
    } catch (err) {
      return expect(err).to.be.an('error');
    }
    expect.fail('Wrong player hand should fail');
  });
});
