import React, { createContext, useContext, useState, useEffect } from "react";

// Role mapping: 1=Admin/Manager, 2=Inventory/Warehouse, 3=Rep, 4=Accountant
export type UserRole = "manager" | "warehouse" | "representative" | "accountant";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  avatar: string;
  vehicleId?: number;
  vehicleName?: string;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  loginAsRole: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "bareeq_auth_user";
const API_BASE = "https://pareeq.runasp.net";

// ─── JWT Decoder (no external lib needed) ───────────────────────────────────
function parseJwt(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Map numeric role from token to app role string
function mapRole(roleValue: string | number): UserRole {
  const r = Number(roleValue);
  switch (r) {
    case 1: return "manager";
    case 2: return "warehouse";
    case 3: return "representative";
    case 4: return "accountant";
    default: return "manager";
  }
}

// Build AuthUser from JWT token + raw token string
function buildUserFromToken(token: string): AuthUser | null {
  const payload = parseJwt(token);
  if (!payload) return null;

  const role = mapRole(payload.role);
  const name: string = payload.unique_name || payload.name || "مستخدم";
  const avatar = name.trim().charAt(0) || "م";

  return {
    id: payload.nameid || payload.sub || "0",
    name,
    username: payload.unique_name || "",
    role,
    avatar,
    vehicleId: payload.VehicleId ? Number(payload.VehicleId) : undefined,
    vehicleName: payload.VehicleName || undefined,
    token,
  };
}

// Demo JWT used only for local role-picker bypass (keeps session restore working)
function createDemoToken(role: UserRole): string {
  const roleNum = { manager: 1, warehouse: 2, representative: 3, accountant: 4 }[role];
  const toBase64Url = (value: object) =>
    btoa(unescape(encodeURIComponent(JSON.stringify(value))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  return `${toBase64Url({ alg: "none", typ: "JWT" })}.${toBase64Url({
    role: roleNum,
    unique_name: "demo",
    nameid: `demo-${role}`,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
    ...(role === "representative" ? { VehicleId: 1, VehicleName: "VAN-001" } : {}),
  })}.demo`;
}

const DEMO_USERS: Record<UserRole, Omit<AuthUser, "token">> = {
  manager: {
    id: "USR-001",
    name: "عبدالله فؤاد الشافعي",
    username: "manager@bareeq.eg",
    role: "manager",
    avatar: "ع",
  },
  warehouse: {
    id: "USR-002",
    name: "فهد عبد العزيز الصاوي",
    username: "warehouse@bareeq.eg",
    role: "warehouse",
    avatar: "ف",
  },
  representative: {
    id: "USR-003",
    name: "أحمد محمد السعيد",
    username: "van1@bareeq.eg",
    role: "representative",
    avatar: "أ",
    vehicleId: 1,
    vehicleName: "VAN-001",
  },
  accountant: {
    id: "USR-009",
    name: "يوسف أحمد الحكيم",
    username: "accountant@bareeq.eg",
    role: "accountant",
    avatar: "ي",
  },
};

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Restore session from localStorage on first mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: AuthUser = JSON.parse(stored);
        // Validate token is not expired
        const payload = parseJwt(parsed.token);
        if (payload && payload.exp && Date.now() / 1000 < payload.exp) {
          return parsed;
        }
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  });

  const login = async (username: string, password: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/Authintication/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName: username, password }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(errorText || "اسم المستخدم أو كلمة المرور غير صحيحة");
    }

    // The API returns a plain JWT string (text/plain)
    const token = await response.text();
    const cleanToken = token.replace(/^"|"$/g, "").trim();

    const authUser = buildUserFromToken(cleanToken);
    if (!authUser) throw new Error("رمز المصادقة غير صالح");

    // Persist to localStorage & update state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  };

  const loginAsRole = (role: UserRole) => {
    const authUser: AuthUser = {
      ...DEMO_USERS[role],
      token: createDemoToken(role),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  };

  const logout = () => {
    // Full state cleanup
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginAsRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
