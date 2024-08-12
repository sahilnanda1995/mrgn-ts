import React from "react";
import { useRouter } from "next/router";

import { useTradeStore } from "~/store";
import { useConnection } from "~/hooks/useConnection";
import { useWalletContext } from "~/hooks/useWalletContext";
import { PublicKey } from "@solana/web3.js";
import { identify, usePrevious } from "~/utils";

// @ts-ignore - Safe because context hook checks for null
const TradeContext = React.createContext<>();

export const TradePovider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const router = useRouter();
  const debounceId = React.useRef<NodeJS.Timeout | null>(null);
  const { wallet, isOverride, connected, walletAddress } = useWalletContext();
  const prevWalletAddress = usePrevious(walletAddress);
  const { connection } = useConnection();
  const [
    initialized,
    userDataFetched,
    activeGroup,
    fetchTradeState,
    setActiveGroup,
    isRefreshingStore,
    setIsRefreshingStore,
  ] = useTradeStore((state) => [
    state.initialized,
    state.userDataFetched,
    state.activeGroup,
    state.fetchTradeState,
    state.setActiveGroup,
    state.isRefreshingStore,
    state.setIsRefreshingStore,
  ]);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  React.useEffect(() => {
    const symbol = router?.query?.symbol as string | undefined;
    const isWalletConnected = wallet?.publicKey;

    if (!isLoggedIn && isWalletConnected) {
      setIsLoggedIn(true);
      identify(wallet.publicKey.toBase58());
    }

    if (!symbol) {
      //clear state
    } else if (initialized) {
      try {
        const pk = new PublicKey(symbol);
        setActiveGroup({ groupPk: new PublicKey(symbol) });
      } catch {
        router.push("/404");
      }
    }
  }, [router, initialized, prevWalletAddress, walletAddress, userDataFetched, wallet, setActiveGroup, isLoggedIn]);

  // add a useEffect to run on every route change
  React.useEffect(() => {
    const trackReferral = async (referralCode: string, walletAddress: string) => {
      const trackReferralRes = await fetch(`/api/user/referral/track-referral`, {
        method: "POST",
        body: JSON.stringify({ referralCode, wallet: walletAddress }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!trackReferralRes.ok) {
        return;
      }

      const trackReferralResJson = await trackReferralRes.json();
      sessionStorage.removeItem("arenaReferralCode");
    };

    const referralCode = sessionStorage.getItem("arenaReferralCode");
    if (!referralCode || !wallet || !connected) return;

    trackReferral(referralCode, wallet.publicKey.toBase58());
  }, [router.asPath, wallet, connected]);

  React.useEffect(() => {
    const fetchData = () => {
      setIsRefreshingStore(true);
      fetchTradeState({
        connection,
        wallet,
      });
    };

    if (debounceId.current) {
      clearTimeout(debounceId.current);
    }

    debounceId.current = setTimeout(() => {
      fetchData();

      const id = setInterval(() => {
        setIsRefreshingStore(true);
        fetchTradeState({});
      }, 50_000);

      return () => {
        clearInterval(id);
        clearTimeout(debounceId.current!);
      };
    }, 1000);

    return () => {
      if (debounceId.current) {
        clearTimeout(debounceId.current);
      }
    };
  }, [wallet, isOverride]); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ crucial to omit both `connection` and `fetchMrgnlendState` from the dependency array
  // TODO: fix...

  return <TradeContext.Provider value={{}}>{children}</TradeContext.Provider>;
};
