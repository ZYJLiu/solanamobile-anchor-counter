import React, {useState} from 'react';
import {Alert, Button, View} from 'react-native';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {
  clusterApiUrl,
  Connection,
  Transaction,
  PublicKey,
} from '@solana/web3.js';
import {useAuthorization} from './providers/AuthorizationProvider';
import {useProgram} from './providers/AnchorProvider';

export const APP_IDENTITY = {name: 'Solana dApp Scaffold'};

export default function AnchorCounterButton() {
  const {authorizeSession} = useAuthorization();
  const {program, counterAddress} = useProgram();
  const [isSigningIncrement, setIsSigningIncrement] = useState(false);
  const [isSigningDecrement, setIsSigningDecrement] = useState(false);

  const incrementCounter = async () => {
    setIsSigningIncrement(true);
    try {
      await transactTransaction('increment');
      setIsSigningIncrement(false);
    } catch (error) {
      console.log(error);
      setIsSigningIncrement(false);
    }
  };

  const decrementCounter = async () => {
    setIsSigningDecrement(true);
    try {
      await transactTransaction('decrement');
      setIsSigningDecrement(false);
    } catch (error) {
      console.log(error);
      setIsSigningDecrement(false);
    }
  };

  const transactTransaction = async (actionType: string) => {
    if (!program || !counterAddress) return;

    return await transact(async (wallet: Web3MobileWallet) => {
      const devnetConnection = new Connection(
        clusterApiUrl('devnet'),
        'confirmed',
      );
      const [authResult, blockhashResult] = await Promise.all([
        authorizeSession(wallet),
        devnetConnection.getLatestBlockhash(),
      ]);

      let transactionInstruction;
      if (actionType === 'increment') {
        transactionInstruction = await program.methods
          .increment()
          .accounts({
            counter: counterAddress,
            user: authResult.publicKey,
          })
          .instruction();
      } else if (actionType === 'decrement') {
        transactionInstruction = await program.methods
          .decrement()
          .accounts({
            counter: counterAddress,
            user: authResult.publicKey,
          })
          .instruction();
      } else {
        throw new Error('Invalid action type');
      }

      const transaction = new Transaction({
        ...blockhashResult,
        feePayer: authResult.publicKey,
      }).add(transactionInstruction);

      const signedTransactions = await wallet.signAndSendTransactions({
        transactions: [transaction],
      });

      console.log(signedTransactions);
    });
  };

  return (
    <View>
      <Button
        title="Increment"
        disabled={isSigningIncrement}
        onPress={incrementCounter}
      />
      <Button
        title="Decrement"
        disabled={isSigningDecrement}
        onPress={decrementCounter}
      />
    </View>
  );
}
