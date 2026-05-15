import { useState } from "react";
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { api, SendTransferResponse } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const TAUX_CFA = 655.96;
const FEE_PCT = 0.01;

type Step = "form" | "confirm" | "success";

export default function Transfer() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("form");

  const [recipientPhone, setRecipientPhone] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [provider, setProvider] = useState<"mtn" | "moov">("mtn");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SendTransferResponse | null>(null);

  const amount = parseFloat(amountStr) || 0;
  const fee = amount * FEE_PCT;
  const net = amount - fee;
  const cfa = Math.round(net * TAUX_CFA);

  function copyTx() {
    if (result?.tx_hash) {
      navigator.clipboard.writeText(result.tx_hash);
      toast({ title: "Hash copié !" });
    }
  }

  async function handleSend() {
    setLoading(true);
    try {
      const res = await api.sendTransfer(recipientPhone, amount);
      setResult(res);
      setStep("success");
    } catch (err) {
      toast({
        title: "Erreur de transfert",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep("form");
    setRecipientPhone("");
    setAmountStr("");
    setResult(null);
  }

  if (step === "success" && result) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Transfert initié !
          </h1>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Les fonds sont dans l'escrow Solana. Le destinataire a 7 jours pour réclamer.
          </p>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Montant envoyé</span>
              <span className="text-white font-semibold">
                {result.amount_usdt.toFixed(2)} USDT
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Frais (1%)</span>
              <span className="text-red-400 font-semibold">
                -{result.fees_usdt.toFixed(2)} USDT
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Destinataire</span>
              <span className="text-white font-semibold">
                {result.recipient_phone}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Statut</span>
              <span className="text-yellow-300 font-semibold">En attente</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Expire le</span>
              <span className="text-white text-xs">
                {new Date(result.expires_at).toLocaleDateString("fr-FR")}
              </span>
            </div>
            <div className="border-t border-slate-800 pt-4">
              <p className="text-slate-400 text-xs mb-2">Transaction Solana</p>
              <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                <code className="text-primary text-xs font-mono flex-1 truncate">
                  {result.tx_hash}
                </code>
                <button onClick={copyTx} className="text-slate-400 hover:text-white shrink-0">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <a
                  href={`https://explorer.solana.com/tx/${result.tx_hash}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-primary shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full" onClick={reset}>
          Faire un autre transfert
        </Button>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Confirmer l'envoi</h1>
          <p className="text-slate-400 text-sm mt-1">
            Vérifiez les détails avant de confirmer
          </p>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-400">Montant</span>
              <span className="text-white font-bold text-lg">{amount.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Frais DiasporaConnect (1%)</span>
              <span className="text-red-400">-{fee.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Le destinataire reçoit</span>
              <span className="text-green-400 font-semibold">{net.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">≈ en CFA</span>
              <span className="text-white font-semibold">
                {new Intl.NumberFormat("fr-FR").format(cfa)} CFA
              </span>
            </div>
            <div className="border-t border-slate-800 pt-3 flex justify-between text-sm">
              <span className="text-slate-400">Destinataire</span>
              <span className="text-white">{recipientPhone}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Opérateur Mobile Money</span>
              <span className="text-white uppercase">{provider}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-yellow-200 text-xs">
            Les fonds seront bloqués dans un smart contract Solana pendant 7 jours maximum. Si le destinataire ne réclame pas, vous serez remboursé intégralement.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={() => setStep("form")}
          >
            Modifier
          </Button>
          <Button className="flex-1" onClick={handleSend} disabled={loading}>
            {loading ? "Envoi…" : "Confirmer l'envoi"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Envoyer de l'argent</h1>
        <p className="text-slate-400 text-sm mt-1">
          Transfert USDT via Solana · 1% de frais uniquement
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="text-slate-300">Téléphone du destinataire</Label>
          <Input
            type="tel"
            placeholder="+22670987654"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
          />
          <p className="text-slate-500 text-xs">
            Le destinataire doit être inscrit sur DiasporaConnect
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Montant (USDT)</Label>
          <Input
            type="number"
            placeholder="100"
            min="1"
            step="0.01"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12 text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Opérateur Mobile Money</Label>
          <Select value={provider} onValueChange={(v) => setProvider(v as "mtn" | "moov")}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="mtn" className="text-white focus:bg-slate-700">
                MTN Mobile Money
              </SelectItem>
              <SelectItem value="moov" className="text-white focus:bg-slate-700">
                Moov Money
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {amount > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-4 pb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Montant envoyé</span>
                <span className="text-white font-semibold">{amount.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Frais (1%)</span>
                <span className="text-red-400">-{fee.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-2">
                <span className="text-slate-300 font-medium">Le destinataire reçoit</span>
                <div className="text-right">
                  <p className="text-green-400 font-bold">{net.toFixed(2)} USDT</p>
                  <p className="text-slate-400 text-xs">
                    ≈ {new Intl.NumberFormat("fr-FR").format(cfa)} CFA
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          className="w-full h-12 text-base"
          disabled={!recipientPhone || amount <= 0}
          onClick={() => setStep("confirm")}
        >
          <Send className="w-4 h-4 mr-2" />
          Continuer
        </Button>
      </div>
    </div>
  );
}
