import React, { useEffect, useState } from 'react';
import { BigNumber, Contract, ethers } from 'ethers';
import { Tree, TreeNode } from 'react-organizational-chart';
import MerkleTreeContractSource from './assets/MerkleTree.json';
const circuitWasm = require('./assets/circuit.wasm');
const circuitZkey = require('./assets/circuit_final.zkey');
const { groth16 } = require('snarkjs');

// MerkleTree contract is deployed to: 0x9d3C2A97294d99ba166975a609781b4740e83D92
const merkleTreeAddress = '0x9d3C2A97294d99ba166975a609781b4740e83D92';
let merkleTreeContract: Contract;

function App() {
  const [currentAccount, setCurrentAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [displayVerify, setDisplayVerify] = useState(false);
  const [hashes, setHashes] = useState<string[]>([]);
  const [leaf, setLeaf] = useState(1);
  const [result, setResult] = useState(false);

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        return console.log('Make sure you have metamask!');
      }
      console.log('We have the ethereum object', ethereum);

      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log('Found an authorized account:', account);
        setCurrentAccount(account);

        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        merkleTreeContract = new ethers.Contract(merkleTreeAddress, MerkleTreeContractSource.abi, signer);

        // Call initializing methods after wallet is signed in
        await getHashes();
      } else {
        console.log('No authorized account found');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) return alert('Get MetaMask!');

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Connected', accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const getHashes = async () => {
    try {
      const hashes = [];
      for (let i = 0; i < 15; i++) {
        hashes.push((await merkleTreeContract.hashes(i)).toString());
      }
      setHashes(hashes);
      console.log('Retrieved the hashes...');

      console.log('HASHES:', hashes);
      console.log('ROOT:', (await merkleTreeContract.root()).toString());
      console.log('INDEX:', (await merkleTreeContract.index()).toString());
    } catch (error) {
      console.log(error);
    }
  };

  const insertLeaf = async () => {
    try {
      const insertLeafTxn = await merkleTreeContract.insertLeaf(leaf);
      setLoading(true);
      console.log('Inserting a leaf...', insertLeafTxn.hash);
      await insertLeafTxn.wait();
      console.log('Leaf Txn --', insertLeafTxn.hash);
      setLeaf(leaf + 1);

      await getHashes();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const verifyProof = async () => {
    try {
      setDisplayVerify(true);
      setLoading(true);
      const input = {
        leaf: '1',
        path_elements: ['2', hashes[9], hashes[13]],
        path_index: ['0', '0', '0'],
      };

      const { proof, publicSignals } = await window.snarkjs.groth16.fullProve(input, circuitWasm, circuitZkey);
      console.log('PROOF:', proof);
      console.log('PUBLIC SIGNAL:', publicSignals);

      const result = await merkleTreeContract.verify(
        proof.pi_a.slice(0, 2),
        proof.pi_b.slice(0, 2),
        proof.pi_c.slice(0, 2),
        publicSignals,
      );

      setResult(result);
      console.log('VERIFIER RESULT:', result);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setDisplayVerify(false);
      }, 5000);
    }
  };

  const shortenHash = (name: string | undefined) => {
    if (!name) return 'Unknown';
    // name is not updated
    if (name.length > 10) {
      return `${name.substring(0, 5)}..${name.substring(name.length - 4, name.length)}`;
    }
    return name;
  };

  const renderTree = () => {
    return (
      <Tree label={shortenHash(hashes[14])}>
        <TreeNode label={shortenHash(hashes[12])}>
          <TreeNode label={shortenHash(hashes[8])}>
            <TreeNode label={shortenHash(hashes[0])} />
            <TreeNode label={shortenHash(hashes[1])} />
          </TreeNode>
          <TreeNode label={shortenHash(hashes[9])}>
            <TreeNode label={shortenHash(hashes[2])} />
            <TreeNode label={shortenHash(hashes[3])} />
          </TreeNode>
        </TreeNode>
        <TreeNode label={shortenHash(hashes[13])}>
          <TreeNode label={shortenHash(hashes[10])}>
            <TreeNode label={shortenHash(hashes[4])} />
            <TreeNode label={shortenHash(hashes[5])} />
          </TreeNode>
          <TreeNode label={shortenHash(hashes[11])}>
            <TreeNode label={shortenHash(hashes[6])} />
            <TreeNode label={shortenHash(hashes[7])} />
          </TreeNode>
        </TreeNode>
      </Tree>
    );
  };

  return (
    <div className="text-center">
      {!currentAccount && (
        <button className="mt-12 bg-violet-600 text-white py-4 px-8 text-xl rounded-lg" onClick={connectWallet}>
          Connect Wallet
        </button>
      )}

      {currentAccount && (
        <>
          <div className="my-12 space-y-4 space-x-8">
            <div className="font-bold text-2xl">Actions</div>
            <button
              className="bg-gradient-to-br from-amber-500 to-amber-300 text-white py-4 px-8 text-xl rounded-lg"
              onClick={insertLeaf}
            >
              Insert Leaf "{leaf}"
            </button>
            <button
              className="bg-gradient-to-br from-blue-500 to-blue-300 text-white py-4 px-8 text-xl rounded-lg"
              onClick={verifyProof}
            >
              Verify Proof
            </button>
          </div>

          {displayVerify && (
            <div className={`circle-loader ${!loading && (result ? 'load-complete' : 'load-fail')}`}>
              <div style={{ display: loading ? 'none' : 'block' }}>
                {result ? <div className="checkmark" /> : <div className="crossmark" />}
              </div>
            </div>
          )}

          <div className="my-16 space-y-4">
            <div className="font-bold text-2xl">Merkle Tree</div>
            <div>{loading ? 'Loading ...' : renderTree()}</div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
