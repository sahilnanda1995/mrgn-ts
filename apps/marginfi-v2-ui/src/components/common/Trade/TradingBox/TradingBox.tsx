"use client";

import React from "react";

import { ActionType, ExtendedBankInfo } from "@mrgnlabs/marginfi-v2-ui-state";
import { PublicKey } from "@solana/web3.js";
import capitalize from "lodash/capitalize";

import { cn } from "~/utils/themeUtils";
import { useMrgnlendStore } from "~/store";

import { TokenCombobox } from "../TokenCombobox/TokenCombobox";
import { ActionBoxDialog } from "~/components/common/ActionBox";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { IconPyth } from "~/components/ui/icons";
import { Slider } from "~/components/ui/slider";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

type TradeSide = "long" | "short";

const USDC_PK = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

export const TradingBox = () => {
  const [tradeState, setTradeState] = React.useState<TradeSide>("long");
  const [selectedPool, setSelectedPool] = React.useState<ExtendedBankInfo | null>(null);
  const [amount, setAmount] = React.useState<number>(0);
  const [leverage, setLeverage] = React.useState(1);

  const [extendedBankInfos] = useMrgnlendStore((state) => [state.extendedBankInfos]);

  const usdcBank = React.useMemo(() => {
    const usdc = extendedBankInfos.find((bank) => bank.address.equals(USDC_PK));
    return usdc || null;
  }, [extendedBankInfos]);

  const fullAmount = React.useMemo(() => {
    if (amount === null) return null;
    return amount * leverage;
  }, [amount, leverage]);

  return (
    <Card className="bg-background-gray border-none">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <ToggleGroup
            type="single"
            className="w-full gap-4 bg-transparent"
            defaultValue="long"
            onValueChange={(value) => setTradeState(value as TradeSide)}
          >
            <ToggleGroupItem
              className="w-full border border-accent hover:bg-accent hover:text-primary data-[state=on]:bg-accent data-[state=on]:border-transparent"
              value="long"
              aria-label="Toggle long"
            >
              Long
            </ToggleGroupItem>
            <ToggleGroupItem
              className="w-full border border-accent hover:bg-accent hover:text-primary data-[state=on]:bg-accent data-[state=on]:border-transparent"
              value="short"
              aria-label="Toggle short"
            >
              Short
            </ToggleGroupItem>
          </ToggleGroup>
          <div>
            <div className="flex items-center justify-between">
              <Label>Amount</Label>
              <Button size="sm" variant="link" className="no-underline hover:underline" onClick={() => setAmount(100)}>
                Max
              </Button>
            </div>
            <div className="relative flex gap-4 items-center border border-accent p-2 rounded-lg">
              <TokenCombobox selected={selectedPool} setSelected={setSelectedPool} />
              <Input
                type="number"
                value={amount}
                onChange={(e) => (e.currentTarget ? setAmount(Number(e.currentTarget.value)) : setAmount(0))}
                className="appearance-none border-none text-right focus-visible:ring-0 focus-visible:outline-none"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Size of {tradeState}</Label>
            <div className="relative">
              <Input type="number" value={fullAmount || ""} disabled className="disabled:opacity-100 border-accent" />
              {selectedPool !== null && (
                <span className="absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                  {selectedPool.meta.tokenSymbol}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Leverage</Label>
              <span className="text-sm font-medium text-muted-foreground">{leverage}x</span>
            </div>
            <Slider
              className="w-full"
              min={1}
              max={10}
              step={1}
              value={[leverage]}
              onValueChange={(value: number[]) => setLeverage(value[0])}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-8">
        <div className="gap-1 w-full flex flex-col items-center">
          <Button className={cn("w-full", tradeState === "long" && "bg-success", tradeState === "short" && "bg-error")}>
            {capitalize(tradeState)} {selectedPool !== null ? selectedPool.meta.tokenSymbol : "Pool"}
          </Button>
          <ActionBoxDialog requestedAction={ActionType.Deposit} requestedBank={usdcBank}>
            <Button variant="link" size="sm" className="font-normal text-muted-foreground underline hover:no-underline">
              Desposit Collateral
            </Button>
          </ActionBoxDialog>
        </div>
        <dl className="w-full grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
          <dt>Entry Price</dt>
          <dd className="text-primary text-right">$177.78</dd>
          <dt>Liquidation Price</dt>
          <dd className="text-primary text-right">$166.67</dd>
          <dt>Oracle</dt>
          <dd className="text-primary flex items-center gap-1 ml-auto">
            Pyth <IconPyth size={14} />
          </dd>
          <dt>Available Liquidity</dt>
          <dd className="text-primary text-right">$1,000,000</dd>
        </dl>
      </CardFooter>
    </Card>
  );
};
