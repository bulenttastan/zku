// [bonus] implement an example game from part d
pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";

// Rock, Paper, Scissors game. Hands are represented as 0, 1, 2 respectfully
// Winning precedence: Scissors > Paper > Rock > Scissors
template RockPaperScissors() {
  // Public input
  signal input myHand;
  signal input win; // 1: win, 0: tie, -1: lose
  signal input opponentHash;
  // Private inputs
  signal input opponentHand;
  signal input salt;
  // Output as a hash value
  signal output hashOut;

  // Check that the hands are less than 3
  component myLessThan = LessThan(2);
  myLessThan.in[0] <== myHand;
  myLessThan.in[1] <== 3;
  myLessThan.out === 1;
  component opponentLessThan = LessThan(2);
  opponentLessThan.in[0] <== opponentHand;
  opponentLessThan.in[1] <== 3;
  opponentLessThan.out === 1;

  /*
   * This is a little hacky, but it makes sense.
   * Let's look at all the possible hands for the player and the opponent.
   * Inputs for the hands have these values: Rock=0, Paper=1 or Scissors=2
   * Possible winning points are 1 for win, -1 for lose, 0 for tie.
   * Winning table for player vs opponent hands on row and column respectfully.
   * Player x Opp = Rock  Paper  Scissors
   *      Rock        0    -1       1
   *      Paper       1     0      -1
   *      Scissors   -1     1       0
   * We can get the win value if we subtract hands as: win === myHand - opponentHand
   * However, when the difference is 2 we need to change it to -1 and change -2 to 1.
   * This is as if we're doing the subtraction in 2 bits and ignoring the number overflow.
   */
  component greaterThanOne = GreaterThan(2);
  greaterThanOne.in[0] <== myHand - opponentHand;
  greaterThanOne.in[1] <== 1;
  component lessThanMinusOne = LessThan(2);
  lessThanMinusOne.in[0] <== myHand - opponentHand;
  lessThanMinusOne.in[1] <== -1;
  // Check the expected winning point
  win === (myHand - opponentHand) + (greaterThanOne.out * -3) + (lessThanMinusOne.out * 3);

  // Verify that the hash of the opponent's hand matches opponentHash
  component poseidon = Poseidon(2);
  poseidon.inputs[0] <== salt;
  poseidon.inputs[1] <== opponentHand;

  hashOut <== poseidon.out;
  opponentHash === hashOut;
}

component main {public [myHand, opponentHash]} = RockPaperScissors();
