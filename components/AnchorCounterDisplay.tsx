import React, {useEffect, useState} from 'react';
import {View, Text} from 'react-native';
import {AccountInfo} from '@solana/web3.js';
import {useProgram} from './providers/AnchorProvider';
import {useConnection} from './providers/ConnectionProvider';
import {IdlAccounts} from '@coral-xyz/anchor';
import {AnchorCounter} from '../idl/anchor-counter';

type Counter = IdlAccounts<AnchorCounter>['counter'];

export default function AnchorCounterDisplay() {
  const {connection} = useConnection();
  const {program, counterAddress} = useProgram();
  const [counterState, setCounterState] = useState<Counter>();

  useEffect(() => {
    if (!program || !counterAddress) return;

    const fetchState = async () => {
      const counterState = await program.account.counter.fetch(counterAddress);
      setCounterState(counterState);
    };

    const subscriptionId = connection.onAccountChange(
      counterAddress,
      (accountInfo: AccountInfo<Buffer>) => {
        try {
          const data = program.coder.accounts.decode(
            'counter',
            accountInfo.data,
          );
          setCounterState(data);
        } catch (error) {
          console.log('Error decoding account data:', error);
        }
      },
    );

    fetchState();

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
