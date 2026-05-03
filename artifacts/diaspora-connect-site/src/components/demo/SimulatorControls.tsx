import { useState } from "react";
import { useTransfer, type Scenario } from "@/context/TransferContext";

const SCENARIOS: { id: Scenario; label: string; desc: string; icon: string; color: string }[] = [
  {
    id: "normal",
    label: "Flux normal",
    desc: "Le destinataire reçoit et retire les fonds immédiatement.",
    icon: "✅",
    color: "#16a34a",
  },
  {
    id: "absent",
    label: "Destinataire absent",
    desc: "Le transfert expire après 7 jours, remboursement automatique.",
    icon: "⏰",
    color: "#f59e0b",
  },
  {
    id: "delay",
    label: "Délai réseau",
    desc: "La blockchain met plus de temps à valider (congestion).",
    icon: "🌐",
    color: "#6366f1",
  },
];

export function SimulatorControls() {
  const { scenario, setScenario, transfer } = useTransfer();
  const [open, setOpen] = useState(false);
  const locked = transfer !== null && transfer.status !== "draft";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all"
        style={{
          background: open ? "#f1f5f9" : "white",
          borderColor: "#e2e8f0",
          color: "#1e293b",
        }}
      >
        <span>🎛️</span>
        <span>Simulateur</span>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ background: "#f0fdf4", color: "#16a34a" }}
        >
          {SCENARIOS.find(s => s.id === scenario)?.label}
        </span>
        <span style={{ color: "#94a3b8" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 w-80 rounded-2xl shadow-xl border z-50 p-4"
          style={{ background: "white", borderColor: "#e2e8f0" }}
        >
          <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#94a3b8" }}>
            Choisir le scénario de test
          </p>
          {locked && (
            <div className="mb-3 px-3 py-2 rounded-xl text-xs" style={{ background: "#fef9c3", color: "#854d0e" }}>
              Réinitialisez le transfert pour changer de scénario.
            </div>
          )}
          <div className="flex flex-col gap-2">
            {SCENARIOS.map(s => (
              <button
                key={s.id}
                type="button"
                disabled={locked}
                onClick={() => { setScenario(s.id); setOpen(false); }}
                className="flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left"
                style={{
                  borderColor: scenario === s.id ? s.color : "#e2e8f0",
                  background: scenario === s.id ? `${s.color}10` : "white",
                  opacity: locked ? 0.5 : 1,
                  cursor: locked ? "not-allowed" : "pointer",
                }}
              >
                <span className="text-xl flex-shrink-0 mt-0.5">{s.icon}</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: "#1e293b" }}>{s.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{s.desc}</p>
                </div>
                {scenario === s.id && (
                  <span className="ml-auto flex-shrink-0 text-xs font-bold" style={{ color: s.color }}>✓</span>
                )}
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t" style={{ borderColor: "#f1f5f9" }}>
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              Le scénario change le comportement du flux sans toucher au code réel.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
