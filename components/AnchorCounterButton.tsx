import React, {useState} from 'react';
import {Alert, Button, View} from 'react-native';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {clusterApiUrl, Connection, Transaction} from '@solana/web3.js';
import {useAuthorization} from './providers/AuthorizationProvider';
import {useProgram} from './providers/AnchorProvider';
import {useConnection} from './providers/ConnectionProvider';

export default function AnchorCounterButton() {
  const {authorizeSession} = useAuthorization();
  const {program, counterAddress} = useProgram();
  const {connection} = useConnection();
  const [isIncrement, setIsIncrement] = useState(false);
  const [isDecrement, setIsDecrement] = useState(false);

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

  const createAndSubmitTransaction = async (actionType: string) => {
    if (!program || !counterAddress) return;

    return await transact(async (wallet: Web3MobileWallet) => {
      const [authResult, blockhashResult] = await Promise.all([
        authorizeSession(wallet),
        connection.getLatestBlockhash(),
      ]);

      let transactionInstruction;

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
