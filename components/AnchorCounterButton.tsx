import React, {useState} from 'react';
import {Button, View} from 'react-native';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {Transaction} from '@solana/web3.js';
import {useAuthorization} from './providers/AuthorizationProvider';
import {useProgram} from './providers/AnchorProvider';
import {useConnection} from './providers/ConnectionProvider';

export default function AnchorCounterButton() {
  const {authorizeSession} = useAuthorization(); // Use the custom hook to get the authorizeSession function from the AuthorizationProvider.
  const {program, counterAddress} = useProgram(); // Use the custom hook to get the program and counterAddress from the AnchorProvider.
  const {connection} = useConnection(); // Use the custom hook to get the connection from the ConnectionProvider.
  const [isIncrement, setIsIncrement] = useState(false);
  const [isDecrement, setIsDecrement] = useState(false);

  // Function to send transaction to increment counter account.
  const incrementCounter = async () => {
    setIsIncrement(true);
    try {
      await createAndSubmitTransaction('increment');
      setIsIncrement(false);
    } catch (error) {
      console.log(error);
      setIsIncrement(false);
    }
  };

  // Function to send transaction to decrement counter account.
  const decrementCounter = async () => {
    setIsDecrement(true);
    try {
      await createAndSubmitTransaction('decrement');
      setIsDecrement(false);
    } catch (error) {
      console.log(error);
      setIsDecrement(false);
    }
  };

  // Function to create and submit a transaction.
  const createAndSubmitTransaction = async (actionType: string) => {
    if (!program || !counterAddress) return;

    return await transact(async (wallet: Web3MobileWallet) => {
      const [authResult, blockhashResult] = await Promise.all([
        authorizeSession(wallet),
        connection.getLatestBlockhash(),
      ]);

      let transactionInstruction;

      // Based on the actionType, create a transaction instruction to either increment or decrement the counter.
      switch (actionType) {
        case 'increment':
          transactionInstruction = await program.methods
            .increment()
            .accounts({
              counter: counterAddress,
              user: authResult.publicKey,
            })
            .instruction();
          break;

        case 'decrement':
          transactionInstruction = await program.methods
            .decrement()
            .accounts({
              counter: counterAddress,
              user: authResult.publicKey,
            })
            .instruction();
          break;

        default:
          throw new Error('Invalid action type');
      }

      // Create a new transaction with the blockhash and the payer's public key.
      // Then add the transaction instruction to it.
      const transaction = new Transaction({
        ...blockhashResult,
        feePayer: authResult.publicKey,
      }).add(transactionInstruction);

      // Request wallet to sign and send the transaction, then log the transaction signature.
      const txSig = await wallet.signAndSendTransactions({
        transactions: [transaction],
      });

      console.log(txSig);
    });
  };

  return (
    <View>
      <Button
        title="Increment"
        disabled={isIncrement}
        onPress={incrementCounter}
      />
      <Button
        title="Decrement"
        disabled={isDecrement}
        onPress={decrementCounter}
      />
    </View>
  );
}
