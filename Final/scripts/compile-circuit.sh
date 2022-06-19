#!/bin/bash

cd circuits

if [ -f ./powersOfTau28_hez_final_15.ptau ]; then
    echo "powersOfTau28_hez_final_15.ptau already exists. Skipping."
else
    echo 'Downloading powersOfTau28_hez_final_15.ptau'
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau
fi

# Compile circuit
echo "Compiling circuit.circom..."
circom circuit.circom --r1cs --wasm --sym -o .
snarkjs r1cs info circuit.r1cs

# Start a new zkey and make a contribution
snarkjs groth16 setup circuit.r1cs powersOfTau28_hez_final_15.ptau circuit_0000.zkey
random=$(head -c 1024 /dev/urandom | LC_CTYPE=C tr -dc 'a-zA-Z0-9' | head -c 128)
snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey --name="1st Contributor Name" -v -e="$random"
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

# Generate solidity contract
snarkjs zkey export solidityverifier circuit_final.zkey ../contracts/verifier.sol

cd ..
