import { useState, useEffect } from "react";
import { useTransfer } from "@/context/TransferContext";

const TAUX_CFA = 655.96;
const WU_FRAIS = 0.10;
const WU_MARGE = 0.97;

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

/* ─── Step 1 : Configurer ─────────────────────────────────── */
function StepConfigurer() {
  const { startTransfer, scenario } = useTransfer();
  const [amount, setAmount] = useState("200");
  const [currency, setCurrency] = useState<"EUR" | "USD">("EUR");
  const [phone, setPhone] = useState("");
  const [senderName, setSenderName] = useState("");

  const num = parseFloat(amount) || 0;
  const fee = num * 0.01;
  const received = Math.round((num - fee) * TAUX_CFA);
  const wuReceived = Math.round(num * (1 - WU_FRAIS) * TAUX_CFA * WU_MARGE);
  const savings = Math.max(0, received - wuReceived);

  const valid = num > 0 && phone.trim().length >= 8 && senderName.trim().length >= 2;

  return (
    <div className="w-full max-w-md mx-auto space-y-5">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#64748b" }}>
          Votre prénom
        </label>
        <input
          type="text"
          value={senderName}
          onChange={e => setSenderName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 text-sm font-medium outline-none transition-all"
          style={{ borderColor: senderName ? "#1e40af" : "#e2e8f0", color: "#1e293b" }}
          placeholder="Ex : Marie"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#64748b" }}>
          Montant à envoyer
        </label>
        <div className="flex rounded-xl border-2 overflow-hidden" style={{ borderColor: amount ? "#1e40af" : "#e2e8f0" }}>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="flex-1 px-4 py-3 text-2xl font-bold outline-none bg-white"
            style={{ color: "#1e293b" }}
            min="1"
            placeholder="200"
          />
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value as "EUR" | "USD")}
            className="px-4 py-3 text-sm font-bold bg-white border-l-2 outline-none"
            style={{ borderColor: "#e2e8f0", color: "#1e40af" }}
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#64748b" }}>
          Numéro Mobile Money du destinataire
        </label>
        <div className="flex items-center rounded-xl border-2 px-4 py-3 gap-3" style={{ borderColor: phone ? "#1e40af" : "#e2e8f0" }}>
          <span className="text-xl">🇧🇯</span>
          <input
            type="text"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm font-medium"
            style={{ color: "#1e293b" }}
            placeholder="+229 97 00 00 00"
          />
        </div>
        <p className="text-xs mt-1 ml-1" style={{ color: "#94a3b8" }}>MTN Money · MOOV Money</p>
      </div>

      {num > 0 && (
        <div className="rounded-2xl p-4 space-y-2" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div className="flex justify-between text-xs">
            <span style={{ color: "#64748b" }}>Frais DiasporaConnect (1%)</span>
            <span className="font-semibold" style={{ color: "#ef4444" }}>{fee.toFixed(2)} {currency}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: "#64748b" }}>Taux : 1 {currency} = 655,96 CFA</span>
            <span className="font-semibold" style={{ color: "#1e293b" }}>officiel</span>
          </div>
          <div className="h-px" style={{ background: "#e2e8f0" }} />
          <div className="flex justify-between">
            <span className="text-sm font-semibold" style={{ color: "#1e293b" }}>Le destinataire reçoit</span>
            <span className="text-lg font-black" style={{ color: "#1e40af" }}>{fmt(received)} CFA</span>
          </div>
          {savings > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <span className="text-green-600 text-xs font-bold">✓</span>
              <span className="text-xs font-medium" style={{ color: "#15803d" }}>
                +{fmt(savings)} CFA de plus que Western Union
              </span>
            </div>
          )}
        </div>
      )}

      {scenario !== "normal" && (
        <div className="px-3 py-2 rounded-xl text-xs font-medium" style={{ background: "#fef9c3", color: "#854d0e" }}>
          🎛️ Scénario actif : <strong>{scenario === "absent" ? "Destinataire absent" : "Délai réseau"}</strong>
        </div>
      )}

      <button
        type="button"
        disabled={!valid}
        onClick={() => startTransfer(num, currency, phone.trim(), senderName.trim())}
        className="w-full py-4 rounded-2xl text-white font-bold text-sm tracking-wide transition-all"
        style={{
          background: valid ? "linear-gradient(135deg, #1e40af, #1d4ed8)" : "#e2e8f0",
          color: valid ? "white" : "#94a3b8",
          cursor: valid ? "pointer" : "not-allowed",
          boxShadow: valid ? "0 8px 24px rgba(30,64,175,0.3)" : "none",
        }}
      >
        Continuer vers la confirmation →
      </button>
    </div>
  );
}

