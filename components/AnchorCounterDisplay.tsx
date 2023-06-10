import React, {useEffect, useState} from 'react';
import {View, Text} from 'react-native';
import {AccountInfo} from '@solana/web3.js';
import {useProgram} from './providers/AnchorProvider';
import {useConnection} from './providers/ConnectionProvider';
import {IdlAccounts} from '@coral-xyz/anchor';
import {AnchorCounter} from '../idl/anchor-counter';

// Define the type for the counter account.
type Counter = IdlAccounts<AnchorCounter>['counter'];

export default function AnchorCounterDisplay() {
  const {connection} = useConnection(); // Use the custom hook to get the connection from the ConnectionProvider.
  const {program, counterAddress} = useProgram(); // Use the custom hook to get the program and counterAddress from the AnchorProvider.
  const [counterState, setCounterState] = useState<Counter>();

  useEffect(() => {
    if (!program || !counterAddress) return;

    // Define an async function to fetch and set the current counter state.
    const fetchState = async () => {
      const counterState = await program.account.counter.fetch(counterAddress);
      setCounterState(counterState);
    };

    fetchState(); // Fetch the initial state.

    // Subscribe to counter account changes.
    const subscriptionId = connection.onAccountChange(
      counterAddress,
      (accountInfo: AccountInfo<Buffer>) => {
        try {
          // Decode the account data using the program's coder.
          const data = program.coder.accounts.decode(
            'counter',
            accountInfo.data,
          );
          setCounterState(data); // Update the counter state.
        } catch (error) {
          console.log('Error decoding account data:', error);
        }
      },
    );

    // Unsubscribe from account changes when the component is unmounted.
    return () => {
      connection.removeAccountChangeListener(subscriptionId);
    };
  }, [program, counterAddress, connection]);

  return (
    <View>
      <Text style={{fontSize: 24}}>
        Count: {counterState?.count.toString()}
      </Text>
    </View>
  );
}
