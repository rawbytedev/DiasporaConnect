import { useState } from "react";

const TAUX_CFA = 655.96;
const FRAIS_PCT = 0.01;

export function EnvoiDiaspora() {
  const [montant, setMontant] = useState<string>("100");
  const [destinataire, setDestinataire] = useState<string>("");
  const [devise, setDevise] = useState<string>("EUR");

  const montantNum = parseFloat(montant) || 0;
  const frais = montantNum * FRAIS_PCT;
  const fraisAffiche = frais.toFixed(2);
  const montantNet = montantNum - frais;
  const recu = Math.round(montantNet * TAUX_CFA);
  const recuAffiche = new Intl.NumberFormat("fr-FR").format(recu);
  const economie = Math.round(montantNum * 0.09 * TAUX_CFA);
  const economieAffiche = new Intl.NumberFormat("fr-FR").format(economie);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)" }}>
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
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>Envoi sécurisé vers le Bénin</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-6 shadow-2xl" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)" }}>
          {/* Badge économie */}
          <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-xl" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <span className="text-green-600 font-bold text-xs">✓</span>
            <span className="text-xs font-medium" style={{ color: "#15803d" }}>
              Économisez <strong>8,5 %</strong> vs Western Union
            </span>
          </div>

          {/* Montant */}
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#64748b" }}>
              Montant à envoyer
            </label>
            <div className="flex rounded-2xl overflow-hidden border-2 transition-all" style={{ borderColor: "#e2e8f0", background: "#f8fafc" }}>
              <input
                type="number"
                value={montant}
                onChange={e => setMontant(e.target.value)}
                className="flex-1 px-4 py-3 text-2xl font-bold bg-transparent outline-none"
                style={{ color: "#1e293b" }}
                placeholder="100"
                min="1"
              />
              <select
                value={devise}
                onChange={e => setDevise(e.target.value)}
                className="px-3 py-3 text-sm font-semibold bg-transparent outline-none border-l-2"
                style={{ borderColor: "#e2e8f0", color: "#1e40af" }}
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {/* Destinataire */}
          <div className="mb-5">
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#64748b" }}>
              Numéro Mobile Money
            </label>
            <div className="flex items-center rounded-2xl border-2 px-4 py-3 gap-3 transition-all" style={{ borderColor: "#e2e8f0", background: "#f8fafc" }}>
              <span className="text-lg">🇧🇯</span>
              <input
                type="text"
                value={destinataire}
                onChange={e => setDestinataire(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm font-medium"
                style={{ color: "#1e293b" }}
                placeholder="+229 97 00 00 00"
              />
            </div>
            <p className="text-xs mt-1.5 ml-1" style={{ color: "#94a3b8" }}>MTN Money · MOOV Money</p>
          </div>

          {/* Calcul temps réel */}
          <div className="rounded-2xl p-4 mb-5" style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs" style={{ color: "#64748b" }}>Frais de transfert</span>
              <span className="text-xs font-semibold" style={{ color: "#ef4444" }}>
                {fraisAffiche} {devise} <span style={{ color: "#94a3b8" }}>(1 %)</span>
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs" style={{ color: "#64748b" }}>Taux de change</span>
              <span className="text-xs font-semibold" style={{ color: "#1e293b" }}>1 {devise} = 655,96 CFA</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs" style={{ color: "#64748b" }}>Vs Western Union</span>
              <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>
                + {economieAffiche} CFA économisés
              </span>
            </div>
            <div className="h-px mb-3" style={{ background: "#cbd5e1" }} />
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold" style={{ color: "#1e293b" }}>Le destinataire reçoit</span>
              <span className="text-xl font-bold" style={{ color: "#1e40af" }}>{recuAffiche} CFA</span>
            </div>
          </div>

          {/* CTA */}
          <button
            className="w-full py-4 rounded-2xl text-white font-bold text-sm tracking-wide shadow-lg transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #1e40af, #1d4ed8)", boxShadow: "0 8px 24px rgba(30,64,175,0.35)" }}
          >
            Envoyer maintenant →
          </button>

          {/* Sécurité */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span className="text-xs" style={{ color: "#94a3b8" }}>Transaction sécurisée par blockchain</span>
          </div>
        </div>

        {/* Steps */}
        <div className="flex justify-between mt-5 px-2">
          {["Montant", "Vérif.", "Envoi"].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: i === 0 ? "white" : "rgba(255,255,255,0.25)",
                    color: i === 0 ? "#1e40af" : "rgba(255,255,255,0.7)"
                  }}
                >
                  {i + 1}
                </div>
                <span className="text-xs" style={{ color: i === 0 ? "white" : "rgba(255,255,255,0.5)" }}>{step}</span>
              </div>
              {i < 2 && <span style={{ color: "rgba(255,255,255,0.3)" }}>→</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
