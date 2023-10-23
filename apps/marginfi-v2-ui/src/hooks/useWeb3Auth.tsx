import React from "react";
import { WALLET_ADAPTERS } from "@web3auth/base";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { CHAIN_NAMESPACES, IProvider } from "@web3auth/base";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { SolanaWallet, SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { Wallet } from "@mrgnlabs/mrgn-common";
import { toast } from "react-toastify";

interface Web3AuthContextProps {
  web3AuthWalletData: Wallet | undefined;
  connected: boolean;
  login: (
    provider: "email_passwordless" | "google" | "twitter" | "apple",
    extraLoginOptions?: Partial<{
      login_hint: string;
    }>
  ) => void;
  logout: () => void;
}

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  chainId: "0x1",
  rpcTarget: process.env.NEXT_PUBLIC_MARGINFI_RPC_ENDPOINT_OVERRIDE || '"https://mrgn.rpcpool.com/',
  displayName: "Solana Mainnet",
  blockExplorer: "https://explorer.solana.com",
  ticker: "SOL",
  tickerName: "Solana",
};

const Web3AuthContext = React.createContext<Web3AuthContextProps | undefined>(undefined);

export const Web3AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [web3AuthWalletData, setWeb3AuthWalletData] = React.useState<Wallet>();
  const [web3auth, setWeb3auth] = React.useState<Web3AuthNoModal | null>(null);

  const connected = React.useMemo(() => {
    console.log(web3auth?.connected);
    return web3auth ? web3auth.connected : false;
  }, [web3auth]);

  const logout = async () => {
    if (!web3auth) return;
    await web3auth.logout();
    setWeb3AuthWalletData(undefined);
  };

  const login = async (provider: string, extraLoginOptions: any = {}) => {
    if (!web3auth) return;
    const web3authProvider = await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
      loginProvider: provider,
      extraLoginOptions,
    });

    if (!web3authProvider) {
      toast.error("Error connecting to Web3Auth");
      return;
    }

    makeWeb3AuthWalletData(web3authProvider);
  };

  const makeWeb3AuthWalletData = async (web3authProvider: IProvider) => {
    const solanaWallet = new SolanaWallet(web3authProvider);
    const accounts = await solanaWallet.requestAccounts();

    console.log("Connected public key", accounts[0]);

    setWeb3AuthWalletData({
      publicKey: new PublicKey(accounts[0]),
      async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
        const solanaWallet = new SolanaWallet(web3authProvider);
        const signedTransaction = await solanaWallet.signTransaction(transaction);
        return signedTransaction;
      },
      async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
        const solanaWallet = new SolanaWallet(web3authProvider);
        const signedTransactions = await solanaWallet.signAllTransactions(transactions);
        return signedTransactions;
      },
    });
  };

  React.useEffect(() => {
    if (!web3auth) return;

    if (web3auth.connected && web3auth.provider && !web3AuthWalletData) {
      makeWeb3AuthWalletData(web3auth.provider);
    }
  }, [web3auth]);

  React.useEffect(() => {
    const init = async () => {
      try {
        const web3authInstance = new Web3AuthNoModal({
          clientId: process.env.NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID || "",
          chainConfig,
          web3AuthNetwork: "sapphire_devnet",
        });

        const privateKeyProvider = new SolanaPrivateKeyProvider({ config: { chainConfig } });

        const openloginAdapter = new OpenloginAdapter({
          privateKeyProvider,
        });

        web3authInstance.configureAdapter(openloginAdapter);
        await web3authInstance.init();

        setWeb3auth(web3authInstance);
      } catch (error) {
        console.log("init error", error);
        console.error(error);
      }
    };

    init();
  }, []);

  return (
    <Web3AuthContext.Provider value={{ web3AuthWalletData, connected, login, logout }}>
      {children}
    </Web3AuthContext.Provider>
  );
};

export const useWeb3Auth = () => {
  const context = React.useContext(Web3AuthContext);
  if (!context) {
    throw new Error("useWeb3Auth must be used within a Web3AuthProvider");
  }
  return context;
};
