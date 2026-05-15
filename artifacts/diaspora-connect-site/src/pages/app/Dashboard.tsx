import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Wallet,
  Send,
  ArrowDownToLine,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { api, BalanceResponse, Transfer } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function statusBadge(status: Transfer["Status"]) {
  const map = {
    pending: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    claimed: "bg-green-500/20 text-green-300 border border-green-500/30",
    refunded: "bg-slate-500/20 text-slate-300 border border-slate-500/30",
  };
  const labels = { pending: "En attente", claimed: "Réclamé", refunded: "Remboursé" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function Dashboard() {
  const { account } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingTransfers, setLoadingTransfers] = useState(true);

  async function loadBalance() {
    setLoadingBalance(true);
    try {
      const b = await api.getBalance();
      setBalance(b);
      if (b.warning) {
        toast({ title: "Avertissement solde", description: b.warning, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Erreur solde", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoadingBalance(false);
    }
  }

  async function loadTransfers() {
    setLoadingTransfers(true);
    try {
      const res = await api.getTransfers();
      setTransfers((res.transfers || []).slice(0, 5));
    } catch {
      setTransfers([]);
    } finally {
      setLoadingTransfers(false);
    }
  }

  useEffect(() => {
    loadBalance();
    loadTransfers();
  }, []);

  const pendingReceived = transfers.filter(
    (t) => t.RecipientID === account?.id && t.Status === "pending"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Bonjour, {account?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary/80 to-primary border-0 text-white shadow-xl">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-primary-foreground/70 text-sm font-medium mb-1">
                Solde USDT disponible
              </p>
              {loadingBalance ? (
                <div className="h-10 w-32 bg-white/20 rounded-lg animate-pulse" />
              ) : (
                <p className="text-4xl font-black tracking-tight">
                  {balance?.balance_usdt?.toFixed(2) ?? "0.00"}
                  <span className="text-xl ml-1 font-semibold opacity-80">USDT</span>
                </p>
              )}
              {balance?.warning && (
                <div className="flex items-center gap-1 mt-2 text-yellow-200 text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  Solde estimé (réseau indisponible)
                </div>
              )}
            </div>
            <button
              onClick={loadBalance}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {balance && (
            <p className="text-primary-foreground/60 text-xs mt-3 font-mono truncate">
              {balance.solana_pubkey}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          className="h-16 flex flex-col gap-1 text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white"
          variant="ghost"
          onClick={() => navigate("/app/transfer")}
        >
          <Send className="w-5 h-5 text-primary" />
          Envoyer
        </Button>
        <Button
          className="h-16 flex flex-col gap-1 text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white"
          variant="ghost"
          onClick={() => navigate("/app/history")}
        >
          <Clock className="w-5 h-5 text-blue-400" />
          Historique
        </Button>
      </div>

      {/* Pending claims */}
      {pendingReceived.length > 0 && (
        <Card className="bg-yellow-500/10 border border-yellow-500/30">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-yellow-300 text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Transferts à réclamer
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 space-y-2">
            {pendingReceived.map((t) => (
              <div
                key={t.ID}
                className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2"
              >
                <div>
                  <p className="text-white text-sm font-semibold">
                    {t.AmountUSDT.toFixed(2)} USDT
                  </p>
                  <p className="text-slate-400 text-xs">
                    Expire{" "}
                    {new Date(t.ExpiresAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => navigate("/app/history")}
                >
                  Réclamer
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent transfers */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Activité récente
            </CardTitle>
            <button
              onClick={() => navigate("/app/history")}
              className="text-primary text-xs hover:underline"
            >
              Tout voir
            </button>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {loadingTransfers ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucune transaction pour l'instant</p>
              <Button
                size="sm"
                className="mt-4"
                onClick={() => navigate("/app/transfer")}
              >
                Faire un premier envoi
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {transfers.map((t) => {
                const isSender = t.SenderID === account?.id;
                return (
                  <div
                    key={t.ID}
                    className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isSender
                            ? "bg-red-500/20"
                            : "bg-green-500/20"
                        }`}
                      >
                        {isSender ? (
                          <ArrowDownToLine className="w-4 h-4 text-red-400 rotate-180" />
                        ) : (
                          <ArrowDownToLine className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {isSender ? "Envoyé" : "Reçu"}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {new Date(t.CreatedAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          isSender ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        {isSender ? "-" : "+"}
                        {t.AmountUSDT.toFixed(2)} USDT
                      </p>
                      {statusBadge(t.Status)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
