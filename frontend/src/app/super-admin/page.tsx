'use client';

import React, { useState, useEffect } from "react";

interface TenantBrand {
  url?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  industry?: string;
  category?: string;
  description?: string;
}

interface TenantTargeting {
  locations?: string;
  timezone?: string;
  gender?: string;
  age_min?: number;
  age_max?: number;
  tone?: string;
}

interface MetaInfo {
  connected: boolean;
  page_id?: string;
  page_name?: string;
  has_instagram: boolean;
  ig_user_id?: string;
  token_masked?: string;
}

interface WhatsAppInfo {
  connected: boolean;
  phone_number_id?: string;
  token_masked?: string;
}

interface CampaignCounts {
  total: number;
  scheduled: number;
  published: number;
  failed: number;
}

interface TenantItem {
  id: number;
  name: string;
  email: string;
  google_sso_id?: string;
  is_active: boolean;
  brand: TenantBrand;
  targeting: TenantTargeting;
  meta: MetaInfo;
  whatsapp: WhatsAppInfo;
  campaigns: CampaignCounts;
  assets_count: number;
  users_count: number;
}

interface OverviewData {
  tenants: { total: number; active: number };
  campaigns: { total: number; scheduled: number; published: number; failed: number; draft: number };
  integrations: { connected_meta_pages: number; connected_instagram: number; connected_whatsapp: number };
  assets_count: number;
  users_count: number;
}

