import React, { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ArrowDownToLine, Globe, ShieldCheck, Zap, Activity, Heart, Coins, ChevronRight } from "lucide-react";
import { SiWesternunion, SiMoneygram } from "react-icons/si";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { EnvoiDiaspora } from "@/components/mockups/EnvoiDiaspora";
import { ReceptionBenin } from "@/components/mockups/ReceptionBenin";

function PhoneFrame({ label, sublabel, children }: { label: string; sublabel: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold mb-2">
          {label}
        </div>
        <p className="text-sm text-slate-400">{sublabel}</p>
      </div>
      <div
        className="relative bg-slate-950 rounded-[3rem] p-3 shadow-2xl"
        style={{ boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)" }}
      >
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-950 rounded-b-2xl z-20" />
        <div
          className="overflow-hidden rounded-[2.25rem] bg-white"
          style={{ width: 320, height: 680 }}
        >
          <div className="w-full h-full overflow-y-auto no-scrollbar">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

const EXCHANGE_RATE = 655.96;

function FeeCalculator() {
  const [amount, setAmount] = useState<number>(200);

  // Western Union: fee = 10% of amount, exchange margin = -3% (recipient gets amount × 0.90 × 655.96 × 0.97)
  const wuFee = amount * 0.10;
  const wuAmountReceived = amount * 0.90 * EXCHANGE_RATE * 0.97;
  
  // MoneyGram: fee = 7% of amount, exchange margin = -2.5% (recipient gets amount × 0.93 × 655.96 × 0.975)  
  const mgFee = amount * 0.07;
  const mgAmountReceived = amount * 0.93 * EXCHANGE_RATE * 0.975;
  
  // Banks (Virements): fee = 12% of amount, exchange margin = -4% (recipient gets amount × 0.88 × 655.96 × 0.96)
  const bankFee = amount * 0.12;
  const bankAmountReceived = amount * 0.88 * EXCHANGE_RATE * 0.96;

  // DiasporaConnect: fee = 1% of amount, exchange margin = 0% (recipient gets amount × 0.99 × 655.96)
  const dcFee = amount * 0.01;
  const dcAmountReceived = amount * 0.99 * EXCHANGE_RATE;

  const savingsVsWu = dcAmountReceived - wuAmountReceived;
  const savingsVsWuPercent = ((savingsVsWu / wuAmountReceived) * 100).toFixed(1);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
      <div className="p-6 md:p-10 bg-slate-50 border-b border-slate-200">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Simulateur de Transfert Transparent</h3>
        <p className="text-slate-600 mb-6">Voyez exactement combien d'argent arrive à destination. Taux officiel: 1 EUR = 655.96 CFA</p>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="amount" className="text-lg font-semibold text-slate-700">Montant à envoyer (EUR)</Label>
            <span className="text-2xl font-bold text-primary">{amount} €</span>
          </div>
          <Slider
            id="amount"
            min={10}
            max={2000}
            step={10}
            value={[amount]}
            onValueChange={(val) => setAmount(val[0])}
            className="py-4"
            data-testid="slider-amount"
          />
          <div className="flex justify-between text-sm text-slate-500 font-mono">
            <span>10 €</span>
            <span>2000 €</span>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-10 space-y-6">
        {/* DiasporaConnect */}
        <div className="relative p-6 rounded-xl border-2 border-accent bg-green-50/50 shadow-sm" data-testid="card-diaspora">
          <div className="absolute -top-3 -right-3 bg-accent text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
            Le plus avantageux
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h4 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-6 h-6 text-accent" />
                DiasporaConnect
              </h4>
              <p className="text-accent font-medium mt-1">Frais fixes 1% • Aucune marge de change</p>
            </div>
            <div className="text-right w-full md:w-auto">
              <div className="text-sm text-slate-500 mb-1">Le destinataire reçoit:</div>
              <div className="text-3xl font-black text-accent" data-testid="value-dc-received">
                {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(dcAmountReceived)} CFA
              </div>
              <div className="text-sm text-slate-600 mt-1">
                Frais: <span className="font-semibold text-slate-900" data-testid="value-dc-fee">{dcFee.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>

        {/* Western Union */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white" data-testid="card-wu">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <SiWesternunion className="w-6 h-6 text-yellow-500" />
                Western Union
              </h4>
              <p className="text-destructive text-sm font-medium mt-1">~10% de frais + 3% de marge cachée</p>
            </div>
            <div className="text-right w-full md:w-auto">
              <div className="text-2xl font-bold text-slate-700" data-testid="value-wu-received">
                {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(wuAmountReceived)} CFA
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Frais: <span className="font-semibold text-slate-900" data-testid="value-wu-fee">{wuFee.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>

        {/* MoneyGram */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white" data-testid="card-mg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <SiMoneygram className="w-6 h-6 text-red-600" />
                MoneyGram
              </h4>
              <p className="text-destructive text-sm font-medium mt-1">~7% de frais + 2.5% de marge cachée</p>
            </div>
            <div className="text-right w-full md:w-auto">
              <div className="text-2xl font-bold text-slate-700" data-testid="value-mg-received">
                {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(mgAmountReceived)} CFA
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Frais: <span className="font-semibold text-slate-900" data-testid="value-mg-fee">{mgFee.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>

        {/* Banks */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white" data-testid="card-bank">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-6 h-6 text-slate-500" />
                Banques Traditionnelles
              </h4>
              <p className="text-destructive text-sm font-medium mt-1">~12% de frais + 4% de marge cachée</p>
            </div>
            <div className="text-right w-full md:w-auto">
              <div className="text-2xl font-bold text-slate-700" data-testid="value-bank-received">
                {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(bankAmountReceived)} CFA
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Frais: <span className="font-semibold text-slate-900" data-testid="value-bank-fee">{bankFee.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20 flex items-start gap-4">
          <Zap className="w-8 h-8 text-primary shrink-0 mt-1" />
          <div>
            <h5 className="font-bold text-primary">Votre impact direct avec DiasporaConnect</h5>
            <p className="text-slate-700 mt-1">
              En envoyant {amount} €, votre famille reçoit <strong className="text-accent">{new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(savingsVsWu)} CFA en plus</strong> par rapport à Western Union, soit <strong className="text-accent">+{savingsVsWuPercent}%</strong> de pouvoir d'achat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-[100dvh] bg-background font-sans selection:bg-primary/20">
      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 z-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4" data-testid="hero-badge">
              <ShieldCheck className="w-4 h-4" /> Solution basée sur Solana
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Arrêtez de payer pour aider votre famille.
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Les intermédiaires vous prennent jusqu'à 15% sur chaque transfert vers le Bénin. 
              <strong className="text-primary font-bold"> DiasporaConnect réduit ces frais à 1%.</strong>
            </p>
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/25" data-testid="btn-cta-mvp" onClick={() => navigate("/app/auth")}>
                Commencez par utiliser notre MVP <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8" data-testid="btn-cta-primary" onClick={() => navigate("/demo")}>
                Essayer le simulateur <ArrowDownToLine className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The Problem (Cost of traditional services) */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Le vol silencieux des remises migratoires</h2>
            <p className="text-xl text-slate-300">
              Chaque année, la diaspora béninoise envoie environ 500 millions USD. 
              Les frais cachés et les marges de change confisquent entre 30 et 80 millions USD à vos familles.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-400">
                <Coins className="w-6 h-6" /> La Marge de Change Cachée
              </h3>
              <p className="text-slate-300">
                Les opérateurs utilisent un taux inférieur au taux réel. Au lieu de vous donner 1 EUR = 656 CFA, ils vous donnent 630 CFA. Sur 200€, c'est <strong>5 200 CFA perdus</strong> sans même apparaître dans les frais.
              </p>
            </div>
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-400">
                <Activity className="w-6 h-6" /> Frais d'Avance de Fonds
              </h3>
              <p className="text-slate-300">
                Si vous payez par carte bancaire, votre banque ajoute une commission de 2 à 4% considérée comme une "avance de fonds", s'ajoutant aux frais de l'opérateur.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Fee Calculator Section */}
      <section className="py-24 bg-slate-50 relative" id="calculator">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Calculez vos économies</h2>
            <p className="text-xl text-slate-600">Comparez en temps réel l'argent qui arrive vraiment au pays.</p>
          </div>
          <FeeCalculator />
        </div>
      </section>

      {/* 3.5 Mobile App Preview */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden" id="app-preview">
        <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/40 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary font-semibold text-sm mb-4">
              <Activity className="w-4 h-4" /> Aperçu interactif
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">L'application en action</h2>
            <p className="text-xl text-slate-300">
              Testez vous-même les deux côtés de l'expérience : l'envoi depuis la France et la réception au Bénin. Tout est interactif.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-start justify-center gap-12 lg:gap-20">
            <PhoneFrame label="🇫🇷 SENDER · DIASPORA" sublabel="Modifiez le montant et voyez le calcul">
              <EnvoiDiaspora />
            </PhoneFrame>
            <PhoneFrame label="🇧🇯 RECIPIENT · BÉNIN" sublabel="Cliquez sur Retirer ou voir l'historique">
              <ReceptionBenin />
            </PhoneFrame>
          </div>

          <div className="text-center mt-16 text-slate-400 text-sm">
            👆 Ces deux écrans sont pleinement fonctionnels. Essayez-les directement dans votre navigateur.
          </div>
        </div>
      </section>

      {/* 4. Comparison Table */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">La transparence avant tout</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" data-testid="comparison-table">
                <thead>
                  <tr>
                    <th className="p-4 border-b-2 border-slate-200 text-slate-500 font-semibold bg-slate-50 rounded-tl-xl">Critères</th>
                    <th className="p-4 border-b-2 border-slate-200 text-slate-900 font-bold bg-slate-50">Western Union</th>
                    <th className="p-4 border-b-2 border-slate-200 text-slate-900 font-bold bg-slate-50">MoneyGram</th>
                    <th className="p-4 border-b-2 border-slate-200 text-slate-900 font-bold bg-slate-50">Banques</th>
                    <th className="p-4 border-b-2 border-primary text-primary font-bold bg-primary/5 rounded-tr-xl">DiasporaConnect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-4 font-medium text-slate-700">Frais sur 200€</td>
                    <td className="p-4 text-slate-600">7–15%</td>
                    <td className="p-4 text-slate-600">5–9%</td>
                    <td className="p-4 text-slate-600">5–20%</td>
                    <td className="p-4 font-bold text-accent bg-primary/5">1% Fixe</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-slate-700">Délai</td>
                    <td className="p-4 text-slate-600">10min–1h</td>
                    <td className="p-4 text-slate-600">15min–1h</td>
                    <td className="p-4 text-slate-600">2–5 jours</td>
                    <td className="p-4 font-bold text-slate-900 bg-primary/5">&lt; 2 min</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-slate-700">Coûts cachés</td>
                    <td className="p-4 text-slate-600 text-sm">Marge 2-4% + frais CB</td>
                    <td className="p-4 text-slate-600 text-sm">Marge 1.5-3.5%</td>
                    <td className="p-4 text-slate-600 text-sm">Marge 3-6%</td>
                    <td className="p-4 font-bold text-accent bg-primary/5">Aucun</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-slate-700">Réception</td>
                    <td className="p-4 text-slate-600">Cash en agence</td>
                    <td className="p-4 text-slate-600">Cash en agence</td>
                    <td className="p-4 text-slate-600">Compte bancaire</td>
                    <td className="p-4 font-bold text-slate-900 bg-primary/5">Mobile Money</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Blockchain Explainer */}
      <section className="py-24 bg-slate-900 text-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Technologie de pointe. Utilisation simple.</h2>
            <p className="text-xl text-slate-400">
              Nous utilisons la blockchain Solana pour éliminer les intermédiaires, mais vous n'avez pas besoin de comprendre la crypto pour l'utiliser.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-primary/50 transition-colors">
              <Zap className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-3 text-white">Vitesse Solana</h3>
              <p className="text-slate-400">
                Capable de traiter plus de 50 000 transactions par seconde, le réseau valide votre transfert en moins de 400 millisecondes. Coût réseau: moins de 0.0002$.
              </p>
            </div>
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-primary/50 transition-colors">
              <ShieldCheck className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-3 text-white">Fonds Sécurisés (Escrow)</h3>
              <p className="text-slate-400">
                Un smart contract en Rust bloque l'argent (USDT stablecoin sans volatilité) jusqu'à ce que le numéro de téléphone Mobile Money le réclame. 
              </p>
            </div>
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-primary/50 transition-colors">
              <Heart className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-3 text-white">Garantie 7 Jours</h3>
              <p className="text-slate-400">
                Si le transfert n'est pas réclamé dans les 7 jours, les fonds vous sont automatiquement et intégralement remboursés. Zero risque de perte.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Impact Section */}
      <section className="py-24 bg-accent text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Restituer 100 Millions de Dollars</h2>
            <p className="text-xl text-green-100 mb-12">
              60% des familles rurales au Bénin dépendent de ces transferts pour la santé et l'éducation.
              En passant à 1% de frais, nous pouvons réinjecter collectivement entre 70 et 100 millions USD directement dans l'économie locale chaque année.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              <div className="p-6 bg-green-700/30 rounded-xl">
                <div className="text-4xl font-black mb-2">500M$</div>
                <div className="text-sm font-medium text-green-200">Transférés par an</div>
              </div>
              <div className="p-6 bg-red-900/30 rounded-xl border border-red-500/20">
                <div className="text-4xl font-black mb-2 text-red-300">~15%</div>
                <div className="text-sm font-medium text-red-200">Frais actuels max</div>
              </div>
              <div className="p-6 bg-green-700/30 rounded-xl border border-green-400/30">
                <div className="text-4xl font-black mb-2">1%</div>
                <div className="text-sm font-medium text-green-200">Frais DiasporaConnect</div>
              </div>
              <div className="p-6 bg-white rounded-xl text-accent shadow-xl">
                <div className="text-4xl font-black mb-2">+100M$</div>
                <div className="text-sm font-bold">Pour vos familles</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer / CTA */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Prêt à changer les choses ?</h2>
          <p className="mb-10 max-w-2xl mx-auto text-lg">Rejoignez le mouvement pour une finance plus juste. Votre premier transfert est gratuit.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="h-14 px-8 text-lg bg-accent hover:bg-accent/90 text-white border-none shadow-lg" data-testid="btn-footer-mvp" onClick={() => navigate("/app/auth")}>
              Commencez par utiliser notre MVP <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-white border-none shadow-lg" data-testid="btn-footer-cta" onClick={() => navigate("/demo")}>
              Essayer la démo complète <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
          
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-300 font-bold text-xl">
              <Globe className="w-6 h-6 text-primary" />
              DiasporaConnect
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
              <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            <div>
              &copy; {new Date().getFullYear()} DiasporaConnect. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
