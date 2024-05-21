import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { DialogContent } from "~/components/ui/dialog";
import { AuthScreenProps, InstallingWallet, OnrampScreenProps, cn } from "~/utils";

import { OnboardHeader } from "../../sharedComponents";
import { installWallet, socialOnrampFlow } from "./onboardingSocialUtils";

interface props extends AuthScreenProps {}

export const OnboardingSocial: React.FC<props> = ({
  isLoading,
  isActiveLoading,
  setIsLoading,
  setIsActiveLoading,
  loginWeb3Auth,
  onClose,
}: props) => {
  const { select, connected } = useWallet();
  const [screenIndex, setScreenIndex] = React.useState<number>(0);
  const [installingWallet, setInstallingWallet] = React.useState<InstallingWallet>();

  const screen = React.useMemo(() => {
    if (installingWallet) return installWallet;
    else if (socialOnrampFlow.length < screenIndex) onClose();
    return socialOnrampFlow[screenIndex];
  }, [installingWallet, screenIndex, onClose]);

  React.useEffect(() => {
    if (connected) setScreenIndex(1);
  }, [connected]);

  const onSelectWallet = (selectedWallet: string | null) => {
    if (!selectedWallet) return;
    if (installingWallet) setInstallingWallet(undefined);
    setIsLoading(true);
    setIsActiveLoading(selectedWallet);
    select(selectedWallet as any);
  };

  return (
    <DialogContent className={cn("md:block overflow-hidden p-4 pt-8 md:pt-4 justify-start md:max-w-xl")}>
      <OnboardHeader title={screen.title} description={screen.description} size={screen.titleSize} />

      {React.createElement(screen.comp, {
        isLoading: isLoading,
        isActiveLoading: isActiveLoading,
        installingWallet: installingWallet,
        onNext: () => setScreenIndex(screenIndex + 1),
        onClose: onClose,
        setIsLoading: setIsLoading,
        select: (walletName) => onSelectWallet(walletName),
        setIsActiveLoading: setIsActiveLoading,
        setInstallingWallet: setInstallingWallet,
        loginWeb3Auth: loginWeb3Auth,
      } as OnrampScreenProps)}
    </DialogContent>
  );
};
