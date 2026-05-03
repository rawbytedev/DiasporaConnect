import type { TransferStatus } from "@/context/TransferContext";

const STEPS: { id: TransferStatus | "draft"; label: string; icon: string }[] = [
  { id: "draft",      label: "Configurer",  icon: "⚙️" },
  { id: "confirming", label: "Confirmer",   icon: "👁️" },
  { id: "processing", label: "Traitement",  icon: "⛓️" },
  { id: "sent",       label: "Envoyé",      icon: "✈️" },
  { id: "claimed",    label: "Réception",   icon: "🇧🇯" },
  { id: "withdrawn",  label: "Retiré",      icon: "✅" },
];

const EXPIRED_STEPS: typeof STEPS = [
  { id: "draft",      label: "Configurer",  icon: "⚙️" },
  { id: "confirming", label: "Confirmer",   icon: "👁️" },
  { id: "processing", label: "Traitement",  icon: "⛓️" },
  { id: "sent",       label: "Envoyé",      icon: "✈️" },
  { id: "expired",    label: "Expiré",      icon: "⏰" },
  { id: "refunded",   label: "Remboursé",   icon: "↩️" },
];

const ORDER: TransferStatus[] = ["draft", "confirming", "processing", "sent", "claimed", "withdrawn", "expired", "refunded"];

function statusIndex(status: TransferStatus, expired: boolean): number {
  const steps = expired ? EXPIRED_STEPS : STEPS;
  const idx = steps.findIndex(s => s.id === status);
  return idx === -1 ? 0 : idx;
}

export function StepProgress({ status }: { status: TransferStatus }) {
  const isExpiredFlow = status === "expired" || status === "refunded";
  const steps = isExpiredFlow ? EXPIRED_STEPS : STEPS;
  const current = statusIndex(status, isExpiredFlow);

  return (
    <div className="w-full max-w-3xl mx-auto px-2">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 z-0" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-primary z-0 transition-all duration-700"
          style={{ width: `${(current / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const future = i > current;
          return (
            <div key={step.id} className="flex flex-col items-center gap-1.5 z-10 relative">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2"
                style={{
                  background: done ? "#1e40af" : active ? "white" : "#f1f5f9",
                  borderColor: done || active ? "#1e40af" : "#e2e8f0",
                  color: done ? "white" : active ? "#1e40af" : "#94a3b8",
                  boxShadow: active ? "0 0 0 4px rgba(30,64,175,0.15)" : "none",
                }}
              >
                {done ? "✓" : step.icon}
              </div>
              <span
                className="text-xs font-semibold hidden sm:block"
                style={{ color: future ? "#94a3b8" : "#1e293b" }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
