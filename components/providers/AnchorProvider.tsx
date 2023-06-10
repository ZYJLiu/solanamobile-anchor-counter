import {Program, AnchorProvider, setProvider, Wallet} from '@coral-xyz/anchor';
import {AnchorCounter, IDL} from '../../idl/anchor-counter';
import {
  useState,
  useCallback,
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useEffect,
} from 'react';
import {useAuthorization} from './AuthorizationProvider';
import {useConnection} from './ConnectionProvider';
import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {Keypair, PublicKey, Transaction} from '@solana/web3.js';

export type ProgramContextType = {
  program: Program<AnchorCounter> | null;
};

export const ProgramContext = createContext<ProgramContextType>({
  program: null,
});

export function ProgramProvider({children}: {children: ReactNode}) {
  // const {selectedAccount, authorizeSession} = useAuthorization();
  const {connection} = useConnection();
  const [program, setProgram] = useState<Program<AnchorCounter> | null>(null);

  const setupProgram = useCallback(async () => {
    const programId = new PublicKey(
      'ALeaCzuJpZpoCgTxMjJbNjREVqSwuvYFRZUfc151AKHU',
    );

    const MockWallet = {
      signTransaction: () => Promise.reject(),
      signAllTransactions: () => Promise.reject(),
      publicKey: Keypair.generate().publicKey,
    };

    const provider = new AnchorProvider(connection, MockWallet, {});
    setProvider(provider);
    const programInstance = new Program<AnchorCounter>(
      IDL,
      programId,
      provider,
    );

    setProgram(programInstance);
  }, [connection]);

  useEffect(() => {
    setupProgram();
  }, [setupProgram]);

  const value = useMemo(
    () => ({
      program,
    }),
    [program],
  );

  return (
    <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>
  );
}

export const useProgram = () => useContext(ProgramContext);
