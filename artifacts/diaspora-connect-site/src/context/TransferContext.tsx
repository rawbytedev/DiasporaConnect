import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const TAUX_CFA = 655.96;
const FRAIS_PCT = 0.01;
const WU_FRAIS_PCT = 0.10;
const WU_CHANGE_MARGE = 0.97;

export type Scenario = "normal" | "absent" | "delay";
export type TransferStatus =
  | "draft"
  | "confirming"
  | "processing"
  | "sent"
  | "claimed"
  | "withdrawn"
  | "expired"
  | "refunded";

export interface Transfer {
  id: string;
  amount: number;
  currency: "EUR" | "USD";
  recipientPhone: string;
  senderName: string;
  feePct: number;
  feeAmount: number;
  netAmount: number;
  amountCFA: number;
  savingsCFA: number;
  status: TransferStatus;
  scenario: Scenario;
  txHash: string;
  createdAt: string;
  updatedAt: string;
}

interface TransferContextValue {
  transfer: Transfer | null;
  scenario: Scenario;
  setScenario: (s: Scenario) => void;
  startTransfer: (amount: number, currency: "EUR" | "USD", recipientPhone: string, senderName: string) => void;
  advanceStatus: (next: TransferStatus) => void;
  resetTransfer: () => void;
}

const TransferContext = createContext<TransferContextValue | null>(null);

function makeId() {
  return "DC" + Math.random().toString(36).slice(2, 8).toUpperCase();
}
function makeTxHash() {
  return Array.from({ length: 44 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789"[Math.floor(Math.random() * 58)]).join("");
}

const STORAGE_KEY = "dc_transfer_v1";

export function TransferProvider({ children }: { children: React.ReactNode }) {
  const [transfer, setTransfer] = useState<Transfer | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [scenario, setScenario] = useState<Scenario>("normal");

  useEffect(() => {
    if (transfer) localStorage.setItem(STORAGE_KEY, JSON.stringify(transfer));
    else localStorage.removeItem(STORAGE_KEY);
  }, [transfer]);

  const startTransfer = useCallback((amount: number, currency: "EUR" | "USD", recipientPhone: string, senderName: string) => {
    const feeAmount = amount * FRAIS_PCT;
    const netAmount = amount - feeAmount;
    const amountCFA = Math.round(netAmount * TAUX_CFA);
    const wuReceived = amount * (1 - WU_FRAIS_PCT) * TAUX_CFA * WU_CHANGE_MARGE;
    const savingsCFA = Math.round(amountCFA - wuReceived);
    const now = new Date().toISOString();
    setTransfer({
      id: makeId(),
      amount,
      currency,
      recipientPhone,
      senderName,
      feePct: FRAIS_PCT,
      feeAmount: parseFloat(feeAmount.toFixed(2)),
      netAmount: parseFloat(netAmount.toFixed(2)),
      amountCFA,
      savingsCFA: Math.max(0, savingsCFA),
      status: "confirming",
      scenario,
      txHash: makeTxHash(),
      createdAt: now,
      updatedAt: now,
    });
  }, [scenario]);

  const advanceStatus = useCallback((next: TransferStatus) => {
    setTransfer(t => t ? { ...t, status: next, updatedAt: new Date().toISOString() } : t);
  }, []);

  const resetTransfer = useCallback(() => {
    setTransfer(null);
  }, []);

  return (
    <TransferContext.Provider value={{ transfer, scenario, setScenario, startTransfer, advanceStatus, resetTransfer }}>
      {children}
    </TransferContext.Provider>
  );
}

export function useTransfer() {
  const ctx = useContext(TransferContext);
  if (!ctx) throw new Error("useTransfer must be used inside TransferProvider");
  return ctx;
}