/* ─── Step 2 : Confirmer ──────────────────────────────────── */
function StepConfirmer() {
  const { transfer, advanceStatus } = useTransfer();
  if (!transfer) return null;

  return (
    <div className="w-full max-w-md mx-auto space-y-5">
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "#e2e8f0" }}>
        <div className="px-5 py-4" style={{ background: "#f8fafc" }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#64748b" }}>Récapitulatif du transfert</p>
        </div>
        {[
          ["Expéditeur", transfer.senderName + " (France)"],
          ["Destinataire", transfer.recipientPhone],
          ["Montant envoyé", `${transfer.amount} ${transfer.currency}`],
          ["Frais (1%)", `${transfer.feeAmount} ${transfer.currency}`],
          ["Taux de change", `1 ${transfer.currency} = 655,96 CFA`],
          ["Coûts cachés", "Aucun ✓"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between items-center px-5 py-3 border-t" style={{ borderColor: "#f1f5f9" }}>
            <span className="text-sm" style={{ color: "#64748b" }}>{k}</span>
            <span className="text-sm font-semibold" style={{ color: "#1e293b" }}>{v}</span>
          </div>
        ))}
        <div className="flex justify-between items-center px-5 py-4 border-t" style={{ borderColor: "#e2e8f0", background: "#eff6ff" }}>
          <span className="text-sm font-bold" style={{ color: "#1e40af" }}>Le destinataire reçoit</span>
          <span className="text-xl font-black" style={{ color: "#1e40af" }}>
            {new Intl.NumberFormat("fr-FR").format(transfer.amountCFA)} CFA
          </span>
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: "#f0fdf4", border: "1px solid #86efac" }}>
        <p className="text-xs font-bold mb-2" style={{ color: "#15803d" }}>🔐 Sécurité blockchain</p>
        <p className="text-xs" style={{ color: "#166534" }}>
          Les fonds seront verrouillés dans un smart contract Solana (PDA escrow). Le destinataire a 7 jours pour les réclamer. En cas de non-réclamation, remboursement automatique.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => advanceStatus("draft")}
          className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-all"
          style={{ borderColor: "#e2e8f0", color: "#64748b", background: "white" }}
        >
          ← Modifier
        </button>
        <button
          type="button"
          onClick={() => advanceStatus("processing")}
          className="flex-[2] py-4 rounded-2xl text-white font-bold text-sm tracking-wide transition-all"
          style={{ background: "linear-gradient(135deg, #1e40af, #1d4ed8)", boxShadow: "0 8px 24px rgba(30,64,175,0.3)" }}
        >
          Confirmer et envoyer →
        </button>
      </div>
    </div>
  );
}

/* ─── Step 3 : Traitement ─────────────────────────────────── */
function StepTraitement() {
  const { transfer, advanceStatus, scenario } = useTransfer();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const delay = scenario === "delay" ? 8000 : 3000;

  const phases = [
    "Initialisation du smart contract…",
    "Verrouillage des fonds en escrow…",
    "Validation par le réseau Solana…",
    "Confirmation de la transaction…",
    "Transfert validé ✓",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + (100 / (delay / 100));
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [delay]);

  useEffect(() => {
    setPhase(Math.min(4, Math.floor(progress / 25)));
  }, [progress]);

  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(() => advanceStatus("sent"), 600);
      return () => clearTimeout(t);
    }
  }, [progress, advanceStatus]);

  if (!transfer) return null;

  return (
    <div className="w-full max-w-md mx-auto text-center space-y-8">
      <div>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "linear-gradient(135deg, #1e40af, #1d4ed8)", boxShadow: "0 0 40px rgba(30,64,175,0.4)" }}
        >
          <svg className="animate-spin" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h3 className="text-xl font-bold" style={{ color: "#1e293b" }}>Transaction en cours…</h3>
        <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Réseau Solana · ~400ms finality</p>
      </div>

      <div className="space-y-3">
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, #1e40af, #1d4ed8, #6366f1)" }}
          />
        </div>
        <p className="text-sm font-medium" style={{ color: "#1e40af" }}>{phases[phase]}</p>
      </div>

      <div className="rounded-2xl p-4 text-left" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#94a3b8" }}>Hash de transaction</p>
        <p className="text-xs font-mono break-all" style={{ color: "#64748b" }}>{transfer.txHash}</p>
        <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>Montant : <strong style={{ color: "#1e293b" }}>{new Intl.NumberFormat("fr-FR").format(transfer.amountCFA)} CFA</strong></p>
      </div>

      {scenario === "delay" && (
        <div className="px-4 py-3 rounded-xl text-xs" style={{ background: "#fef9c3", color: "#854d0e" }}>
          🌐 Scénario délai réseau simulé — traitement plus lent qu'habituellement.
        </div>
      )}
    </div>
  );
}

