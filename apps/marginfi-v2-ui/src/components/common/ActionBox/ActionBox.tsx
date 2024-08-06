import React, { useEffect } from "react";

import Link from "next/link";
import { v4 as uuidv4 } from "uuid";

import { WSOL_MINT, nativeToUi } from "@mrgnlabs/mrgn-common";
import { ActionType, ActiveBankInfo, ExtendedBankInfo } from "@mrgnlabs/marginfi-v2-ui-state";

import { useLstStore, useMrgnlendStore, useUiStore } from "~/store";
import {
  closeBalance,
  executeLendingAction,
  cn,
  capture,
  executeLstAction,
  getBlockedActions,
  executeLoopingAction,
  createAccountAction,
} from "~/utils";
import { useWalletContext } from "~/hooks/useWalletContext";
import { useConnection } from "~/hooks/useConnection";
import { useActionBoxStore } from "~/hooks/useActionBoxStore";
import { SOL_MINT } from "~/store/lstStore";

import { LSTDialog, LSTDialogVariants } from "~/components/common/AssetList";
import { checkActionAvailable } from "~/utils/actionBoxUtils";
import { IconAlertTriangle, IconExternalLink, IconSettings } from "~/components/ui/icons";
import { showErrorToast } from "~/utils/toastUtils";

import {
  ActionBoxPreview,
  ActionBoxSettings,
  ActionBoxActions,
  ActionBoxInput,
} from "~/components/common/ActionBox/components";
import { Button } from "~/components/ui/button";
import { ActionMethod, MarginfiActionParams, RepayType } from "@mrgnlabs/mrgn-utils";

type ActionBoxProps = {
  requestedAction?: ActionType;
  requestedBank?: ExtendedBankInfo;
  isDialog?: boolean;
  isMini?: boolean;
  handleCloseDialog?: () => void;
  onComplete?: () => void;
  onError?: () => void;
};

type BlackListRoutesMap = {
  [tokenIdentifier: string]: {
    blacklistRoutes: string[];
  };
};

