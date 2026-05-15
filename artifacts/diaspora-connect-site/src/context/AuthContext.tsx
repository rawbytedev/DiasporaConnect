import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api, AccountResponse } from "@/lib/api";

interface AuthState {
  token: string | null;
  userId: number | null;
  account: AccountResponse | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, name: string, password: string) => Promise<{ phone: string }>;
  verifyOTP: (phone: string, otp: string) => Promise<void>;
  logout: () => void;
  refreshAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "dc_token";
const USER_KEY = "dc_user_id";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: localStorage.getItem(TOKEN_KEY),
    userId: Number(localStorage.getItem(USER_KEY)) || null,
    account: null,
    loading: true,
  });

  const refreshAccount = useCallback(async () => {
    try {
      const account = await api.getAccount();
      setState((s) => ({ ...s, account, loading: false }));
    } catch {
      setState((s) => ({ ...s, account: null, loading: false }));
    }
  }, []);

  useEffect(() => {
    if (state.token) {
      refreshAccount();
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [state.token, refreshAccount]);

  const login = useCallback(async (phone: string, password: string) => {
    const res = await api.login(phone, password);
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, String(res.user_id));
    setState((s) => ({
      ...s,
      token: res.token,
      userId: res.user_id,
      loading: true,
    }));
    const account = await api.getAccount();
    setState((s) => ({ ...s, account, loading: false }));
  }, []);

  const register = useCallback(
    async (phone: string, name: string, password: string) => {
      await api.register(phone, name, password);
      return { phone };
    },
    []
  );

  const verifyOTP = useCallback(async (phone: string, otp: string) => {
    await api.verifyOTP(phone, otp);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ token: null, userId: null, account: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, verifyOTP, logout, refreshAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
