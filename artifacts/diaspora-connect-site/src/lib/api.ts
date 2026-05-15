const BASE_URL = (import.meta.env.VITE_API_URL as string) || "";

function getToken(): string | null {
  return localStorage.getItem("dc_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  }
  return data as T;
}

export interface RegisterResponse {
  message: string;
  user_id: number;
  solana_pubkey: string;
  dev_otp: string;
}

export interface LoginResponse {
  token: string;
  user_id: number;
}

export interface OTPResponse {
  message: string;
}

export interface AccountResponse {
  id: number;
  name: string;
  phone_number: string;
  solana_pubkey: string;
  kyc_verified: boolean;
  transfer_limit: number;
  created_at: string;
}

export interface BalanceResponse {
  solana_pubkey: string;
  balance_usdt: number;
  warning?: string;
}

export interface Transfer {
  ID: number;
  SenderID: number;
  RecipientID: number;
  AmountUSDT: number;
  FeesUSDT: number;
  Status: "pending" | "claimed" | "refunded";
  SolanaTxHash: string;
  Note?: string;
  CreatedAt: string;
  ExpiresAt: string;
  ClaimedAt: string | null;
  RecipientPhone?: string;
  SenderPhone?: string;
}

export interface TransfersResponse {
  transfers: Transfer[];
}

export interface SendTransferResponse {
  transfer_id: number;
  tx_hash: string;
  amount_usdt: number;
  fees_usdt: number;
  recipient_phone: string;
  note: string;
  status: string;
  expires_at: string;
}

export interface ClaimResponse {
  status: string;
  tx_hash: string;
  amount_usdt: number;
  claimed_at: string;
}

export interface RefundResponse {
  status: string;
  tx_hash: string;
  transfer_id: string;
}

export interface WithdrawResponse {
  message: string;
  mobile_tx_id: string;
  amount_usdt: number;
  provider: string;
}

export interface ModeResponse {
  mode: "mock" | "devnet";
}

export interface KYCStatusResponse {
  kyc_verified: boolean;
  transfer_limit: number;
  confirm_threshold: number;
}

export interface KYCSubmitResponse {
  kyc_verified: boolean;
  transfer_limit: number;
  message: string;
}

export const api = {
  health: () => request<{ status: string }>("/api/health"),

  register: (phone_number: string, name: string, password: string) =>
    request<RegisterResponse>("/api/register", {
      method: "POST",
      body: JSON.stringify({ phone_number, name, password }),
    }),

  login: (phone_number: string, password: string) =>
    request<LoginResponse>("/api/login", {
      method: "POST",
      body: JSON.stringify({ phone_number, password }),
    }),

  verifyOTP: (phone_number: string, otp: string) =>
    request<OTPResponse>("/api/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone_number, otp }),
    }),

  getAccount: () => request<AccountResponse>("/api/account", {}, true),

  getBalance: () => request<BalanceResponse>("/api/balance", {}, true),

  getTransfers: (params?: { direction?: string; status?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<TransfersResponse>(
      `/api/transfers${qs ? "?" + qs : ""}`,
      {},
      true
    );
  },

  getTransfer: (id: number) =>
    request<Transfer>(`/api/transfers/detail?id=${id}`, {}, true),

  sendTransfer: (recipient_phone: string, amount_usdt: number, note = "") =>
    request<SendTransferResponse>(
      "/api/transfer",
      { method: "POST", body: JSON.stringify({ recipient_phone, amount_usdt, note }) },
      true
    ),

  claimTransfer: (transfer_id: number) =>
    request<ClaimResponse>(
      "/api/claim",
      { method: "POST", body: JSON.stringify({ transfer_id }) },
      true
    ),

  refundTransfer: (transfer_id: number) =>
    request<RefundResponse>(
      "/api/refund",
      { method: "POST", body: JSON.stringify({ transfer_id }) },
      true
    ),

  withdraw: (amount_usdt: number, provider: "mtn" | "moov" = "mtn") =>
    request<WithdrawResponse>(
      "/api/withdraw",
      { method: "POST", body: JSON.stringify({ amount_usdt, provider }) },
      true
    ),

  lookupUser: (phone: string) =>
    request<{ name: string; phone_number: string }>(
      `/api/user/lookup?phone=${encodeURIComponent(phone)}`,
      {},
      true
    ),

  getKYCStatus: () =>
    request<KYCStatusResponse>("/api/kyc/status", {}, true),

  submitKYC: () =>
    request<KYCSubmitResponse>(
      "/api/kyc/submit",
      { method: "POST", body: JSON.stringify({}) },
      true
    ),

  setMode: (mode: "mock" | "devnet") =>
    request<ModeResponse>("/api/mode", {
      method: "POST",
      body: JSON.stringify({ mode }),
    }),
};
