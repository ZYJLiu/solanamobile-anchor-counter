import React, {useState, useCallback} from 'react';
import {Alert, Button} from 'react-native';
import {fromUint8Array} from 'js-base64';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {
  Keypair,
  clusterApiUrl,
  Connection,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

import {useAuthorization} from './providers/AuthorizationProvider';

export const APP_IDENTITY = {
  name: 'Solana dApp Scaffold',
};

export default function SignTransactionButton() {
  const {authorizeSession} = useAuthorization();
  const [signingInProgress, setSigningInProgress] = useState(false);

  const signTransaction = useCallback(async () => {
    return await transact(async (wallet: Web3MobileWallet) => {
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

      // First, request for authorization from the wallet and fetch the latest
      // blockhash for building the transaction.
      const [authorizationResult, latestBlockhash] = await Promise.all([
        authorizeSession(wallet),
        connection.getLatestBlockhash(),
      ]);

      // Construct a transaction. This transaction uses web3.js `SystemProgram`
      // to create a transfer that sends lamports to randomly generated address.
      const keypair = Keypair.generate();
      const randomTransferTransaction = new Transaction({
        ...latestBlockhash,
        feePayer: authorizationResult.publicKey,
      }).add(
        SystemProgram.transfer({
          fromPubkey: authorizationResult.publicKey,
          toPubkey: keypair.publicKey,
          lamports: 1_000_000,
        }),
      );

      // Sign a transaction and receive
      const signedTransactions = await wallet.signTransactions({
        transactions: [randomTransferTransaction],
      });

      return signedTransactions[0];
    });
  }, [authorizeSession]);

  return (
    <Button
      title="Sign Transaction"
      disabled={signingInProgress}
      onPress={async () => {
        if (signingInProgress) {
          return;
        }
        setSigningInProgress(true);
        try {
          const signedTransaction = await signTransaction();
          setTimeout(async () => {
            Alert.alert(
              'Transaction signed!',
              'View SignTransactionButton.tsx for implementation.',
              [{text: 'Ok', style: 'cancel'}],
            );
          }, 100);
          console.log(fromUint8Array(signedTransaction.serialize()));
        } finally {
          setSigningInProgress(false);
        }
      }}
    />
  );
}
