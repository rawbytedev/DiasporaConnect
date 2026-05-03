import { useState } from "react";

export function ReceptionBenin() {
  const [retired, setRetired] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const montantCFA = 64_600;
  const montantUSDC = 98.5;
  const economie = 8_500;
  const montantAffiche = new Intl.NumberFormat("fr-FR").format(montantCFA);
  const economieAffiche = new Intl.NumberFormat("fr-FR").format(economie);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)" }}>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 shadow-lg" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">DiasporaConnect</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>Votre portefeuille Mobile Money</p>
        </div>

        {/* Card principale */}
        <div className="rounded-3xl p-6 shadow-2xl mb-3" style={{ background: "rgba(255,255,255,0.95)" }}>

          {/* Solde */}
          <div className="text-center mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#64748b" }}>Fonds disponibles</p>
            <div className="text-5xl font-black mb-1" style={{ color: "#15803d", letterSpacing: "-1px" }}>
              {montantAffiche}
            </div>
            <p className="text-sm font-medium" style={{ color: "#94a3b8" }}>CFA</p>
            <p className="text-xs mt-1" style={{ color: "#cbd5e1" }}>≈ {montantUSDC} USDC reçus</p>
          </div>

          {/* Badge transfert reçu */}
          {!retired && (
            <div className="rounded-2xl p-4 mb-5" style={{ background: "#f0fdf4", border: "1px solid #86efac" }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#dcfce7" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold mb-0.5" style={{ color: "#15803d" }}>Transfert reçu ✓</p>
                  <p className="text-xs" style={{ color: "#4ade80" }}>De : <strong style={{ color: "#166534" }}>Tante Marie</strong>, France</p>
                  <p className="text-xs" style={{ color: "#86efac" }}>15 Avril 2026 · Frais : 1 % seulement</p>
                </div>
              </div>
            </div>
          )}

          {retired && (
            <div className="rounded-2xl p-4 mb-5 text-center" style={{ background: "#eff6ff", border: "1px solid #93c5fd" }}>
              <p className="text-sm font-bold mb-1" style={{ color: "#1d4ed8" }}>✓ Retrait effectué</p>
              <p className="text-xs" style={{ color: "#3b82f6" }}>Fonds envoyés sur votre MTN Money</p>
            </div>
          )}

          {/* Actions */}
          <div className="grid gap-3 mb-5">
            {!retired ? (
              <button
                onClick={() => setRetired(true)}
                className="w-full py-4 rounded-2xl text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", boxShadow: "0 8px 24px rgba(22,163,74,0.35)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                Retirer sur Mobile Money
              </button>
            ) : (
              <button
                className="w-full py-4 rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all"
                style={{ background: "#f1f5f9", color: "#94a3b8", cursor: "default" }}
                disabled
              >
                ✓ Retiré avec succès
              </button>
            )}

            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background: "#f8fafc", color: "#64748b", border: "1.5px solid #e2e8f0" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Historique des transferts
            </button>
          </div>

          {/* Historique */}
          {showHistory && (
            <div className="rounded-2xl overflow-hidden mb-5" style={{ border: "1px solid #e2e8f0" }}>
              {[
                { de: "Tante Marie", montant: "64 600", date: "15 Avr 2026", statut: "reçu" },
                { de: "Papa Koffi", montant: "32 798", date: "02 Mar 2026", statut: "retiré" },
                { de: "Tante Marie", montant: "45 917", date: "10 Jan 2026", statut: "retiré" },
              ].map((t, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center px-4 py-3"
                  style={{ background: i % 2 === 0 ? "#f8fafc" : "white", borderBottom: i < 2 ? "1px solid #f1f5f9" : "none" }}
                >
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#1e293b" }}>{t.de}</p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>{t.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: "#15803d" }}>{t.montant} CFA</p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: t.statut === "reçu" ? "#dcfce7" : "#eff6ff",
                        color: t.statut === "reçu" ? "#15803d" : "#1d4ed8"
                      }}
                    >
                      {t.statut}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Économie */}
          <div className="rounded-2xl p-4" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">💡</span>
              <p className="text-xs font-bold" style={{ color: "#92400e" }}>Économie réalisée</p>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: "#a16207" }}>Vs Western Union sur ce transfert</span>
              <span className="text-sm font-black" style={{ color: "#15803d" }}>+ {economieAffiche} CFA</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "#fde68a" }}>
              <div className="h-full rounded-full" style={{ width: "85%", background: "linear-gradient(90deg, #16a34a, #22c55e)" }} />
            </div>
            <p className="text-xs mt-1.5 text-right" style={{ color: "#a16207" }}>Frais : 1 % vs 10 %</p>
          </div>
        </div>

        {/* Numéro */}
        <div className="text-center">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Connecté au : <strong style={{ color: "rgba(255,255,255,0.8)" }}>+229 97 12 34 56</strong></p>
        </div>
      </div>
    </div>
  );
}