export default function SuperAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "meta" | "whatsapp" | "failures">("all");
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [tenantDetail, setTenantDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const savedToken = sessionStorage.getItem("digim_superadmin_token");
    if (savedToken) {
      verifyAndLoad(savedToken);
    }
  }, []);

  const verifyAndLoad = async (token: string) => {
    try {
      const res = await fetch("/api/superadmin/verify", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setIsAuthenticated(true);
        loadDashboardData(token);
      } else {
        sessionStorage.removeItem("digim_superadmin_token");
        setIsAuthenticated(false);
      }
    } catch {
      sessionStorage.removeItem("digim_superadmin_token");
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");

    try {
      const res = await fetch("/api/superadmin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (res.ok && data.token) {
        sessionStorage.setItem("digim_superadmin_token", data.token);
        setIsAuthenticated(true);
        loadDashboardData(data.token);
      } else {
        setLoginError(data.detail || "Invalid password. Access denied.");
      }
    } catch (err: any) {
      setLoginError("Failed to authenticate. Check server connection.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("digim_superadmin_token");
    setIsAuthenticated(false);
    setOverview(null);
    setTenants([]);
    setPassword("");
  };

  const loadDashboardData = async (token?: string) => {
    const authToken = token || sessionStorage.getItem("digim_superadmin_token");
    if (!authToken) return;

    setLoading(true);
    try {
      const [ovRes, tenantsRes] = await Promise.all([
        fetch("/api/superadmin/overview", { headers: { Authorization: `Bearer ${authToken}` } }),
        fetch("/api/superadmin/tenants", { headers: { Authorization: `Bearer ${authToken}` } })
      ]);

      if (ovRes.ok) setOverview(await ovRes.json());
      if (tenantsRes.ok) setTenants(await tenantsRes.json());
    } catch (err) {
      console.error("Error loading superadmin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const openTenantDetail = async (tenantId: number) => {
    setSelectedTenantId(tenantId);
    setDetailLoading(true);
    const authToken = sessionStorage.getItem("digim_superadmin_token");

    try {
      const res = await fetch(`/api/superadmin/tenants/${tenantId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        setTenantDetail(await res.json());
      }
    } catch (err) {
      console.error("Failed to load tenant details:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toString() === searchTerm.trim() ||
      (t.meta.page_name && t.meta.page_name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === "meta") return t.meta.connected;
    if (filterType === "whatsapp") return t.whatsapp.connected;
    if (filterType === "failures") return t.campaigns.failed > 0;
    return true;
  });

  // 1. Password Gateway View
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Super Admin Portal</h1>
            <p className="text-sm text-slate-400 mt-1">Multi-Tenant Oversight & Infrastructure</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Master Passphrase
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter master password..."
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
              />
            </div>

            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 text-sm"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                "Access Command Console"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/60 text-center">
            <span className="text-[11px] text-slate-500 uppercase tracking-widest font-mono">
              DigiM Cloud Security Layer
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Authenticated Dashboard View
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
            D
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-base tracking-tight">DigiM Super Admin</h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                Live Production
              </span>
            </div>
            <p className="text-xs text-slate-400">Multi-Tenant Management & Client Accounts</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadDashboardData()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center gap-1.5"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium rounded-lg border border-rose-500/20 transition flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* KPI Metrics */}
        {overview && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Total Clients / Tenants</span>
                <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tight">{overview.tenants.total}</span>
                <span className="text-xs text-emerald-400 font-medium">({overview.tenants.active} active)</span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Meta (FB & IG) Connected</span>
                <span className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tight">{overview.integrations.connected_meta_pages}</span>
                <span className="text-xs text-slate-400 font-medium">({overview.integrations.connected_instagram} with IG)</span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">WhatsApp Integrations</span>
                <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                  </svg>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tight">{overview.integrations.connected_whatsapp}</span>
                <span className="text-xs text-slate-400 font-medium">accounts</span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Total Campaigns</span>
                <span className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-white tracking-tight">{overview.campaigns.total}</span>
                <div className="flex gap-1.5 text-[11px]">
                  <span className="text-emerald-400">{overview.campaigns.published} pub</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-blue-400">{overview.campaigns.scheduled} sched</span>
                  {overview.campaigns.failed > 0 && (
                    <>
                      <span className="text-slate-500">•</span>
                      <span className="text-rose-400 font-semibold">{overview.campaigns.failed} fail</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by client name, email, tenant ID, or Facebook Page..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {(["all", "meta", "whatsapp", "failures"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterType(mode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition whitespace-nowrap ${
                  filterType === mode
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {mode === "all" ? "All Clients" : mode === "meta" ? "FB Connected" : mode === "whatsapp" ? "WhatsApp" : "Has Failures"}
              </button>
            ))}
          </div>
        </div>

        {/* Client Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Tenant</th>
                  <th className="py-3.5 px-4">Contact & SSO</th>
                  <th className="py-3.5 px-4">Meta Integration</th>
                  <th className="py-3.5 px-4">WhatsApp</th>
                  <th className="py-3.5 px-4">Campaigns</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No tenants found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                            #{t.id}
                          </span>
                          <div>
                            <div className="font-semibold text-white tracking-tight">{t.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span>{t.brand.industry || "General Retail"}</span>
                              {t.brand.category && <span>• {t.brand.category}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="text-xs text-slate-200 font-medium">{t.email}</div>
                        {t.google_sso_id ? (
                          <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Google SSO Linked
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 font-mono">Manual Demo Account</div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {t.meta.connected ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                              {t.meta.page_name || "Page Connected"}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1 font-mono">
                              ID: {t.meta.page_id}
                              {t.meta.has_instagram && (
                                <span className="ml-1.5 text-pink-400 font-sans font-medium">📷 +IG</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-500">
                            Not Connected
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {t.whatsapp.connected ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Connected
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1 font-mono">
                              {t.whatsapp.phone_number_id}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-500">
                            Not Connected
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-white font-semibold">{t.campaigns.total}</span>
                          <span className="text-slate-500">total</span>
                        </div>
                        <div className="flex gap-2 text-[10px] mt-0.5">
                          <span className="text-emerald-400 font-medium">{t.campaigns.published} pub</span>
                          <span className="text-blue-400 font-medium">{t.campaigns.scheduled} sched</span>
                          {t.campaigns.failed > 0 && (
                            <span className="text-rose-400 font-semibold">{t.campaigns.failed} fail</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => openTenantDetail(t.id)}
                          className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-medium transition"
                        >
                          Inspect Client
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Tenant Details Modal / Drawer */}
      {selectedTenantId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono font-bold flex items-center justify-center">
                  #{selectedTenantId}
                </span>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {tenantDetail?.name || `Tenant #${selectedTenantId}`}
                  </h2>
                  <p className="text-xs text-slate-400">{tenantDetail?.email}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedTenantId(null);
                  setTenantDetail(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {detailLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Loading client inspection data...</span>
              </div>
            ) : tenantDetail ? (
              <div className="space-y-6 text-sm">
                {/* Meta Integration Box */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Facebook & Instagram Integration
                    </span>
                    {tenantDetail.meta_account ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active Token
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-500">
                        Disconnected
                      </span>
                    )}
                  </div>
                  {tenantDetail.meta_account ? (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">Page Name:</span>
                        <span className="text-white font-medium">{tenantDetail.meta_account.page_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Page ID:</span>
                        <span className="text-white font-mono">{tenantDetail.meta_account.page_id}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Instagram User ID:</span>
                        <span className="text-white font-mono">{tenantDetail.meta_account.ig_user_id || "None"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Token Preview:</span>
                        <span className="text-slate-400 font-mono text-[11px]">{tenantDetail.meta_account.token_preview}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">This business has not linked a Meta Page.</p>
                  )}
                </div>

                {/* WhatsApp Integration Box */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      WhatsApp Cloud API
                    </span>
                    {tenantDetail.whatsapp?.phone_number_id ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Configured
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-500">
                        Disconnected
                      </span>
                    )}
                  </div>
                  {tenantDetail.whatsapp?.phone_number_id ? (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">Phone Number ID:</span>
                        <span className="text-white font-mono">{tenantDetail.whatsapp.phone_number_id}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Token Preview:</span>
                        <span className="text-slate-400 font-mono text-[11px]">{tenantDetail.whatsapp.token_preview}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No WhatsApp phone credentials configured.</p>
                  )}
                </div>

                {/* Recent Campaigns */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Recent Campaigns & Executions
                  </h3>
                  <div className="space-y-2">
                    {tenantDetail.campaigns?.length === 0 ? (
                      <p className="text-xs text-slate-500">No campaigns created yet.</p>
                    ) : (
                      tenantDetail.campaigns.map((c: any) => (
                        <div key={c.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">Campaign #{c.id}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                c.status === "published"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : c.status === "scheduled"
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  : c.status === "failed"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {c.status.toUpperCase()}
                            </span>
                          </div>
                          {c.scheduled_time && (
                            <div className="text-[11px] text-slate-400">
                              Scheduled Time: <span className="font-mono text-slate-300">{c.scheduled_time}</span>
                            </div>
                          )}
                          {c.generated_text_preview && (
                            <p className="text-slate-400 italic font-serif">"{c.generated_text_preview}"</p>
                          )}
                          {c.failure_reason && (
                            <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded text-[11px] text-rose-400 font-mono">
                              Error: {c.failure_reason}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Audit Logs */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Recent Tenant Audit Trail
                  </h3>
                  <div className="space-y-2">
                    {tenantDetail.logs?.length === 0 ? (
                      <p className="text-xs text-slate-500">No activity logged.</p>
                    ) : (
                      tenantDetail.logs.map((l: any) => (
                        <div key={l.id} className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 text-xs flex justify-between items-center">
                          <div>
                            <div className="font-medium text-slate-200">{l.action}</div>
                            {l.details && <div className="text-[11px] text-slate-500 mt-0.5">{l.details}</div>}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono shrink-0 ml-4">
                            {l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : ""}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
