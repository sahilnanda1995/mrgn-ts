import { create, StateCreator } from "zustand";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  ExtendedBankInfo,
  makeExtendedBankInfo,
  fetchTokenAccounts,
  TokenAccountMap,
  makeBankInfo,
  makeLendingPosition,
  computeAccountSummary,
  DEFAULT_ACCOUNT_SUMMARY,
  AccountSummary,
} from "@mrgnlabs/marginfi-v2-ui-state";
import {
  MarginfiClient,
  getConfig,
  Bank,
  OraclePrice,
  MarginfiAccountWrapper,
  MintData,
} from "@mrgnlabs/marginfi-client-v2";
import {
  Wallet,
  TokenMetadata,
  loadTokenMetadatas,
  loadBankMetadatas,
  getValueInsensitive,
} from "@mrgnlabs/mrgn-common";

import { TRADE_GROUPS_MAP, TOKEN_METADATA_MAP, BANK_METADATA_MAP } from "~/config/trade";

type TradeGroupsCache = {
  [group: string]: [string, string];
};

type TradeStoreState = {
  // keep track of store state
  initialized: boolean;
  isRefreshingStore: boolean;

  // cache groups json store
  groupsCache: TradeGroupsCache;

  // user token account map
  tokenAccountMap: TokenAccountMap | null;

  // array of marginfi groups
  groups: PublicKey[];

  // array of extended token bank objects
  banks: ExtendedBankInfo[];

  // array of banks filtered by search query
  filteredBanks: ExtendedBankInfo[];

  // array of collateral usdc banks
  collateralBanks: {
    [token: string]: ExtendedBankInfo;
  };

  // array of all banks including collateral usdc banks
  banksIncludingUSDC: ExtendedBankInfo[];

  // marginfi client, initialized when viewing an active group
  marginfiClient: MarginfiClient | null;

  // active group, currently being viewed / traded
  activeGroup: {
    token: ExtendedBankInfo;
    usdc: ExtendedBankInfo;
  } | null;

  // array of marginfi accounts
  marginfiAccounts: {
    [group: string]: MarginfiAccountWrapper;
  } | null;

  // currently selected marginfi account
  selectedAccount: MarginfiAccountWrapper | null;

  accountSummary: AccountSummary;

  // user native sol balance
  nativeSolBalance: number;

  /* Actions */
  // fetch groups / banks
  fetchTradeState: ({ connection, wallet }: { connection: Connection; wallet: Wallet }) => void;

  // set active banks and initialize marginfi client
  setActiveBank: ({
    bankPk,
    connection,
    wallet,
  }: {
    bankPk: PublicKey;
    connection: Connection;
    wallet: Wallet;
  }) => void;

  setIsRefreshingStore: (isRefreshing: boolean) => void;
  resetActiveGroup: () => void;
  searchBanks: (searchQuery: string) => void;
  resetFilteredBanks: () => void;
};

const { programId } = getConfig();

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

function createTradeStore() {
  return create<TradeStoreState>(stateCreator);
}

