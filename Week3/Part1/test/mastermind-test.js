//[assignment] write your own unit test to show that your Mastermind variation circuit is working as expected
const { expect, AssertionError } = require('chai');
const { ethers } = require('hardhat');
const { wasm } = require('circom_tester');
const { buildPoseidon } = require('circomlibjs');
const { F1Field, Scalar } = require('ffjavascript');

exports.p = Scalar.fromString('21888242871839275222246405745257275088548364400416034343698204186575808495617');
const Fr = new F1Field(exports.p);

describe('Mastermind Variation', function () {
  let circuit;
  let poseidon;

  before(async () => {
    circuit = await wasm('contracts/circuits/MastermindVariation.circom');
    await circuit.loadConstraints();
    poseidon = await buildPoseidon();
  });

  /* Generate an input parameter for the witness.
   * a ... e: are the color guesses from 0 to 7, no repetition
   * sa ... se: are the solutions
   * hit: number of color hits with right positions
   * blow: number of same colors with wrong positions
   * salt: (optional) secret salt used as trapdoor against brute-force attacks */
  const generateInput = (a, b, c, d, e, sa, sb, sc, sd, se, hit, blow, salt = 123) => {
    const pubSolnHash = poseidon.F.toObject(poseidon([salt, sa, sb, sc, sd, se]));

    return {
      pubGuessA: a,
      pubGuessB: b,
      pubGuessC: c,
      pubGuessD: d,
      pubGuessE: e,
      pubNumHit: hit,
      pubNumBlow: blow,
      pubSolnHash: pubSolnHash,
      privSolnA: sa,
      privSolnB: sb,
      privSolnC: sc,
      privSolnD: sd,
      privSolnE: se,
      privSalt: salt,
    };
  };

  it('Should return true for correct game board proof', async () => {
    // Provide 5 guess input with solutions and correct hits/blows
    const input = generateInput(0, 1, 2, 3, 4, 0, 1, 3, 4, 5, 2, 2);

    // Use the compiled circuit wasm file and get the outputs
    const witness = await circuit.calculateWitness(input, true);
    const isProved = Fr.e(witness[0]);
    const solnHashOut = Fr.e(witness[1]);

    // Check that the process is completed
    expect(isProved).to.equal(Fr.e(1));
    // Check that the output hash value is correct
    expect(solnHashOut).to.equal(input.pubSolnHash);
  });

  it('Should return true for all hits', async () => {
    // Provide 5 guess input with solutions and correct hits/blows
    const input = generateInput(0, 1, 2, 3, 4, 0, 1, 2, 3, 4, 5, 0);

    // Use the compiled circuit wasm file and get the outputs
    const witness = await circuit.calculateWitness(input, true);
    const isProved = Fr.e(witness[0]);
    const solnHashOut = Fr.e(witness[1]);

    // Check that the process is completed
    expect(isProved).to.equal(Fr.e(1));
    // Check that the output hash value is correct
    expect(solnHashOut).to.equal(input.pubSolnHash);
  });

  it('Should return true for all blows', async () => {
    // Provide 5 guess input with solutions and correct hits/blows
    const input = generateInput(0, 1, 2, 3, 4, 1, 2, 3, 4, 0, 0, 5);

    // Use the compiled circuit wasm file and get the outputs
    const witness = await circuit.calculateWitness(input, true);
    const isProved = Fr.e(witness[0]);
    const solnHashOut = Fr.e(witness[1]);

    expect(isProved).to.equal(Fr.e(1));
    expect(solnHashOut).to.equal(input.pubSolnHash);
  });

  it('Should fail for repeated guess colors', async () => {
    // First two guess colors are repeated
    const input = generateInput(0, 0, 2, 3, 4, 0, 1, 2, 3, 4, 5, 0);
    try {
      await circuit.calculateWitness(input, true);
    } catch (err) {
      return expect(err).to.be.an('error');
    }
    expect.fail('Repeated colors should fail');
  });

  it('Should fail for repeated solution colors', async () => {
    // First two solutions colors are repeated
    const input = generateInput(0, 1, 2, 3, 4, 0, 0, 2, 3, 4, 5, 0);
    try {
      await circuit.calculateWitness(input, true);
    } catch (err) {
      return expect(err).to.be.an('error');
    }
    expect.fail('Repeated colors should fail');
  });

  it('Should fail for wrong hit count', async () => {
    // All the colors match. So the hit number should be 5, but we provide 0
    const input = generateInput(0, 1, 2, 3, 4, 0, 1, 2, 3, 4, 0, 0);
    try {
      await circuit.calculateWitness(input, true);
    } catch (err) {
      return expect(err).to.be.an('error');
    }
    expect.fail('Wrong hit count should fail');
  });

  it('Should fail for wrong blow count', async () => {
    // All the colors match in wrong places. So the blow number should be 5, but we provide 0
    const input = generateInput(0, 1, 2, 3, 4, 1, 2, 3, 4, 0, 0, 0);
    try {
      await circuit.calculateWitness(input, true);
    } catch (err) {
      return expect(err).to.be.an('error');
    }
    expect.fail('Wrong blow count should fail');
  });

  it('Should fail for wrong solution hash value', async () => {
    // All inputs are correct, but we provide a wrong solution hash
    const input = generateInput(0, 1, 2, 3, 4, 0, 1, 2, 3, 4, 5, 0);
    input.pubSolnHash = 0;
    try {
      await circuit.calculateWitness(input, true);
    } catch (err) {
      return expect(err).to.be.an('error');
    }
    expect.fail('Wrong hash value should fail');
  });
});
