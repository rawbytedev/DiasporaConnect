import { useState, useEffect } from "react";
import { useTransfer } from "@/context/TransferContext";

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

export function ReceiverFlow({ onReset }: { onReset: () => void }) {
  const { transfer, advanceStatus, scenario } = useTransfer();
  const [countdown, setCountdown] = useState(7);

  useEffect(() => {
    if (scenario === "absent" && transfer?.status === "sent") {
      const interval = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(interval);
            advanceStatus("expired");
            return 0;
          }
          return c - 1;
        });
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [scenario, transfer?.status, advanceStatus]);

  useEffect(() => {
    if (transfer?.status === "expired") {
      const t = setTimeout(() => advanceStatus("refunded"), 3000);
      return () => clearTimeout(t);
    }
  }, [transfer?.status, advanceStatus]);

  if (!transfer) return null;

  const { status, amountCFA, savingsCFA, recipientPhone, id, txHash } = transfer;

  /* ─── État : Sent — réception disponible ─── */
  if (status === "sent") {
    if (scenario === "absent") {
      return (
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl"
              style={{ background: "#fef9c3" }}
            >
              ⏰
            </div>
            <h3 className="text-xl font-bold" style={{ color: "#92400e" }}>Destinataire non disponible</h3>
            <p className="text-sm mt-1" style={{ color: "#a16207" }}>
              Simulation : le destinataire ne répond pas au SMS.
            </p>
          </div>
          <div className="rounded-2xl p-6 text-center" style={{ background: "#fef9c3", border: "2px solid #fde68a" }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#92400e" }}>Expiration du contrat dans</p>
            <div className="text-6xl font-black mb-2" style={{ color: "#d97706" }}>{countdown}</div>
            <p className="text-sm" style={{ color: "#92400e" }}>jours restants (simulé en secondes)</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <p className="text-xs" style={{ color: "#64748b" }}>
              Si les fonds ne sont pas réclamés, le smart contract les restituera automatiquement à l'expéditeur — sans frais.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl"
            style={{ background: "#dcfce7" }}
          >
            📲
          </div>
          <h3 className="text-xl font-bold" style={{ color: "#15803d" }}>Fonds disponibles</h3>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Connecté au : <strong>{recipientPhone}</strong>
          </p>
        </div>

        <div className="rounded-2xl p-6 text-center" style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "2px solid #86efac" }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#64748b" }}>Fonds disponibles</p>
          <div className="text-5xl font-black mb-1" style={{ color: "#15803d" }}>{fmt(amountCFA)}</div>
          <p className="text-sm font-medium" style={{ color: "#94a3b8" }}>CFA</p>
        </div>

        <div className="rounded-2xl p-4" style={{ background: "#f0fdf4", border: "1px solid #86efac" }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#dcfce7" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#15803d" }}>Transfert reçu ✓</p>
              <p className="text-xs mt-0.5" style={{ color: "#4ade80" }}>
                De : <strong style={{ color: "#166534" }}>{transfer.senderName}</strong>, France
              </p>
              <p className="text-xs" style={{ color: "#86efac" }}>Réf : #{id} · Frais : 1 % seulement</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "#a16207" }}>💡 Économie vs Western Union</span>
            <span className="text-sm font-black" style={{ color: "#15803d" }}>+{fmt(savingsCFA)} CFA</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => advanceStatus("claimed")}
          className="w-full py-4 rounded-2xl text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all"
          style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", boxShadow: "0 8px 24px rgba(22,163,74,0.3)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          Retirer sur Mobile Money
        </button>
      </div>
    );
  }

  /* ─── État : Claimed — traitement du retrait ─── */
  if (status === "claimed") {
    return (
      <div className="w-full max-w-md mx-auto text-center space-y-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", boxShadow: "0 0 40px rgba(22,163,74,0.4)" }}
        >
          <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12"/>
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold" style={{ color: "#15803d" }}>Retrait en cours…</h3>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>Transfert vers MTN Money</p>
        </div>
        <RetirementTimer onDone={() => advanceStatus("withdrawn")} />
      </div>
    );
  }

  /* ─── État : Withdrawn — succès ─── */
  if (status === "withdrawn") {
    return (
      <div className="w-full max-w-md mx-auto text-center space-y-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", boxShadow: "0 0 40px rgba(22,163,74,0.4)" }}
        >
          <span className="text-3xl">🎉</span>
        </div>
        <div>
          <h3 className="text-2xl font-bold" style={{ color: "#15803d" }}>Retrait réussi !</h3>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>Fonds disponibles sur votre MTN Money</p>
        </div>

        <div className="rounded-2xl p-5 space-y-3" style={{ background: "#f0fdf4", border: "2px solid #86efac" }}>
          {[
            ["Montant reçu", `${fmt(amountCFA)} CFA`],
            ["Économisé vs Western Union", `+${fmt(savingsCFA)} CFA`],
            ["Frais payés", "1% seulement"],
            ["Hash Solana", txHash.slice(0, 16) + "…"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span style={{ color: "#64748b" }}>{k}</span>
              <span className="font-bold" style={{ color: k.includes("Économisé") ? "#15803d" : "#1e293b" }}>{v}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onReset}
          className="w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all"
          style={{ background: "linear-gradient(135deg, #1e40af, #1d4ed8)", color: "white", boxShadow: "0 8px 24px rgba(30,64,175,0.3)" }}
        >
          ↩ Recommencer une simulation
        </button>
      </div>
    );
  }

  /* ─── État : Expired ─── */
  if (status === "expired") {
    return (
      <div className="w-full max-w-md mx-auto text-center space-y-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl" style={{ background: "#fef2f2" }}>
          ⏰
        </div>
        <div>
          <h3 className="text-xl font-bold" style={{ color: "#dc2626" }}>Transfert expiré</h3>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>Le contrat escrow déclenche le remboursement…</p>
        </div>
        <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "#fef2f2", color: "#b91c1c" }}>
          Remboursement automatique en cours vers l'expéditeur…
        </div>
      </div>
    );
  }

  /* ─── État : Refunded ─── */
  if (status === "refunded") {
    return (
      <div className="w-full max-w-md mx-auto text-center space-y-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl" style={{ background: "#eff6ff" }}>
          ↩️
        </div>
        <div>
          <h3 className="text-xl font-bold" style={{ color: "#1d4ed8" }}>Remboursement effectué</h3>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            {fmt(transfer.amount)} {transfer.currency} restitués automatiquement à {transfer.senderName}.
          </p>
        </div>
        <div className="rounded-2xl p-4 text-left space-y-2" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
          <p className="text-sm font-bold" style={{ color: "#1e40af" }}>Contrat escrow clôturé ✓</p>
          <p className="text-xs" style={{ color: "#3b82f6" }}>
            Le smart contract Solana a libéré automatiquement les fonds vers le wallet de l'expéditeur. Frais réseau : 0.0002$ seulement.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="w-full py-4 rounded-2xl font-bold text-sm tracking-wide"
          style={{ background: "linear-gradient(135deg, #1e40af, #1d4ed8)", color: "white", boxShadow: "0 8px 24px rgba(30,64,175,0.3)" }}
        >
          ↩ Recommencer une simulation
        </button>
      </div>
    );
  }

  return null;
}

function RetirementTimer({ onDone }: { onDone: () => void }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setP(prev => {
        if (prev >= 100) { clearInterval(interval); onDone(); return 100; }
        return prev + 5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
        <div className="h-full rounded-full transition-all duration-100" style={{ width: `${p}%`, background: "linear-gradient(90deg, #16a34a, #22c55e)" }} />
      </div>
    </div>
  );
}