const stateCreator: StateCreator<TradeStoreState, [], []> = (set, get) => ({
  initialized: false,
  isRefreshingStore: false,
  groupsCache: {},
  groups: [],
  banks: [],
  filteredBanks: [],
  banksIncludingUSDC: [],
  collateralBanks: {},
  marginfiClient: null,
  activeGroup: null,
  marginfiAccounts: null,
  selectedAccount: null,
  accountSummary: DEFAULT_ACCOUNT_SUMMARY,
  nativeSolBalance: 0,
  tokenAccountMap: null,

  setIsRefreshingStore: (isRefreshing) => {
    set((state) => {
      return {
        ...state,
        isRefreshingStore: isRefreshing,
      };
    });
  },

  fetchTradeState: async ({ connection, wallet }) => {
    try {
      // fetch groups

      const result = await fetchBanksAndTradeGroups(wallet, connection);

      if (!result) throw new Error("Error fetching banks & groups");

      const activeGroup = get().activeGroup;

      if (activeGroup) {
        get().setActiveBank({
          bankPk: activeGroup.token.info.rawBank.address,
          connection,
          wallet,
        });

        const tokenBank = result.allBanks.find((bank) => bank.address.equals(activeGroup.token.info.rawBank.address));
        const collateralBank = result.allBanks.find((bank) =>
          bank.address.equals(activeGroup.usdc.info.rawBank.address)
        );

        if (tokenBank && collateralBank) {
          set((state) => {
            return {
              ...state,
              activeGroup: {
                token: tokenBank,
                usdc: collateralBank,
              },
            };
          });
        }
      } else {
        set((state) => {
          return {
            ...state,
            initialized: true,
            groupsCache: result.tradeGroups,
            groups: result.groups,
            banks: result.tokenBanks,
            banksIncludingUSDC: result.allBanks,
            collateralBanks: result.collateralBanks,
            nativeSolBalance: result.nativeSolBalance,
            tokenAccountMap: result.tokenAccountMap,
            marginfiAccounts: result.marginfiAccounts,
          };
        });
      }
    } catch (error) {
      console.error(error);
    }
  },

  setActiveBank: async ({ bankPk, wallet, connection }) => {
    try {
      const bpk = new PublicKey(bankPk);
      let bank = get().banksIncludingUSDC.find((bank) => new PublicKey(bank.address).equals(bpk));

      if (!bank) {
        const result = await fetchBanksAndTradeGroups(wallet, connection);

        if (!result) throw new Error("Error fetching banks & groups");

        set((state) => {
          return {
            ...state,
            initialized: true,
            groupsCache: result.tradeGroups,
            groups: result.groups,
            banks: result.tokenBanks,
            filteredBanks: [],
            banksIncludingUSDC: result.allBanks,
            collateralBanks: result.collateralBanks,
            nativeSolBalance: result.nativeSolBalance,
            tokenAccountMap: result.tokenAccountMap,
          };
        });

        bank = result.allBanks.find((bank) => new PublicKey(bank.address).equals(bpk));

        if (!bank) return;
      }

      const collateralBank = get().collateralBanks[bank.info.rawBank.address.toBase58()];

      const group = new PublicKey(bank.info.rawBank.group);
      const bankKeys = get().groupsCache[group.toBase58()].map((bank) => new PublicKey(bank));
      const marginfiClient = await MarginfiClient.fetch(
        {
          environment: "production",
          cluster: "mainnet",
          programId,
          groupPk: group,
        },
        wallet,
        connection,
        {
          preloadedBankAddresses: bankKeys,
        }
      );

      let marginfiAccounts: MarginfiAccountWrapper[] = [];
      let selectedAccount: MarginfiAccountWrapper | null = null;
      let accountSummary: AccountSummary = DEFAULT_ACCOUNT_SUMMARY;
      let updatedTokenBank: ExtendedBankInfo = {
        ...bank,
        isActive: false,
      };
      let updatedCollateralBank: ExtendedBankInfo = {
        ...collateralBank,
        isActive: false,
      };

      if (wallet.publicKey) {
        marginfiAccounts = await marginfiClient.getMarginfiAccountsForAuthority(wallet.publicKey);
        selectedAccount = marginfiAccounts[0];

        // token bank
        const positionRaw = selectedAccount
          ? selectedAccount.activeBalances.find((balance) => balance.bankPk.equals(bank.address))
          : false;

        if (positionRaw) {
          const position = makeLendingPosition(
            positionRaw,
            bank.info.rawBank,
            makeBankInfo(bank.info.rawBank, bank.info.oraclePrice),
            bank.info.oraclePrice,
            selectedAccount
          );

          updatedTokenBank = {
            ...bank,
            position,
            isActive: true,
          };
        }

        const collateralPositionRaw = selectedAccount
          ? selectedAccount.activeBalances.find((balance) => balance.bankPk.equals(collateralBank.info.rawBank.address))
          : false;

        if (collateralPositionRaw) {
          const collateralPosition = makeLendingPosition(
            collateralPositionRaw,
            collateralBank.info.rawBank,
            makeBankInfo(collateralBank.info.rawBank, collateralBank.info.oraclePrice),
            collateralBank.info.oraclePrice,
            selectedAccount
          );

          updatedCollateralBank = {
            ...collateralBank,
            position: collateralPosition,
            isActive: true,
          };
        }

        if (selectedAccount) {
          accountSummary = computeAccountSummary(selectedAccount, [updatedTokenBank, updatedCollateralBank]);
        }
      }

      set((state) => {
        return {
          ...state,
          marginfiClient,
          selectedAccount,
          accountSummary,
          activeGroup: {
            token: updatedTokenBank,
            usdc: updatedCollateralBank,
          },
        };
      });
    } catch (error) {
      console.error(error);
    }
  },

  resetActiveGroup: () => {
    set((state) => {
      return {
        ...state,
        marginfiClient: null,
        selectedAccount: null,
        activeGroup: null,
      };
    });
  },

  searchBanks: (searchQuery: string) => {
    const search = searchQuery.toLowerCase();
    const banks = get().banks;

    const filteredBanks = banks.filter((bank) => {
      if (bank.meta.tokenName.toLowerCase().includes(search) || bank.meta.tokenSymbol.toLowerCase().includes(search)) {
        return true;
      }
      if (search.length >= 4 && bank.address.toBase58().toLowerCase().includes(search)) {
        return true;
      }
      return false;
    });

    set((state) => {
      return {
        ...state,
        filteredBanks,
      };
    });
  },

  resetFilteredBanks: () => {
    set((state) => {
      return {
        ...state,
        filteredBanks: [],
      };
    });
  },
});

