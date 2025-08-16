"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export type PnLRow = {
  id: string;
  title: string; // car year/make/model
  customer?: string;
  status: string;
  price: number;
  cost: number;
  margin: number;
  paid: number;
  collectedProfit: number;
  potentialProfit: number;
  outstanding: number;
};

interface PnLBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "collected" | "potential";
  rows: PnLRow[];
  totalCollected: number;
  totalPotential: number;
}

export default function PnLBreakdownModal({
  isOpen,
  onClose,
  type,
  rows,
  totalCollected,
  totalPotential,
}: PnLBreakdownModalProps) {
  if (!isOpen) return null;

  const sorted = [...rows].sort((a, b) => {
    const aVal = type === "collected" ? a.collectedProfit : a.potentialProfit;
    const bVal = type === "collected" ? b.collectedProfit : b.potentialProfit;
    return bVal - aVal;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <Card className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            {type === "collected"
              ? "Collected P&L Breakdown"
              : "Potential P&L Breakdown"}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-auto">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-muted-foreground">Collected P&L</div>
              <div className="text-lg font-semibold text-green-600">
                {formatCurrency(totalCollected)}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-muted-foreground">Potential P&L</div>
              <div className="text-lg font-semibold text-emerald-600">
                {formatCurrency(totalPotential)}
              </div>
            </div>
          </div>

          <div className="min-w-[780px]">
            <div className="grid grid-cols-10 gap-2 text-xs text-muted-foreground border-b py-2">
              <div className="col-span-3">Job</div>
              <div>Price</div>
              <div>Cost</div>
              <div>Margin</div>
              <div>Paid</div>
              <div>{type === "collected" ? "Collected" : "Potential"}</div>
              <div>Owes</div>
              <div>Status</div>
            </div>
            {sorted.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-10 gap-2 items-center border-b py-2 text-sm"
              >
                <div className="col-span-3">
                  <div className="font-medium">{r.title}</div>
                  {r.customer && (
                    <div className="text-xs text-muted-foreground">
                      {r.customer}
                    </div>
                  )}
                </div>
                <div>{formatCurrency(r.price)}</div>
                <div>{formatCurrency(r.cost)}</div>
                <div>{formatCurrency(r.margin)}</div>
                <div>{formatCurrency(r.paid)}</div>
                <div>
                  {formatCurrency(
                    type === "collected" ? r.collectedProfit : r.potentialProfit
                  )}
                </div>
                <div>{formatCurrency(r.outstanding)}</div>
                <div className="text-xs">{r.status.replace("_", " ")}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