/* ─── Step 4 : Envoyé ─────────────────────────────────────── */
function StepEnvoye({ onSwitchReceiver }: { onSwitchReceiver: () => void }) {
  const { transfer } = useTransfer();
  if (!transfer) return null;

  return (
    <div className="w-full max-w-md mx-auto text-center space-y-6">
      <div>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", boxShadow: "0 0 40px rgba(22,163,74,0.4)" }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h3 className="text-2xl font-bold" style={{ color: "#15803d" }}>Transfert envoyé !</h3>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>
          {transfer.senderName}, votre transfert est verrouillé en escrow sécurisé.
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "#e2e8f0" }}>
        {[
          ["Référence", `#${transfer.id}`],
          ["Montant envoyé", `${transfer.amount} ${transfer.currency}`],
          ["Le destinataire reçoit", `${new Intl.NumberFormat("fr-FR").format(transfer.amountCFA)} CFA`],
          ["Économisé vs WU", `+${new Intl.NumberFormat("fr-FR").format(transfer.savingsCFA)} CFA`],
          ["Délai de réception", "< 2 minutes"],
          ["Expiration escrow", "7 jours"],
        ].map(([k, v], i) => (
          <div
            key={k}
            className="flex justify-between items-center px-5 py-3"
            style={{ borderBottom: i < 5 ? "1px solid #f1f5f9" : "none", background: i % 2 === 0 ? "#f8fafc" : "white" }}
          >
            <span className="text-sm" style={{ color: "#64748b" }}>{k}</span>
            <span className="text-sm font-bold" style={{ color: k.includes("Économisé") ? "#15803d" : "#1e293b" }}>{v}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-4" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
        <p className="text-sm font-semibold mb-1" style={{ color: "#1e40af" }}>📲 Notification envoyée</p>
        <p className="text-xs" style={{ color: "#3b82f6" }}>
          Le destinataire au <strong>{transfer.recipientPhone}</strong> a reçu un SMS pour réclamer ses fonds.
        </p>
      </div>

      <button
        type="button"
        onClick={onSwitchReceiver}
        className="w-full py-4 rounded-2xl text-white font-bold text-sm tracking-wide transition-all"
        style={{ background: "linear-gradient(135deg, #14532d, #16a34a)", boxShadow: "0 8px 24px rgba(22,163,74,0.3)" }}
      >
        🇧🇯 Basculer vers la vue destinataire →
      </button>
    </div>
  );
}

/* ─── Composant principal ─────────────────────────────────── */
export function SenderFlow({ onSwitchReceiver }: { onSwitchReceiver: () => void }) {
  const { transfer } = useTransfer();
  const status = transfer?.status ?? "draft";

  return (
    <div className="w-full">
      {status === "draft" && <StepConfigurer />}
      {status === "confirming" && <StepConfirmer />}
      {status === "processing" && <StepTraitement />}
      {status === "sent" && <StepEnvoye onSwitchReceiver={onSwitchReceiver} />}
      {(status === "claimed" || status === "withdrawn" || status === "expired" || status === "refunded") && (
        <StepEnvoye onSwitchReceiver={onSwitchReceiver} />
      )}
    </div>
  );
}
