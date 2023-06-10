import React, {useState, useCallback, useEffect} from 'react';
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
  PublicKey,
  VersionedTransaction,
} from '@solana/web3.js';

import {useAuthorization} from './providers/AuthorizationProvider';
import {useProgram} from './providers/AnchorProvider';
import {Program, AnchorProvider, setProvider} from '@coral-xyz/anchor';
import {AnchorCounter, IDL} from '../idl/anchor-counter';
import {useConnection} from './providers/ConnectionProvider';

export const APP_IDENTITY = {
  name: 'Solana dApp Scaffold',
};

export default function AnchorCounterButton() {
  const {authorizeSession, selectedAccount} = useAuthorization();
  const {connection} = useConnection();

  const [program, setProgram] = useState<Program<AnchorCounter> | null>(null);

  // const {program} = useProgram();
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

      const programId = new PublicKey(
        'ALeaCzuJpZpoCgTxMjJbNjREVqSwuvYFRZUfc151AKHU',
      );

      const [counter] = PublicKey.findProgramAddressSync(
        [Buffer.from('counter')],
        programId,
      );

      const ix = await program!.methods
        .increment()
        .accounts({
          counter: counter,
          user: authorizationResult.publicKey,
        })
        .instruction();

      const tx = new Transaction({
        ...latestBlockhash,
        feePayer: authorizationResult.publicKey,
      }).add(ix);

      // Sign a transaction and receive
      const signedTransactions = await wallet.signAndSendTransactions({
        transactions: [tx],
      });

      // const txSig = connection.sendTransaction(signTransactions[0]);

      console.log(signedTransactions);

      // return signedTransactions[0];
    });
  }, [authorizeSession, program]);

  useEffect(() => {
    if (!selectedAccount) return;
    const MockWallet = {
      signTransaction: () => Promise.reject(),
      signAllTransactions: () => Promise.reject(),
      publicKey: Keypair.generate().publicKey,
    };

    const programId = new PublicKey(
      'ALeaCzuJpZpoCgTxMjJbNjREVqSwuvYFRZUfc151AKHU',
    );

    const provider = new AnchorProvider(connection, MockWallet, {});
    setProvider(provider);
    const program = new Program<AnchorCounter>(IDL, programId, provider);

    setProgram(program);
  }, [connection, selectedAccount]);

  return (
    <Button
      title="Anchor Counter"
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
          // console.log(fromUint8Array(signedTransaction.serialize()));
        } finally {
          setSigningInProgress(false);
        }
      }}
    />
  );
}
