import React, { useState } from "react";
import { Warehouse, ChevronDown } from "lucide-react";
import { useAuth, UserRole } from "../context/AuthContext";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "manager", label: "المدير" },
  { value: "warehouse", label: "مدير المخزن" },
  { value: "representative", label: "المندوب" },
  { value: "accountant", label: "المحاسب" },
];

export function LoginPage() {
  const { loginAsRole } = useAuth();
  const [role, setRole] = useState<UserRole>("manager");

  const handleEnter = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsRole(role);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full opacity-5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-emerald-500 rounded-full opacity-5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-l from-blue-600 to-blue-700 px-8 py-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Warehouse size={32} className="text-white" />
            </div>
            <h1 className="text-white text-xl mb-1">نظام إدارة التوزيع</h1>
            <p className="text-blue-200 text-sm">بريق للمنظفات والمساحيق</p>
          </div>

          <div className="px-8 py-7">
            <h2 className="text-slate-700 text-lg mb-6">اختر نوع المستخدم</h2>

            <form onSubmit={handleEnter} className="space-y-4">
              <div>
                <label className="block text-slate-600 text-sm mb-1.5">نوع المستخدم</label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute top-1/2 -translate-y-1/2 left-3 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm transition-all duration-200 shadow-sm hover:shadow-md mt-2"
              >
                دخول
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-slate-400 text-xs text-center mb-2">دخول سريع</p>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => loginAsRole(option.value)}
                    className="text-xs bg-slate-50 text-slate-700 border border-slate-200 rounded-lg py-2 px-3 hover:bg-slate-100 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
