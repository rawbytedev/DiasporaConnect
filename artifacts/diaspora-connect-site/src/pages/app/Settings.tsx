import { useState } from "react";
import {
  User,
  Phone,
  Shield,
  LogOut,
  Copy,
  ChevronRight,
  CheckCircle2,
  ArrowDownToLine,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useLocation } from "wouter";

type Panel = null | "withdraw" | "kyc";

export default function Settings() {
  const { account, logout, refreshAccount } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [panel, setPanel] = useState<Panel>(null);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawProvider, setWithdrawProvider] = useState<"mtn" | "moov">("mtn");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawDone, setWithdrawDone] = useState(false);

  const [kycName, setKycName] = useState(account?.name || "");
  const [kycIdNumber, setKycIdNumber] = useState("");
  const [kycCountry, setKycCountry] = useState("BJ");
  const [kycLoading, setKycLoading] = useState(false);
  const [kycDone, setKycDone] = useState(false);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast({ title: "Copié !" });
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setWithdrawLoading(true);
    try {
      await api.withdraw(parseFloat(withdrawAmount), withdrawProvider);
      setWithdrawDone(true);
      toast({ title: "Retrait initié !", description: "Votre Mobile Money sera crédité sous peu." });
    } catch (err) {
      toast({ title: "Erreur de retrait", description: (err as Error).message, variant: "destructive" });
    } finally {
      setWithdrawLoading(false);
    }
  }

  async function handleKYC(e: React.FormEvent) {
    e.preventDefault();
    setKycLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setKycDone(true);
      await refreshAccount();
      toast({ title: "Profil mis à jour !" });
    } catch (err) {
      toast({ title: "Erreur", description: (err as Error).message, variant: "destructive" });
    } finally {
      setKycLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/app/auth");
  }

  if (panel === "withdraw") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setPanel(null); setWithdrawDone(false); setWithdrawAmount(""); }} className="text-slate-400 hover:text-white">
            ← Retour
          </button>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Retrait Mobile Money</h1>
          <p className="text-slate-400 text-sm mt-1">Convertissez vos USDT en Mobile Money</p>
        </div>

        {withdrawDone ? (
          <div className="text-center py-10">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Retrait initié !</h2>
            <p className="text-slate-400 text-sm">
              Votre compte {withdrawProvider.toUpperCase()} sera crédité sous peu.
            </p>
            <Button className="mt-6" onClick={() => { setPanel(null); setWithdrawDone(false); setWithdrawAmount(""); }}>
              Retour aux paramètres
            </Button>
          </div>
        ) : (
          <form onSubmit={handleWithdraw} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-slate-300">Montant à retirer (USDT)</Label>
              <Input
                type="number"
                placeholder="50"
                min="1"
                step="0.01"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Opérateur</Label>
              <Select value={withdrawProvider} onValueChange={(v) => setWithdrawProvider(v as "mtn" | "moov")}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="mtn" className="text-white focus:bg-slate-700">MTN Mobile Money</SelectItem>
                  <SelectItem value="moov" className="text-white focus:bg-slate-700">Moov Money</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-2 bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
              <p className="text-slate-300 text-xs">
                Le retrait sera crédité sur le numéro de téléphone associé à votre compte ({account?.phone_number}).
              </p>
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={!withdrawAmount || withdrawLoading}>
              {withdrawLoading ? "Traitement…" : `Retirer ${withdrawAmount || "…"} USDT`}
            </Button>
          </form>
        )}
      </div>
    );
  }

  if (panel === "kyc") {
    return (
      <div className="space-y-6">
        <div>
          <button onClick={() => { setPanel(null); setKycDone(false); }} className="text-slate-400 hover:text-white text-sm mb-4 block">
            ← Retour
          </button>
          <h1 className="text-2xl font-bold text-white">Vérification d'identité</h1>
          <p className="text-slate-400 text-sm mt-1">Renseignez vos informations personnelles</p>
        </div>

        {kycDone ? (
          <div className="text-center py-10">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Profil mis à jour !</h2>
            <p className="text-slate-400 text-sm">Votre vérification d'identité a été soumise.</p>
            <Button className="mt-6" onClick={() => { setPanel(null); setKycDone(false); }}>
              Retour aux paramètres
            </Button>
          </div>
        ) : (
          <form onSubmit={handleKYC} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-slate-300">Nom complet</Label>
              <Input
                placeholder={account?.name}
                value={kycName}
                onChange={(e) => setKycName(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Numéro de pièce d'identité</Label>
              <Input
                placeholder="CNIB / Passeport / Carte nationale"
                value={kycIdNumber}
                onChange={(e) => setKycIdNumber(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Pays</Label>
              <Select value={kycCountry} onValueChange={setKycCountry}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="BJ" className="text-white focus:bg-slate-700">🇧🇯 Bénin</SelectItem>
                  <SelectItem value="BF" className="text-white focus:bg-slate-700">🇧🇫 Burkina Faso</SelectItem>
                  <SelectItem value="CI" className="text-white focus:bg-slate-700">🇨🇮 Côte d'Ivoire</SelectItem>
                  <SelectItem value="SN" className="text-white focus:bg-slate-700">🇸🇳 Sénégal</SelectItem>
                  <SelectItem value="ML" className="text-white focus:bg-slate-700">🇲🇱 Mali</SelectItem>
                  <SelectItem value="TG" className="text-white focus:bg-slate-700">🇹🇬 Togo</SelectItem>
                  <SelectItem value="FR" className="text-white focus:bg-slate-700">🇫🇷 France</SelectItem>
                  <SelectItem value="OTHER" className="text-white focus:bg-slate-700">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
              <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-slate-300 text-xs">
                Vos données sont chiffrées et ne sont jamais partagées avec des tiers sans votre consentement.
              </p>
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={kycLoading}>
              {kycLoading ? "Envoi…" : "Soumettre la vérification"}
            </Button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="text-slate-400 text-sm mt-1">Gérez votre compte</p>
      </div>

      {/* Profile */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs">Nom</p>
              <p className="text-white font-semibold">{account?.name}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs">Téléphone</p>
              <p className="text-white font-semibold">{account?.phone_number}</p>
            </div>
            <Phone className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1">Clé publique Solana</p>
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
              <code className="text-primary text-xs font-mono flex-1 truncate">
                {account?.solana_pubkey}
              </code>
              <button onClick={() => copy(account?.solana_pubkey || "")} className="text-slate-400 hover:text-white shrink-0">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Membre depuis</p>
            <p className="text-white text-sm">
              {account?.created_at ? new Date(account.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }) : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="py-2 divide-y divide-slate-800">
          <button
            className="w-full flex items-center justify-between py-4 text-left hover:opacity-80 transition"
            onClick={() => setPanel("withdraw")}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <ArrowDownToLine className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Retirer vers Mobile Money</p>
                <p className="text-slate-500 text-xs">MTN ou Moov</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          <button
            className="w-full flex items-center justify-between py-4 text-left hover:opacity-80 transition"
            onClick={() => setPanel("kyc")}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Vérification d'identité (KYC)</p>
                <p className="text-slate-500 text-xs">Augmentez vos limites de transfert</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Se déconnecter
      </Button>

      <p className="text-center text-slate-600 text-xs pb-4">
        DiasporaConnect MVP · v0.1.0 · Solana Devnet
      </p>
    </div>
  );
}
