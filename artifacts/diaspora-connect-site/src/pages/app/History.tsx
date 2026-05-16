import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  ArrowDownToLine,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Copy,
  ExternalLink,
  MessageSquareText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, Transfer } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fmtNum } from "@/lib/fmt";

function StatusIcon({ status }: { status: Transfer["status"] }) {
  if (status === "pending") return <Clock className="w-4 h-4 text-yellow-400" />;
  if (status === "claimed") return <CheckCircle2 className="w-4 h-4 text-green-400" />;
  return <XCircle className="w-4 h-4 text-slate-400" />;
}

function statusLabel(status: Transfer["status"]) {
  return { pending: "En attente", claimed: "Réclamé", refunded: "Remboursé" }[status];
}

function ExpiryBar({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState("");
  const [pct, setPct] = useState(100);
  const expired = new Date(expiresAt) < new Date();

  const update = useCallback(() => {
    const now = new Date().getTime();
    const end = new Date(expiresAt).getTime();
    const start = end - 7 * 24 * 60 * 60 * 1000;
    const total = end - start;
    const left = end - now;

    if (left <= 0) {
      setRemaining("Expiré");
      setPct(0);
      return;
    }

    const days = Math.floor(left / (1000 * 60 * 60 * 24));
    const hours = Math.floor((left % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) setRemaining(`${days}j ${hours}h restantes`);
    else if (hours > 0) setRemaining(`${hours}h ${mins}m restantes`);
    else setRemaining(`${mins}m restantes`);

    setPct(Math.max(0, Math.min(100, (left / total) * 100)));
  }, [expiresAt]);

  useEffect(() => {
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [update]);

  if (expired) {
    return (
      <div className="mt-2">
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 rounded-full" style={{ width: "0%" }} />
        </div>
        <p className="text-red-400 text-xs mt-1">Expiré</p>
      </div>
    );
  }

  const colorClass = pct > 50 ? "bg-green-500" : pct > 20 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="mt-2">
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-slate-500 text-xs mt-1">{remaining}</p>
    </div>
  );
}

interface DetailModalProps {
  transfer: Transfer;
  accountId: number;
  onClose: () => void;
  onAction: () => void;
}

function DetailModal({ transfer, accountId, onClose, onAction }: DetailModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isSender = transfer.sender_id === accountId;
  const isRecipient = transfer.recipient_id === accountId;
  const expired = new Date(transfer.expires_at) < new Date();

  async function claim() {
    setLoading(true);
    try {
      await api.claimTransfer(transfer.id);
      toast({ title: "Transfert réclamé !" });
      onAction();
    } catch (err) {
      toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function refund() {
    setLoading(true);
    try {
      await api.refundTransfer(transfer.id);
      toast({ title: "Remboursement initié !" });
      onAction();
    } catch (err) {
      toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Transfert #{transfer.id}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">×</button>
        </div>

        <div className="space-y-3 text-sm">
          {isSender ? (
            <>
              <div className="flex justify-between">
                <span className="text-slate-400">Montant total débité</span>
                <span className="text-white font-bold">{fmtNum(transfer.amount_usdt + transfer.fees_usdt)} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dont frais (1%)</span>
                <span className="text-red-400">−{fmtNum(transfer.fees_usdt)} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reçu par le destinataire</span>
                <span className="text-slate-300">{fmtNum(transfer.amount_usdt)} USDT</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between">
              <span className="text-slate-400">Montant reçu</span>
              <span className="text-white font-bold">{fmtNum(transfer.amount_usdt)} USDT</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">Statut</span>
            <span className="text-white">{statusLabel(transfer.status)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Rôle</span>
            <span className="text-white">{isSender ? "Expéditeur" : "Destinataire"}</span>
          </div>
          {transfer.note && (
            <div className="bg-slate-800/60 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <MessageSquareText className="w-3 h-3" />
                Message
              </div>
              <p className="text-white text-sm">{transfer.note}</p>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">Créé le</span>
            <span className="text-white">{new Date(transfer.created_at).toLocaleString("fr-FR")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Expire le</span>
            <span className={expired ? "text-red-400" : "text-white"}>
              {new Date(transfer.expires_at).toLocaleDateString("fr-FR")}
              {expired && " (expiré)"}
            </span>
          </div>
          {transfer.status === "pending" && (
            <div>
              <span className="text-slate-400">Temps restant</span>
              <ExpiryBar expiresAt={transfer.expires_at} />
            </div>
          )}
          {transfer.claimed_at && (
            <div className="flex justify-between">
              <span className="text-slate-400">Réclamé le</span>
              <span className="text-green-400">{new Date(transfer.claimed_at).toLocaleString("fr-FR")}</span>
            </div>
          )}
          <div className="border-t border-slate-800 pt-3">
            <p className="text-slate-400 text-xs mb-2">TX Hash</p>
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
              <code className="text-primary text-xs font-mono flex-1 truncate">
                {transfer.solana_tx_hash}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(transfer.solana_tx_hash); toast({ title: "Copié !" }); }}
                className="text-slate-400 hover:text-white"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <a
                href={`https://explorer.solana.com/tx/${transfer.solana_tx_hash}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-primary"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {transfer.status === "pending" && isRecipient && (
          <Button className="w-full" onClick={claim} disabled={loading}>
            {loading ? "Traitement…" : "Réclamer ce transfert"}
          </Button>
        )}
        {transfer.status === "pending" && isSender && expired && (
          <Button variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={refund} disabled={loading}>
            {loading ? "Traitement…" : "Demander un remboursement"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function History() {
  const { account } = useAuth();
  const { toast } = useToast();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Transfer | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (direction !== "all") params.direction = direction;
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await api.getTransfers(params);
      setTransfers(res.transfers || []);
    } catch (err) {
      toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [direction, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Historique</h1>
          <p className="text-slate-400 text-sm mt-0.5">Tous vos transferts</p>
        </div>
        <button onClick={load} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-9 text-xs">
              <Filter className="w-3 h-3 mr-1 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white focus:bg-slate-700 text-xs">Tous</SelectItem>
              <SelectItem value="sent" className="text-white focus:bg-slate-700 text-xs">Envoyés</SelectItem>
              <SelectItem value="received" className="text-white focus:bg-slate-700 text-xs">Reçus</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white focus:bg-slate-700 text-xs">Tous statuts</SelectItem>
              <SelectItem value="pending" className="text-white focus:bg-slate-700 text-xs">En attente</SelectItem>
              <SelectItem value="claimed" className="text-white focus:bg-slate-700 text-xs">Réclamés</SelectItem>
              <SelectItem value="refunded" className="text-white focus:bg-slate-700 text-xs">Remboursés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : transfers.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-12 text-center">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Aucun transfert trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {transfers.map((t) => {
            const isSender = t.sender_id === account?.id;
            return (
              <button
                key={t.id}
                className="w-full text-left bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3 transition"
                onClick={() => setSelected(t)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSender ? "bg-red-500/15" : "bg-green-500/15"}`}>
                  <ArrowDownToLine className={`w-4 h-4 ${isSender ? "text-red-400 rotate-180" : "text-green-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-semibold">
                      {isSender ? "Envoyé" : "Reçu"}
                    </p>
                    <StatusIcon status={t.status} />
                    {t.note && (
                      <MessageSquareText className="w-3 h-3 text-slate-500" />
                    )}
                  </div>
                  <p className="text-slate-500 text-xs truncate">
                    {new Date(t.created_at).toLocaleDateString("fr-FR")} · #{t.id}
                  </p>
                  {t.status === "pending" && (
                    <ExpiryBar expiresAt={t.expires_at} />
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${isSender ? "text-red-400" : "text-green-400"}`}>
                    {isSender ? "-" : "+"}{fmtNum(isSender ? t.amount_usdt + t.fees_usdt : t.amount_usdt)} USDT
                  </p>
                  <p className="text-slate-500 text-xs">{statusLabel(t.status)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && account && (
        <DetailModal
          transfer={selected}
          accountId={account.id}
          onClose={() => setSelected(null)}
          onAction={() => { setSelected(null); load(); }}
        />
      )}
    </div>
  );
}
