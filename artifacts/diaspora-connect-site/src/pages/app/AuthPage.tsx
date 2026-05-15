import { useState } from "react";
import { useLocation } from "wouter";
import { Globe, ArrowLeft, Eye, EyeOff, PhoneCall, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

type Step = "choose" | "login" | "register" | "otp";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { login, register, verifyOTP } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("choose");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [copied, setCopied] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingPhone, setPendingPhone] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(phone, password);
      navigate("/app/dashboard");
    } catch (err) {
      toast({ title: "Erreur de connexion", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await register(phone, name, password);
      setPendingPhone(phone);
      setDevOtp(result.otp || "");
      setStep("otp");
    } catch (err) {
      toast({ title: "Erreur d'inscription", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOTP(pendingPhone, otp);
      toast({ title: "Téléphone vérifié !", description: "Connectez-vous maintenant." });
      setStep("login");
      setPhone(pendingPhone);
      setDevOtp("");
    } catch (err) {
      toast({ title: "OTP invalide", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function handleCopyOtp() {
    navigator.clipboard.writeText(devOtp).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Retour au site
      </button>

      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Globe className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold text-white">DiasporaConnect</span>
        </div>

        {step === "choose" && (
          <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 space-y-4">
            <h1 className="text-2xl font-bold text-white text-center mb-6">Bienvenue</h1>
            <Button
              className="w-full h-12 text-base"
              onClick={() => setStep("login")}
            >
              Se connecter
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 text-base border-slate-700 text-slate-200 hover:bg-slate-800"
              onClick={() => setStep("register")}
            >
              Créer un compte
            </Button>
          </div>
        )}

        {step === "login" && (
          <form
            onSubmit={handleLogin}
            className="bg-slate-900 rounded-2xl p-8 border border-slate-800 space-y-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <button type="button" onClick={() => setStep("choose")} className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xl font-bold text-white">Connexion</h1>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Numéro de téléphone</Label>
              <Input
                type="tel"
                placeholder="+22670123456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Mot de passe</Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? "Connexion…" : "Se connecter"}
            </Button>

            <p className="text-center text-sm text-slate-500">
              Pas encore de compte ?{" "}
              <button type="button" onClick={() => setStep("register")} className="text-primary hover:underline">
                Créer un compte
              </button>
            </p>
          </form>
        )}

        {step === "register" && (
          <form
            onSubmit={handleRegister}
            className="bg-slate-900 rounded-2xl p-8 border border-slate-800 space-y-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <button type="button" onClick={() => setStep("choose")} className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xl font-bold text-white">Créer un compte</h1>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Nom complet</Label>
              <Input
                placeholder="Alice Traoré"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Numéro de téléphone</Label>
              <Input
                type="tel"
                placeholder="+22670123456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Mot de passe</Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="Min. 8 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? "Création…" : "Créer mon compte"}
            </Button>

            <p className="text-center text-sm text-slate-500">
              Déjà un compte ?{" "}
              <button type="button" onClick={() => setStep("login")} className="text-primary hover:underline">
                Se connecter
              </button>
            </p>
          </form>
        )}

        {step === "otp" && (
          <form
            onSubmit={handleOTP}
            className="bg-slate-900 rounded-2xl p-8 border border-slate-800 space-y-5"
          >
            <div className="text-center mb-4">
              <PhoneCall className="w-12 h-12 text-primary mx-auto mb-3" />
              <h1 className="text-xl font-bold text-white">Vérification OTP</h1>
              <p className="text-slate-400 text-sm mt-2">
                Votre code de vérification pour {pendingPhone}
              </p>
            </div>

            {devOtp && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                <p className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-2 text-center">
                  Mode développement — code OTP
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl font-mono font-bold tracking-[0.3em] text-amber-300">
                    {devOtp}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyOtp}
                    className="text-amber-400 hover:text-amber-200 transition-colors"
                    title="Copier le code"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-amber-500/70 text-center mt-2">
                  L'envoi SMS sera activé en production
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-slate-300">Entrez le code OTP</Label>
              <Input
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-center text-2xl tracking-widest"
              />
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? "Vérification…" : "Vérifier"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
