import {Program, AnchorProvider, setProvider} from '@coral-xyz/anchor';
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
import {useConnection} from './ConnectionProvider';
import {Keypair, PublicKey} from '@solana/web3.js';

// Define the context type
export type ProgramContextType = {
  program: Program<AnchorCounter> | null;
  counterAddress: PublicKey | null;
};

export const ProgramContext = createContext<ProgramContextType>({
  program: null,
  counterAddress: null,
});

export function ProgramProvider({children}: {children: ReactNode}) {
  const {connection} = useConnection(); // Use the custom hook to get the connection from the ConnectionProvider.
  const [program, setProgram] = useState<Program<AnchorCounter> | null>(null);
  const [counterAddress, setCounterAddress] = useState<PublicKey | null>(null);

  // Define the setup function to create the Program instance and derive the counter address.
  const setup = useCallback(async () => {
    const programId = new PublicKey(
      'ALeaCzuJpZpoCgTxMjJbNjREVqSwuvYFRZUfc151AKHU',
    );

    // MockWallet is used here as a placeholder wallet to set up Anchor provider.
    const MockWallet = {
      signTransaction: () => Promise.reject(),
      signAllTransactions: () => Promise.reject(),
      publicKey: Keypair.generate().publicKey,
    };

    // Instantiate the provider with the connection, the MockWallet, and default options.
    const provider = new AnchorProvider(connection, MockWallet, {});
    setProvider(provider);

    // Instantiate the program with the AnchorCounter IDL, the programId, and the provider.
    const programInstance = new Program<AnchorCounter>(
      IDL,
      programId,
      provider,
    );

    // Derive the counter account address. This account should already exist.
    const [counterAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('counter')],
      programId,
    );

    setProgram(programInstance);
    setCounterAddress(counterAddress);
  }, [connection]);

  useEffect(() => {
    setup();
  }, [setup]);

  const value = useMemo(
    () => ({
      program,
      counterAddress,
    }),
    [program, counterAddress],
  );

  // Provide the context value to child components.
  return (
    <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>
  );
}

// Create a custom hook to allow easy access to the program context.
export const useProgram = () => useContext(ProgramContext);
