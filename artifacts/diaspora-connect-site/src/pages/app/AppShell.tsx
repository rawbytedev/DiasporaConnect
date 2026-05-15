import { useEffect } from "react";
import { useLocation, Route, Switch } from "wouter";
import { Globe, LayoutDashboard, Send, History, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Dashboard from "@/pages/app/Dashboard";
import Transfer from "@/pages/app/Transfer";
import HistoryPage from "@/pages/app/History";
import SettingsPage from "@/pages/app/Settings";

const NAV = [
  { path: "/app/dashboard", label: "Accueil", icon: LayoutDashboard },
  { path: "/app/transfer", label: "Envoyer", icon: Send },
  { path: "/app/history", label: "Historique", icon: History },
  { path: "/app/settings", label: "Paramètres", icon: Settings },
];

export default function AppShell() {
  const { token, loading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !token) {
      navigate("/app/auth");
    }
  }, [token, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Globe className="w-10 h-10 text-primary mx-auto animate-pulse" />
          <p className="text-slate-400 text-sm">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center gap-2 px-4 py-4 border-b border-slate-800 shrink-0">
        <Globe className="w-6 h-6 text-primary" />
        <span className="text-white font-bold text-lg">DiasporaConnect</span>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-semibold">
          MVP
        </span>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <Switch>
          <Route path="/app/dashboard" component={Dashboard} />
          <Route path="/app/transfer" component={Transfer} />
          <Route path="/app/history" component={HistoryPage} />
          <Route path="/app/settings" component={SettingsPage} />
          <Route>
            {() => { navigate("/app/dashboard"); return null; }}
          </Route>
        </Switch>
      </main>

      {/* Bottom Nav */}
      <nav className="border-t border-slate-800 bg-slate-950 px-2 py-2 flex justify-around shrink-0">
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = location === path || location.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
                active
                  ? "text-primary bg-primary/10"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