export const ActionBox = ({
  requestedAction,
  requestedBank,
  isDialog,
  isMini = false,
  handleCloseDialog,
  onComplete,
  onError,
}: ActionBoxProps) => {
  const [
    mfiClient,
    nativeSolBalance,
    setIsRefreshingStore,
    fetchMrgnlendState,
    selectedAccount,
    extendedBankInfos,
    isInitialized,
  ] = useMrgnlendStore((state) => [
    state.marginfiClient,
    state.nativeSolBalance,
    state.setIsRefreshingStore,
    state.fetchMrgnlendState,
    state.selectedAccount,
    state.extendedBankInfos,
    state.initialized,
  ]);

  const [
    slippageBps,
    amountRaw,
    loopingAmounts,
    repayAmountRaw,
    maxAmountCollat,
    actionMode,
    repayMode,
    selectedBank,
    selectedRepayBank,
    selectedStakingAccount,
    actionQuote,
    actionTxns,
    isLoading,
    leverage,
    errorMessage,

    refreshState,
    fetchActionBoxState,
    setSlippageBps,
    setActionMode,
    setIsLoading,
    setAmountRaw,
    refreshSelectedBanks,
  ] = useActionBoxStore(isDialog)((state) => [
    state.slippageBps,
    state.amountRaw,
    state.loopingAmounts,
    state.repayAmountRaw,
    state.maxAmountCollat,
    state.actionMode,
    state.repayMode,
    state.selectedBank,
    state.selectedRepayBank,
    state.selectedStakingAccount,
    state.actionQuote,
    state.actionTxns,
    state.isLoading,
    state.leverage,
    state.errorMessage,

    state.refreshState,
    state.fetchActionBoxState,
    state.setSlippageBps,
    state.setActionMode,
    state.setIsLoading,
    state.setAmountRaw,
    state.refreshSelectedBanks,
  ]);

  const [priorityFee, setPriorityFee, setIsActionComplete, setPreviousTxn] = useUiStore((state) => [
    state.priorityFee,
    state.setPriorityFee,
    state.setIsActionComplete,
    state.setPreviousTxn,
  ]);
  const [lstData, lstQuoteMeta, feesAndRent] = useLstStore((state) => [
    state.lstData,
    state.quoteResponseMeta,
    state.feesAndRent,
  ]);

  const { walletContextState, connected, wallet } = useWalletContext();
  const { connection } = useConnection();

  // Cleanup the store when the wallet disconnects
  React.useEffect(() => {
    if (!connected) {
      refreshState(actionMode);
    }
  }, [refreshState, connected, actionMode]);

  const [isSettingsMode, setIsSettingsMode] = React.useState<boolean>(false);
  const [isLSTDialogOpen, setIsLSTDialogOpen] = React.useState(false);
  const [lstDialogVariant, setLSTDialogVariant] = React.useState<LSTDialogVariants | null>(null);
  const [hasLSTDialogShown, setHasLSTDialogShown] = React.useState<LSTDialogVariants[]>([]);
  const [lstDialogCallback, setLSTDialogCallback] = React.useState<(() => void) | null>(null);
  const [additionalActionMethods, setAdditionalActionMethods] = React.useState<ActionMethod[]>([]);

  React.useEffect(() => {
    fetchActionBoxState({ requestedAction, requestedBank });
  }, [requestedAction, requestedBank, fetchActionBoxState]);

  React.useEffect(() => {
    refreshSelectedBanks(extendedBankInfos);
  }, [extendedBankInfos, refreshSelectedBanks]);

  React.useEffect(() => {
    if (errorMessage !== null && errorMessage.description) {
      showErrorToast(errorMessage?.description);
      setAdditionalActionMethods([errorMessage]);
    }
  }, [errorMessage]);

  const showCreateAccount = React.useMemo(() => {
    if (actionMode === ActionType.Loop && selectedAccount === null && connected) return true;
    return false;
  }, [actionMode, selectedAccount, connected]);

  // Either a staking account is selected or a bank
  const isActionDisabled = React.useMemo(() => {
    const blockedActions = getBlockedActions();

    if (blockedActions?.find((value) => value === actionMode)) return true;

    return false;
  }, [actionMode]);

  // Amount related useMemo's
  const amount = React.useMemo(() => {
    const strippedAmount = amountRaw.replace(/,/g, "");
    return isNaN(Number.parseFloat(strippedAmount)) ? 0 : Number.parseFloat(strippedAmount);
  }, [amountRaw]);

  const repayAmount = React.useMemo(() => {
    const strippedAmount = repayAmountRaw.replace(/,/g, "");
    return isNaN(Number.parseFloat(strippedAmount)) ? 0 : Number.parseFloat(strippedAmount);
  }, [repayAmountRaw]);

  const walletAmount = React.useMemo(
    () =>
      selectedBank?.info.state.mint?.equals && selectedBank?.info.state.mint?.equals(WSOL_MINT)
        ? selectedBank?.userInfo.tokenAccount.balance + nativeSolBalance
        : selectedBank?.userInfo.tokenAccount.balance,
    [nativeSolBalance, selectedBank]
  );

  const maxAmount = React.useMemo(() => {
    if ((!selectedBank && !selectedStakingAccount) || !isInitialized) {
      return 0;
    }

    switch (actionMode) {
      case ActionType.Deposit:
        return selectedBank?.userInfo.maxDeposit ?? 0;
      case ActionType.Loop:
        return selectedBank?.userInfo.maxDeposit ?? 0;
      case ActionType.Withdraw:
        return selectedBank?.userInfo.maxWithdraw ?? 0;
      case ActionType.Borrow:
        return selectedBank?.userInfo.maxBorrow ?? 0;
      case ActionType.Repay:
        if (repayMode === RepayType.RepayCollat && selectedBank?.isActive) return maxAmountCollat ?? 0;
        return selectedBank?.userInfo.maxRepay ?? 0;
      case ActionType.MintLST:
        if (selectedStakingAccount) return nativeToUi(selectedStakingAccount.lamports, 9);
        if (selectedBank?.info.state.mint.equals(SOL_MINT))
          return walletAmount ? Math.max(0, walletAmount - nativeToUi(feesAndRent, 9)) : 0;
        else return walletAmount ?? 0;
      case ActionType.UnstakeLST:
        return walletAmount ?? 0;
      default:
        return 0;
    }
  }, [
    selectedBank,
    selectedStakingAccount,
    actionMode,
    isInitialized,
    walletAmount,
    feesAndRent,
    maxAmountCollat,
    repayMode,
  ]);

  const isDust = React.useMemo(() => selectedBank?.isActive && selectedBank?.position.isDust, [selectedBank]);
  const showCloseBalance = React.useMemo(() => actionMode === ActionType.Withdraw && isDust, [actionMode, isDust]);
  // const isPreviewVisible = React.useMemo(
  //   () => actionMode === ActionType.MintLST || !!selectedBank,
  //   [actionMode, selectedBank]
  // );

  const actionMethods = React.useMemo(
    () =>
      checkActionAvailable({
        amount,
        repayAmount,
        connected,
        showCloseBalance,
        selectedBank,
        selectedRepayBank,
        selectedStakingAccount,
        extendedBankInfos,
        marginfiAccount: selectedAccount,
        nativeSolBalance,
        actionMode,
        blacklistRoutes: null,
        repayMode,
        repayCollatQuote: actionQuote ?? null,
        lstQuoteMeta: lstQuoteMeta,
      }),
    [
      amount,
      repayAmount,
      connected,
      showCloseBalance,
      selectedBank,
      selectedRepayBank,
      selectedStakingAccount,
      extendedBankInfos,
      selectedAccount,
      nativeSolBalance,
      actionMode,
      repayMode,
      actionQuote,
      lstQuoteMeta,
    ]
  );

  const executeLendingActionCb = React.useCallback(
    async ({
      mfiClient,
      actionType: currentAction,
      bank,
      amount: borrowOrLendAmount,
      nativeSolBalance,
      marginfiAccount,
      walletContextState,
      repayWithCollatOptions,
    }: MarginfiActionParams) => {
      setIsLoading(true);
      const attemptUuid = uuidv4();
      capture(`user_${currentAction.toLowerCase()}_initiate`, {
        uuid: attemptUuid,
        tokenSymbol: bank.meta.tokenSymbol,
        tokenName: bank.meta.tokenName,
        amount: borrowOrLendAmount,
        priorityFee,
      });
      const txnSig = await executeLendingAction({
        mfiClient,
        actionType: currentAction,
        bank,
        amount: borrowOrLendAmount,
        nativeSolBalance,
        marginfiAccount,
        walletContextState,
        priorityFee,
        repayWithCollatOptions,
      });

      setIsLoading(false);
      handleCloseDialog && handleCloseDialog();
      setAmountRaw("");

      if (txnSig) {
        setIsActionComplete(true);
        setPreviousTxn({
          type: currentAction,
          bank: bank as ActiveBankInfo,
          amount: borrowOrLendAmount,
          txn: Array.isArray(txnSig) ? txnSig.pop() ?? "" : txnSig!,
        });
        capture(`user_${currentAction.toLowerCase()}`, {
          uuid: attemptUuid,
          tokenSymbol: bank.meta.tokenSymbol,
          tokenName: bank.meta.tokenName,
          amount: borrowOrLendAmount,
          txn: txnSig!,
          priorityFee,
        });

        onComplete && onComplete();
      } else {
        onError && onError();
      }

      // -------- Refresh state
      try {
        setIsRefreshingStore(true);
        await fetchMrgnlendState();
      } catch (error: any) {
        console.log("Error while reloading state");
        console.log(error);
      }
    },
    [
      setIsLoading,
      priorityFee,
      handleCloseDialog,
      setAmountRaw,
      setIsActionComplete,
      setPreviousTxn,
      onComplete,
      onError,
      setIsRefreshingStore,
      fetchMrgnlendState,
    ]
  );

  const handleCloseBalance = React.useCallback(async () => {
    if (!selectedBank || !selectedAccount) {
      return;
    }
    setIsLoading(true);
    const attemptUuid = uuidv4();
    capture(`user_close_balance_initiate`, {
      uuid: attemptUuid,
      tokenSymbol: selectedBank.meta.tokenSymbol,
      tokenName: selectedBank.meta.tokenName,
      amount: 0,
      priorityFee,
    });

    const txnSig = await closeBalance({ marginfiAccount: selectedAccount, bank: selectedBank, priorityFee });
    setIsLoading(false);
    if (txnSig) {
      setPreviousTxn({
        type: ActionType.Withdraw,
        bank: selectedBank as ActiveBankInfo,
        amount: 0,
        txn: txnSig!,
      });
      capture(`user_close_balance`, {
        uuid: attemptUuid,
        tokenSymbol: selectedBank.meta.tokenSymbol,
        tokenName: selectedBank.meta.tokenName,
        amount: 0,
        txn: txnSig!,
        priorityFee,
      });
    }

    setAmountRaw("");
    handleCloseDialog && handleCloseDialog();

    try {
      setIsRefreshingStore(true);
      await fetchMrgnlendState();
    } catch (error: any) {
      console.log("Error while reloading state");
      console.log(error);
    }
  }, [
    selectedBank,
    selectedAccount,
    priorityFee,
    setIsLoading,
    setAmountRaw,
    handleCloseDialog,
    setPreviousTxn,
    setIsRefreshingStore,
    fetchMrgnlendState,
  ]);

  const handleAction = async () => {
    if (actionMode === ActionType.MintLST || actionMode === ActionType.UnstakeLST) {
      await handleLstAction();
    } else if (actionMode === ActionType.Loop) {
      await handleLoopingAction();
    } else {
      await handleLendingAction();
    }
  };

  const handleLoopingAction = React.useCallback(async () => {
    if (!actionMode || !selectedBank || (!amount && !repayAmount)) {
      return;
    }

    if (
      !(
        actionQuote &&
        loopingAmounts?.borrowAmount &&
        loopingAmounts?.actualDepositAmount &&
        selectedRepayBank &&
        connection &&
        wallet
      )
    ) {
      return;
    }
    setIsLoading(true);

    const params = {
      mfiClient,
      actionType: actionMode,
      bank: selectedBank,
      amount,
      nativeSolBalance,
      marginfiAccount: selectedAccount,
      walletContextState,
      loopingOptions: {
        loopingQuote: actionQuote,
        loopingTxn: actionTxns.actionTxn,
        borrowAmount: loopingAmounts?.borrowAmount,
        loopingBank: selectedRepayBank,
        connection,
      },
    } as MarginfiActionParams;

    const txnSig = await executeLoopingAction({
      ...params,
    });

    setIsLoading(false);
    handleCloseDialog && handleCloseDialog();
    setAmountRaw("");

    if (txnSig) {
      setIsActionComplete(true);
      setPreviousTxn({
        type: ActionType.Loop,
        bank: selectedBank as ActiveBankInfo,
        amount: amount,
        lstQuote: lstQuoteMeta || undefined,
        txn: Array.isArray(txnSig) ? txnSig.pop() ?? "" : txnSig!,
        loopingOptions: {
          depositAmount: loopingAmounts?.actualDepositAmount,
          depositBank: selectedBank as ActiveBankInfo,
          borrowAmount: loopingAmounts?.borrowAmount.toNumber(),
          borrowBank: selectedRepayBank as ActiveBankInfo,
          leverage: leverage,
        },
      });
    }
  }, [
    actionMode,
    selectedBank,
    amount,
    repayAmount,
    actionQuote,
    loopingAmounts?.borrowAmount,
    loopingAmounts?.actualDepositAmount,
    selectedRepayBank,
    connection,
    wallet,
    setIsLoading,
    mfiClient,
    nativeSolBalance,
    selectedAccount,
    walletContextState,
    actionTxns.actionTxn,
    handleCloseDialog,
    setAmountRaw,
    setIsActionComplete,
    setPreviousTxn,
    lstQuoteMeta,
    leverage,
  ]);

  const handleLstAction = React.useCallback(async () => {
    if ((!selectedBank && !selectedStakingAccount) || !mfiClient || !lstData) {
      return;
    }

    if (selectedBank && !lstQuoteMeta) {
      return;
    }
    setIsLoading(true);
    const attemptUuid = uuidv4();

    if (selectedBank) {
      capture(`user_${actionMode.toLowerCase()}_initiate`, {
        uuid: attemptUuid,
        tokenSymbol: selectedBank.meta.tokenSymbol,
        tokenName: selectedBank.meta.tokenName,
        amount,
        priorityFee,
      });
    } else {
      capture(`user_${actionMode.toLowerCase()}_initiate`, {
        uuid: attemptUuid,
        tokenSymbol: "SOL",
        tokenName: "Solana",
        amount,
        priorityFee,
      });
    }

    const txnSig = await executeLstAction({
      actionMode,
      marginfiClient: mfiClient,
      amount,
      connection,
      wallet,
      lstData,
      bank: selectedBank,
      nativeSolBalance,
      selectedStakingAccount,
      quoteResponseMeta: lstQuoteMeta as any, // TODO: fix type
      priorityFee,
    });

    console.log("executer loop action");

    setIsLoading(false);
    handleCloseDialog && handleCloseDialog();
    setAmountRaw("");

    if (txnSig) {
      setIsActionComplete(true);
      setPreviousTxn({
        type: ActionType.MintLST,
        bank: selectedBank as ActiveBankInfo,
        amount: amount,
        lstQuote: lstQuoteMeta || undefined,
        txn: txnSig!,
      });
      if (selectedBank) {
        capture(`user_${actionMode.toLowerCase()}`, {
          uuid: attemptUuid,
          tokenSymbol: selectedBank.meta.tokenSymbol,
          tokenName: selectedBank.meta.tokenName,
          amount,
          txn: txnSig!,
          priorityFee,
        });
      } else {
        capture(`user_${actionMode.toLowerCase()}`, {
          uuid: attemptUuid,
          tokenSymbol: "SOL",
          tokenName: "Solana",
          amount,
          txn: txnSig!,
          priorityFee,
        });
      }
    }

    // -------- Refresh state
    try {
      setIsRefreshingStore(true);
      await fetchMrgnlendState();
    } catch (error: any) {
      console.log("Error while reloading state");
      console.log(error);
    }
  }, [
    selectedBank,
    selectedStakingAccount,
    mfiClient,
    lstData,
    lstQuoteMeta,
    setIsLoading,
    actionMode,
    amount,
    connection,
    wallet,
    nativeSolBalance,
    priorityFee,
    handleCloseDialog,
    setAmountRaw,
    setIsActionComplete,
    setPreviousTxn,
    setIsRefreshingStore,
    fetchMrgnlendState,
  ]);

  const handleCreateAccountAction = React.useCallback(async () => {
    const account = await createAccountAction({ marginfiClient: mfiClient, walletContextState, nativeSolBalance });
  }, [mfiClient, walletContextState, nativeSolBalance]);

  const handleLendingAction = React.useCallback(async () => {
    if (!actionMode || !selectedBank || (!amount && !repayAmount)) {
      return;
    }

    const action = async () => {
      const params = {
        mfiClient,
        actionType: actionMode,
        bank: selectedBank,
        amount,
        nativeSolBalance,
        marginfiAccount: selectedAccount,
        walletContextState,
      } as MarginfiActionParams;

      if (actionQuote && repayAmount && selectedRepayBank && connection && wallet) {
        params.repayWithCollatOptions = {
          repayCollatQuote: actionQuote,
          repayCollatTxn: actionTxns.actionTxn,
          bundleTipTxn: actionTxns.bundleTipTxn,
          withdrawAmount: repayAmount,
          depositBank: selectedRepayBank,
          connection,
        };
      }

      executeLendingActionCb(params);
    };

    if (
      actionMode === ActionType.Deposit &&
      (selectedBank.meta.tokenSymbol === "SOL" || selectedBank.meta.tokenSymbol === "stSOL") &&
      !hasLSTDialogShown.includes(selectedBank.meta.tokenSymbol as LSTDialogVariants)
    ) {
      setHasLSTDialogShown((prev) => [...prev, selectedBank.meta.tokenSymbol as LSTDialogVariants]);
      setLSTDialogVariant(selectedBank.meta.tokenSymbol as LSTDialogVariants);
      setIsLSTDialogOpen(true);
      setLSTDialogCallback(() => action);

      return;
    }

    await action();

    if (
      actionMode === ActionType.Withdraw &&
      (selectedBank.meta.tokenSymbol === "SOL" || selectedBank.meta.tokenSymbol === "stSOL") &&
      !hasLSTDialogShown.includes(selectedBank.meta.tokenSymbol as LSTDialogVariants)
    ) {
      setHasLSTDialogShown((prev) => [...prev, selectedBank.meta.tokenSymbol as LSTDialogVariants]);
      setLSTDialogVariant(selectedBank.meta.tokenSymbol as LSTDialogVariants);
      return;
    }
  }, [
    actionMode,
    selectedBank,
    amount,
    repayAmount,
    hasLSTDialogShown,
    mfiClient,
    nativeSolBalance,
    selectedAccount,
    walletContextState,
    actionQuote,
    selectedRepayBank,
    connection,
    wallet,
    executeLendingActionCb,
    actionTxns,
  ]);

  if (!isInitialized) {
    return null;
  }

  if (isActionDisabled) {
    return (
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "p-4 md:p-6 bg-background-gray text-white w-full max-w-[480px] rounded-lg relative",
            isDialog && "py-5 border border-background-gray-light/50"
          )}
        >
          Action is temporary disabled. <br /> Visit our socials for more information.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "p-2 md:p-3 bg-background-gray text-white w-full max-w-[480px] rounded-lg relative",
            isDialog && "py-5 border border-background-gray-light/50"
          )}
        >
          {showCreateAccount ? (
            <>
              <div className="flex flex-col gap-8 p-2 items-center justify-center text-center">
                <p className="text-muted-foreground">You need to create a marginfi account before you can loop.</p>

                <Button onClick={() => handleCreateAccountAction()}>Create account</Button>
              </div>
            </>
          ) : isSettingsMode ? (
            <ActionBoxSettings
              repayMode={repayMode}
              actionMode={actionMode}
              toggleSettings={setIsSettingsMode}
              setSlippageBps={(value) => setSlippageBps(value * 100)}
              slippageBps={slippageBps / 100}
            />
          ) : (
            <>
              <ActionBoxInput
                isMini={isMini}
                walletAmount={walletAmount}
                amountRaw={amountRaw}
                maxAmount={maxAmount}
                showCloseBalance={showCloseBalance}
                isDialog={isDialog}
              />

              {additionalActionMethods.concat(actionMethods).map(
                (actionMethod, idx) =>
                  actionMethod.description && (
                    <div className="pb-6" key={idx}>
                      <div
                        className={cn(
                          "flex space-x-2 py-2.5 px-3.5 rounded-lg gap-1 text-sm",
                          actionMethod.actionMethod === "INFO" && "bg-info text-info-foreground",
                          (!actionMethod.actionMethod || actionMethod.actionMethod === "WARNING") &&
                            "bg-alert text-alert-foreground",
                          actionMethod.actionMethod === "ERROR" && "bg-[#990000] text-primary"
                        )}
                      >
                        <IconAlertTriangle className="shrink-0 translate-y-0.5" size={16} />
                        <div className="space-y-2.5">
                          <p>{actionMethod.description}</p>
                          {actionMethod.link && (
                            <p>
                              {/* <span className="hidden md:inline">-</span>{" "} */}
                              <Link
                                href={actionMethod.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="border-b border-warning/50 hover:border-transparent transition-colors"
                              >
                                <IconExternalLink size={14} className="inline -translate-y-[1px]" />{" "}
                                {actionMethod.linkText || "Read more"}
                              </Link>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
              )}

              <ActionBoxPreview
                selectedBank={selectedBank}
                selectedStakingAccount={selectedStakingAccount}
                actionMode={actionMode}
                amount={amount}
                slippageBps={slippageBps}
                isEnabled={!isMini}
                loopOptions={
                  actionQuote && loopingAmounts && selectedRepayBank
                    ? {
                        loopingQuote: actionQuote,
                        loopingBank: selectedRepayBank,
                        loopingTxn: actionTxns.actionTxn,
                        bundleTipTxn: actionTxns.bundleTipTxn,
                        borrowAmount: loopingAmounts?.borrowAmount,
                        connection,
                      }
                    : undefined
                }
                repayWithCollatOptions={
                  actionQuote && repayAmount && selectedRepayBank
                    ? {
                        repayCollatQuote: actionQuote,
                        repayCollatTxn: actionTxns.actionTxn,
                        bundleTipTxn: actionTxns.bundleTipTxn,
                        withdrawAmount: repayAmount,
                        depositBank: selectedRepayBank,
                        connection,
                      }
                    : undefined
                }
                addAdditionalsPopup={(actions) => setAdditionalActionMethods(actions)}
              >
                <ActionBoxActions
                  handleAction={() => {
                    showCloseBalance ? handleCloseBalance() : handleAction();
                  }}
                  isLoading={isLoading}
                  showCloseBalance={showCloseBalance ?? false}
                  isEnabled={
                    !additionalActionMethods.concat(actionMethods).filter((value) => value.isEnabled === false).length
                  }
                  actionMode={actionMode}
                />
                <div className="flex justify-between mt-3">
                  {/* {isPreviewVisible ? (
                    <button
                      className={cn(
                        "flex text-muted-foreground text-xs items-center cursor-pointer transition hover:text-primary cursor-pointer"
                      )}
                      onClick={() => setHasPreviewShown(!hasPreviewShown)}
                    >
                      {hasPreviewShown ? (
                        <>
                          <IconEyeClosed size={14} /> <span className="mx-1">Hide details</span>
                        </>
                      ) : (
                        <>
                          <IconEye size={14} /> <span className="mx-1">View details</span>
                        </>
                      )}
                      <IconChevronDown className={cn(hasPreviewShown && "rotate-180")} size={16} />
                    </button>
                  ) : (
                    <div />
                  )} */}

                  <div className="flex justify-end gap-2 ml-auto">
                    <button
                      onClick={() => setIsSettingsMode(true)}
                      className="text-xs gap-1 h-6 px-2 flex items-center rounded-full border border-background-gray-light bg-transparent hover:bg-background-gray-light text-muted-foreground"
                    >
                      Settings <IconSettings size={16} />
                    </button>
                  </div>
                </div>
              </ActionBoxPreview>
            </>
          )}
        </div>
      </div>
      <LSTDialog
        variant={lstDialogVariant}
        open={isLSTDialogOpen}
        onClose={() => {
          setIsLSTDialogOpen(false);
          setLSTDialogVariant(null);
          if (lstDialogCallback) {
            lstDialogCallback();
            setLSTDialogCallback(null);
          }
        }}
      />
    </>
  );
};
