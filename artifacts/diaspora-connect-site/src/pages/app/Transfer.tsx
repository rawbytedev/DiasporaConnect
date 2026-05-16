import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  UserCheck,
  UserX,
  Loader2,
  Clock,
  MessageSquareText,
  Shield,
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
import { fmtNum } from "@/lib/fmt";
import { useLocation } from "wouter";

const TAUX_CFA = 655.96;
const FEE_PCT = 0.01;
const POLL_INTERVAL = 10000;

const KYC_THRESHOLD = 1000;
const CONFIRM_THRESHOLD = 500;

const RECENT_KEY = "dc_recent_recipients";

interface RecentRecipient {
  name: string;
  phone: string;
}

function getRecent(): RecentRecipient[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveRecent(recipients: RecentRecipient[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(recipients.slice(0, 10)));
}

function addRecent(name: string, phone: string) {
  const all = getRecent().filter((r) => r.phone !== phone);
  saveRecent([{ name, phone }, ...all]);
}

type Step = "form" | "confirm" | "confirm_large" | "kyc_required" | "success";
type LookupState = "idle" | "loading" | "found" | "not_found";

export default function Transfer() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("form");

  const [recipientPhone, setRecipientPhone] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [note, setNote] = useState("");
  const [provider, setProvider] = useState<"mtn" | "moov">("mtn");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SendTransferResponse | null>(null);

  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [lookupState, setLookupState] = useState<LookupState>("idle");
  const [recent, setRecent] = useState<RecentRecipient[]>([]);
  const [kycVerified, setKycVerified] = useState<boolean | null>(null);
  const [kycLimit, setKycLimit] = useState(999.99);

  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const amount = parseFloat(amountStr) || 0;
  const fee = amount * FEE_PCT;
  const net = amount - fee;
  const cfa = Math.round(net * TAUX_CFA);

  // Load recent recipients on mount
  useEffect(() => {
    setRecent(getRecent());
    api.getKYCStatus().then((r) => {
      setKycVerified(r.kyc_verified);
      setKycLimit(r.transfer_limit);
    }).catch(() => setKycVerified(false));
  }, []);

  // Recipient phone lookup
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const phone = recipientPhone.trim();
    if (phone.length < 8) {
      setLookupState("idle");
      setRecipientName(null);
      return;
    }
    setLookupState("loading");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.lookupUser(phone);
        setRecipientName(res.name);
        setLookupState("found");
      } catch {
        setRecipientName(null);
        setLookupState("not_found");
      }
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [recipientPhone]);

  // Status polling on success screen
  const startPolling = useCallback((transferId: number) => {
    async function check() {
      try {
        const t = await api.getTransfer(transferId);
        if (t.status !== "pending") {
          setLiveStatus(t.status);
          if (pollRef.current) clearTimeout(pollRef.current);
          return;
        }
        pollRef.current = setTimeout(check, POLL_INTERVAL);
      } catch {
        pollRef.current = setTimeout(check, POLL_INTERVAL);
      }
    }
    if (pollRef.current) clearTimeout(pollRef.current);
    pollRef.current = setTimeout(check, POLL_INTERVAL);
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  function copyTx() {
    if (result?.tx_hash) {
      navigator.clipboard.writeText(result.tx_hash);
      toast({ title: "Hash copié !" });
    }
  }

  async function handleSend() {
    setLoading(true);
    try {
      const res = await api.sendTransfer(recipientPhone, amount, note);
      if (recipientName) addRecent(recipientName, recipientPhone);
      setResult(res);
      setStep("success");
      startPolling(res.transfer_id);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("kyc_required")) {
        setStep("kyc_required");
      } else {
        toast({
          title: "Erreur de transfert",
          description: msg,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep("form");
    setRecipientPhone("");
    setAmountStr("");
    setNote("");
    setResult(null);
    setRecipientName(null);
    setLookupState("idle");
    setLiveStatus(null);
    setRecent(getRecent());
    if (pollRef.current) clearTimeout(pollRef.current);
  }

  function goToConfirm() {
    if (amount >= KYC_THRESHOLD && !kycVerified) {
      setStep("kyc_required");
      return;
    }
    if (amount >= CONFIRM_THRESHOLD) {
      setStep("confirm_large");
      return;
    }
    setStep("confirm");
  }

  // -------------------------------------------------------------------------
  // SUCCESS SCREEN
  // -------------------------------------------------------------------------
  if (step === "success" && result) {
    const isClaimed = liveStatus === "claimed";
    const isRefunded = liveStatus === "refunded";

    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isClaimed ? "bg-green-500/20" : isRefunded ? "bg-slate-700" : "bg-green-500/20"}`}>
            {isClaimed ? (
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            ) : isRefunded ? (
              <Clock className="w-10 h-10 text-slate-400" />
            ) : (
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {isClaimed ? "Transfert réclamé !" : isRefunded ? "Remboursé" : "Transfert initié !"}
          </h1>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            {isClaimed
              ? "Le destinataire a réclamé les fonds."
              : isRefunded
              ? "Le transfert a été remboursé."
              : "Les fonds sont dans l'escrow Solana. Le destinataire a 7 jours pour réclamer."}
          </p>
          {!liveStatus && (
            <div className="flex items-center justify-center gap-2 mt-3 text-slate-500 text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Vérification en direct…</span>
            </div>
          )}
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Montant envoyé</span>
              <span className="text-white font-semibold">
                {fmtNum(result.amount_usdt)} USDT
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Frais (1%)</span>
              <span className="text-red-400 font-semibold">
                -{fmtNum(result.fees_usdt)} USDT
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Destinataire</span>
              <div className="text-right">
                {recipientName && (
                  <p className="text-white font-semibold">{recipientName}</p>
                )}
                <p className="text-slate-400 text-xs">{result.recipient_phone}</p>
              </div>
            </div>
            {result.note && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Message</span>
                <span className="text-white text-xs max-w-[60%] text-right">{result.note}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Statut</span>
              <span className={`font-semibold ${isClaimed ? "text-green-400" : isRefunded ? "text-slate-400" : "text-yellow-300"}`}>
                {isClaimed ? "Réclamé" : isRefunded ? "Remboursé" : "En attente"}
              </span>
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

  // -------------------------------------------------------------------------
  // KYC REQUIRED SCREEN
  // -------------------------------------------------------------------------
  if (step === "kyc_required") {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Vérification requise</h1>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Les transferts de {KYC_THRESHOLD} USDT ou plus nécessitent une vérification d'identité (KYC).
          </p>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6 space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Votre limite actuelle</span>
              <span className="text-white font-semibold">{fmtNum(kycLimit)} USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Montant demandé</span>
              <span className="text-red-400 font-semibold">{fmtNum(amount)} USDT</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-3">
              <span className="text-slate-400">Statut KYC</span>
              <span className="text-red-400 font-semibold">Non vérifié</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={() => setStep("form")}
          >
            Modifier
          </Button>
          <Button
            className="flex-1"
            onClick={() => navigate("/app/settings")}
          >
            <Shield className="w-4 h-4 mr-2" />
            Aller aux paramètres
          </Button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // LARGE AMOUNT CONFIRMATION
  // -------------------------------------------------------------------------
  if (step === "confirm_large") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Confirmer le montant</h1>
          <p className="text-slate-400 text-sm mt-1">
            Ce transfert est supérieur à {CONFIRM_THRESHOLD} USDT. Tapez le montant pour confirmer.
          </p>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-400">Montant</span>
              <span className="text-white font-bold text-lg">{fmtNum(amount)} USDT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Frais DiasporaConnect (1%)</span>
              <span className="text-red-400">-{fmtNum(fee)} USDT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Le destinataire reçoit</span>
              <span className="text-green-400 font-semibold">{fmtNum(net)} USDT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">≈ en CFA</span>
              <span className="text-white font-semibold">
                {new Intl.NumberFormat("fr-FR").format(cfa)} CFA
              </span>
            </div>
            <div className="border-t border-slate-800 pt-3 flex justify-between text-sm">
              <span className="text-slate-400">Destinataire</span>
              <div className="text-right">
                {recipientName && (
                  <p className="text-white font-semibold">{recipientName}</p>
                )}
                <p className="text-slate-400 text-xs">{recipientPhone}</p>
              </div>
            </div>
            {note && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Message</span>
                <span className="text-white text-xs max-w-[60%] text-right">{note}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Opérateur Mobile Money</span>
              <span className="text-white uppercase">{provider}</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Label className="text-slate-300">Confirmez en tapant le montant exact</Label>
          <LargeAmountConfirm
            target={fmtNum(amount)}
            onConfirmed={() => setStep("confirm")}
            onCancel={() => setStep("form")}
            onSend={handleSend}
            sending={loading}
          />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // STANDARD CONFIRMATION
  // -------------------------------------------------------------------------
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
              <span className="text-white font-bold text-lg">{fmtNum(amount)} USDT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Frais DiasporaConnect (1%)</span>
              <span className="text-red-400">-{fmtNum(fee)} USDT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Le destinataire reçoit</span>
              <span className="text-green-400 font-semibold">{fmtNum(net)} USDT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">≈ en CFA</span>
              <span className="text-white font-semibold">
                {new Intl.NumberFormat("fr-FR").format(cfa)} CFA
              </span>
            </div>
            <div className="border-t border-slate-800 pt-3 flex justify-between text-sm">
              <span className="text-slate-400">Destinataire</span>
              <div className="text-right">
                {recipientName && (
                  <p className="text-white font-semibold">{recipientName}</p>
                )}
                <p className="text-slate-400 text-xs">{recipientPhone}</p>
              </div>
            </div>
            {note && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Message</span>
                <span className="text-white text-xs max-w-[60%] text-right">{note}</span>
              </div>
            )}
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

  // -------------------------------------------------------------------------
  // FORM SCREEN
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Envoyer de l'argent</h1>
        <p className="text-slate-400 text-sm mt-1">
          Transfert USDT via Solana · 1% de frais uniquement
        </p>
      </div>

      <div className="space-y-5">
        {/* Recent recipients */}
        {recent.length > 0 && (
          <div className="space-y-2">
            <Label className="text-slate-300 text-xs uppercase tracking-wider">Destinataires récents</Label>
            <div className="flex gap-2 flex-wrap">
              {recent.map((r) => (
                <button
                  key={r.phone}
                  onClick={() => {
                    setRecipientPhone(r.phone);
                    setRecipientName(r.name);
                    setLookupState("found");
                  }}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full px-3 py-1.5 text-xs text-white transition"
                >
                  <UserCheck className="w-3 h-3 text-green-400" />
                  <span className="font-medium">{r.name}</span>
                  <span className="text-slate-500">{r.phone}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-slate-300">Téléphone du destinataire</Label>
          <Input
            type="tel"
            placeholder="+22670987654"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
          />

          {lookupState === "loading" && (
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Recherche du destinataire…</span>
            </div>
          )}

          {lookupState === "found" && recipientName && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
              <UserCheck className="w-4 h-4 text-green-400 shrink-0" />
              <div>
                <p className="text-green-300 text-sm font-semibold">{recipientName}</p>
                <p className="text-green-500/70 text-xs">Compte DiasporaConnect vérifié</p>
              </div>
            </div>
          )}

          {lookupState === "not_found" && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <UserX className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-300 text-xs">Aucun compte trouvé pour ce numéro</p>
            </div>
          )}

          {lookupState === "idle" && (
            <p className="text-slate-500 text-xs">
              Le destinataire doit être inscrit sur DiasporaConnect
            </p>
          )}
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
          {amount >= KYC_THRESHOLD && kycVerified === false && (
            <div className="flex items-center gap-2 text-red-400 text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Les transferts ≥{KYC_THRESHOLD} USDT nécessitent KYC</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300 flex items-center gap-2">
            <MessageSquareText className="w-3.5 h-3.5 text-slate-400" />
            Message au destinataire (optionnel)
          </Label>
          <Input
            placeholder="Par ex. Pour les frais scolaires — Mars"
            value={note}
            onChange={(e) => {
              if (e.target.value.length <= 200) setNote(e.target.value);
            }}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
          />
          <p className="text-slate-600 text-xs text-right">{note.length}/200</p>
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
                <span className="text-white font-semibold">{fmtNum(amount)} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Frais (1%)</span>
                <span className="text-red-400">-{fmtNum(fee)} USDT</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-2">
                <span className="text-slate-300 font-medium">Le destinataire reçoit</span>
                <div className="text-right">
                  <p className="text-green-400 font-bold">{fmtNum(net)} USDT</p>
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
          disabled={!recipientPhone || amount <= 0 || lookupState !== "found"}
          onClick={goToConfirm}
        >
          <Send className="w-4 h-4 mr-2" />
          Continuer
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LargeAmountConfirm — forces the user to type the exact amount to proceed
// ---------------------------------------------------------------------------
function LargeAmountConfirm({
  target,
  onConfirmed,
  onCancel,
  onSend,
  sending,
}: {
  target: string;
  onConfirmed: () => void;
  onCancel: () => void;
  onSend: () => void;
  sending: boolean;
}) {
  const [input, setInput] = useState("");
  const match = input.trim() === target;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          type="text"
          placeholder={`Tapez ${target}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={`bg-slate-800 border text-white h-12 text-center text-lg font-mono ${
            match ? "border-green-500/50" : input ? "border-red-500/50" : "border-slate-700"
          }`}
        />
        {match && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
        )}
      </div>
      {!match && input && (
        <p className="text-red-400 text-xs">Le montant ne correspond pas</p>
      )}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
          onClick={onCancel}
        >
          Annuler
        </Button>
        <Button
          className="flex-1"
          disabled={!match || sending}
          onClick={onSend}
        >
          {sending ? "Envoi…" : "Confirmer l'envoi"}
        </Button>
      </div>
    </div>
  );
}