export { createTradeStore };
export type { TradeStoreState };

const fetchBanksAndTradeGroups = async (wallet: Wallet, connection: Connection) => {
  const tradeGroups: TradeGroupsCache = await fetch(TRADE_GROUPS_MAP).then((res) => res.json());

  if (!tradeGroups) {
    console.error("Failed to fetch trade groups");
    return;
  }

  const tokenMetadataMap = await loadTokenMetadatas(TOKEN_METADATA_MAP);

  const bankMetadataMap = await loadBankMetadatas(BANK_METADATA_MAP);

  const groups = Object.keys(tradeGroups).map((group) => new PublicKey(group));
  const allBanks: ExtendedBankInfo[] = [];
  const banksWithPriceAndToken: {
    bank: Bank;
    oraclePrice: OraclePrice;
    tokenMetadata: TokenMetadata;
  }[] = [];
  const marginfiAccounts: {
    [group: string]: MarginfiAccountWrapper;
  } = {};
  const mintDatas: Map<string, MintData> = new Map();

  await Promise.all(
    groups.map(async (group) => {
      const bankKeys = tradeGroups[group.toBase58()].map((bank) => new PublicKey(bank));
      const marginfiClient = await MarginfiClient.fetch(
        {
          environment: "production",
          cluster: "mainnet",
          programId,
          groupPk: group,
        },
        wallet,
        connection,
        {
          preloadedBankAddresses: bankKeys,
        }
      );

      for (const [k, v] of marginfiClient.mintDatas) {
        mintDatas.set(k, v);
      }

      const banksIncludingUSDC = Array.from(marginfiClient.banks.values());

      banksIncludingUSDC.forEach((bank) => {
        const oraclePrice = marginfiClient.getOraclePriceByBank(bank.address);
        if (!oraclePrice) {
          return;
        }

        const bankMetadata = bankMetadataMap[bank.address.toBase58()];
        if (bankMetadata === undefined) {
          return;
        }

        try {
          const tokenMetadata = getValueInsensitive(tokenMetadataMap, bankMetadata.tokenSymbol);
          if (!tokenMetadata) {
            return;
          }

          banksWithPriceAndToken.push({ bank, oraclePrice, tokenMetadata });
        } catch (err) {
          console.error("error fetching token metadata: ", err);
        }
      });

      if (wallet.publicKey) {
        const mfiAccounts = await marginfiClient.getMarginfiAccountsForAuthority(wallet.publicKey);
        const mfiAccount = mfiAccounts[0];

        if (mfiAccount) {
          marginfiAccounts[group.toBase58()] = mfiAccount;
        }
      }
    })
  );

  let nativeSolBalance = 0;
  let tokenAccountMap: TokenAccountMap | null = null;
  if (wallet?.publicKey) {
    const [tokenData] = await Promise.all([
      fetchTokenAccounts(
        connection,
        wallet.publicKey,
        banksWithPriceAndToken.map((bank) => ({ mint: bank.bank.mint, mintDecimals: bank.bank.mintDecimals, bankAddress: bank.bank.address })),
        mintDatas
      ),
    ]);

    nativeSolBalance = tokenData.nativeSolBalance;
    tokenAccountMap = tokenData.tokenAccountMap;
  }

  const [extendedBankInfos] = await banksWithPriceAndToken.reduce(
    async (accPromise, { bank, oraclePrice, tokenMetadata }) => {
      const acc = await accPromise;
      let userData;
      if (wallet?.publicKey) {
        const marginfiAccount = marginfiAccounts[bank.group.toBase58()];
        const tokenAccount = tokenAccountMap!.get(bank.mint.toBase58());
        if (!tokenAccount) {
          return acc;
        }
        userData = {
          nativeSolBalance,
          tokenAccount,
          marginfiAccount,
        };
      }
      acc[0].push(makeExtendedBankInfo(tokenMetadata, bank, oraclePrice, undefined, userData));
      return acc;
    },
    Promise.resolve([[]] as [ExtendedBankInfo[]])
  );

  allBanks.push(...extendedBankInfos);

  const collateralBanks: {
    [group: string]: ExtendedBankInfo;
  } = {};

  for (let i = 0; i < allBanks.length - 1; i++) {
    collateralBanks[allBanks[i + 1].info.rawBank.address.toBase58()] = allBanks[i];
  }

  const tokenBanks = allBanks.filter((bank) => !bank.info.rawBank.mint.equals(USDC_MINT));

  return {
    allBanks,
    tokenBanks,
    collateralBanks,
    tradeGroups,
    groups,
    nativeSolBalance,
    tokenAccountMap,
    marginfiAccounts,
  };
};
