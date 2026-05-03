import { useState } from "react";
import { useLocation } from "wouter";
import { useTransfer } from "@/context/TransferContext";
import { StepProgress } from "@/components/demo/StepProgress";
import { SimulatorControls } from "@/components/demo/SimulatorControls";
import { SenderFlow } from "@/components/demo/SenderFlow";
import { ReceiverFlow } from "@/components/demo/ReceiverFlow";

type View = "sender" | "receiver";

const VIEW_STATUS_MAP: Record<string, View> = {
  draft: "sender",
  confirming: "sender",
  processing: "sender",
  sent: "sender",
  claimed: "receiver",
  withdrawn: "receiver",
  expired: "receiver",
  refunded: "receiver",
};

export default function Demo() {
  const [, navigate] = useLocation();
  const { transfer, resetTransfer } = useTransfer();
  const [manualView, setManualView] = useState<View | null>(null);

  const status = transfer?.status ?? "draft";
  const autoView: View = VIEW_STATUS_MAP[status] ?? "sender";
  const activeView = manualView ?? autoView;

  const handleSwitchReceiver = () => setManualView("receiver");
  const handleReset = () => { resetTransfer(); setManualView(null); };

  const senderDone = ["sent", "claimed", "withdrawn", "expired", "refunded"].includes(status);
  const receiverReady = ["sent", "claimed", "withdrawn", "expired", "refunded"].includes(status);

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ background: "white", borderColor: "#e2e8f0" }}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{ color: "#1e40af" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Retour au site
          </button>

          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            <span className="font-bold text-slate-900 hidden sm:block">DiasporaConnect</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#eff6ff", color: "#1e40af" }}>
              Démo interactive
            </span>
          </div>

          <SimulatorControls />
        </div>
      </header>

      {/* Progress bar */}
      <div className="border-b py-6 px-4" style={{ background: "white", borderColor: "#f1f5f9" }}>
        <StepProgress status={status as any} />
      </div>

      {/* View toggle tabs */}
      <div className="border-b" style={{ background: "white", borderColor: "#e2e8f0" }}>
        <div className="container mx-auto px-4">
          <div className="flex gap-1 py-2 max-w-sm">
            <button
              type="button"
              onClick={() => setManualView("sender")}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: activeView === "sender" ? "#eff6ff" : "transparent",
                color: activeView === "sender" ? "#1e40af" : "#64748b",
                border: activeView === "sender" ? "1.5px solid #bfdbfe" : "1.5px solid transparent",
              }}
            >
              🇫🇷 Expéditeur
            </button>
            <button
              type="button"
              disabled={!receiverReady}
              onClick={() => receiverReady && setManualView("receiver")}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: activeView === "receiver" ? "#f0fdf4" : "transparent",
                color: activeView === "receiver" ? "#15803d" : receiverReady ? "#64748b" : "#cbd5e1",
                border: activeView === "receiver" ? "1.5px solid #86efac" : "1.5px solid transparent",
                cursor: receiverReady ? "pointer" : "not-allowed",
              }}
            >
              🇧🇯 Destinataire
              {!receiverReady && <span className="text-xs">🔒</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        {/* Context banner */}
        <div
          className="mb-8 px-4 py-3 rounded-2xl text-sm flex items-start gap-3"
          style={{
            background: activeView === "sender" ? "#eff6ff" : "#f0fdf4",
            border: `1px solid ${activeView === "sender" ? "#bfdbfe" : "#86efac"}`,
          }}
        >
          <span className="text-lg flex-shrink-0">{activeView === "sender" ? "🇫🇷" : "🇧🇯"}</span>
          <div>
            <strong style={{ color: activeView === "sender" ? "#1e40af" : "#15803d" }}>
              {activeView === "sender" ? "Vue Expéditeur — France" : "Vue Destinataire — Bénin"}
            </strong>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
              {activeView === "sender"
                ? "Vous êtes Marie, en France. Vous envoyez de l'argent à un proche au Bénin via DiasporaConnect."
                : "Vous êtes le destinataire au Bénin. Vous avez reçu un SMS et pouvez retirer vos fonds sur Mobile Money."}
            </p>
          </div>
        </div>

        {activeView === "sender" && !senderDone && (
          <SenderFlow onSwitchReceiver={handleSwitchReceiver} />
        )}
        {activeView === "sender" && senderDone && (
          <SenderFlow onSwitchReceiver={handleSwitchReceiver} />
        )}
        {activeView === "receiver" && receiverReady && (
          <ReceiverFlow onReset={handleReset} />
        )}
        {activeView === "receiver" && !receiverReady && (
          <div className="text-center py-20" style={{ color: "#94a3b8" }}>
            <p className="text-4xl mb-4">🔒</p>
            <p className="font-semibold">La vue destinataire sera disponible une fois le transfert envoyé.</p>
          </div>
        )}
      </main>

      {/* Reset button */}
      {transfer && status !== "draft" && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-full text-xs font-bold shadow-lg border transition-all"
            style={{ background: "white", borderColor: "#e2e8f0", color: "#64748b" }}
          >
            🔄 Réinitialiser
          </button>
        </div>
      )}
    </div>
  );
}
