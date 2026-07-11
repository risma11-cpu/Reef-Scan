import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  Users,
  Waves,
  BarChart3,
  LogOut,
  Search,
  ChevronLeft,
  ChevronRight,
  Circle,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_URL || "https://cimaiiyah.pythonanywhere.com";

const CLASS_STYLES = {
  healthy: { label: "Healthy", badge: "bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30", bar: "#34d399" },
  bleached: { label: "Bleached", badge: "bg-slate-500/15 text-slate-200 ring-1 ring-inset ring-slate-400/30", bar: "#cbd5e1" },
  dead: { label: "Dead", badge: "bg-red-500/15 text-red-400 ring-1 ring-inset ring-red-500/30", bar: "#f87171" },
  algae: { label: "Algae", badge: "bg-green-500/15 text-green-400 ring-1 ring-inset ring-green-500/30", bar: "#4ade80" },
};

function normalizeClass(raw) {
  if (!raw) return "healthy";
  const k = String(raw).toLowerCase();
  if (k.includes("bleach") || k.includes("memutih")) return "bleached";
  if (k.includes("dead") || k.includes("mati")) return "dead";
  if (k.includes("algae") || k.includes("lumut")) return "algae";
  return "healthy";
}

const ACCENT = {
  sky: "bg-sky-500/15 text-sky-400",
  cyan: "bg-cyan-500/15 text-cyan-400",
  emerald: "bg-emerald-500/15 text-emerald-400",
  slate: "bg-slate-500/15 text-slate-300",
  red: "bg-red-500/15 text-red-400",
  green: "bg-green-500/15 text-green-400",
};

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-colors hover:border-slate-700">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${ACCENT[accent] ?? ACCENT.sky}`}>
        <Icon size={19} />
      </div>
      <p className="mt-4 text-[28px] font-semibold leading-none text-white">{value}</p>
      <p className="mt-1.5 text-[13px] text-slate-400">{label}</p>
    </div>
  );
}

function ProgressBar({ value }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-sky-400" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-slate-400">{pct.toFixed(1)}%</span>
    </div>
  );
}

function useTablePagination(rows, pageSize = 7) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [rows.length]); // eslint-disable-line
  const paged = rows.slice((page - 1) * pageSize, page * pageSize);
  return { page, setPage, totalPages, paged };
}

function Pagination({ pagination }) {
  const { page, setPage, totalPages } = pagination;
  return (
    <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-500">
      <span>
        Halaman {page} dari {totalPages}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:bg-slate-800 disabled:opacity-30"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:bg-slate-800 disabled:opacity-30"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
      <Search size={14} className="shrink-0 text-slate-500" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-40 bg-transparent text-[13px] text-slate-200 placeholder-slate-500 outline-none sm:w-52"
      />
    </div>
  );
}

function SectionCard({ title, action, children }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-white">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function Dashboard({ user, logout }) {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverOnline, setServerOnline] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [predSearch, setPredSearch] = useState("");

  const checkHealth = useCallback(async (mountedRef) => {
    try {
      await axios.get(`${API_BASE}/health`, { timeout: 8000 });
      if (mountedRef.current) setServerOnline(true);
    } catch {
      if (mountedRef.current) setServerOnline(false);
    }
  }, []);

  const fetchData = useCallback(async (mountedRef) => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, predRes] = await Promise.all([
        axios.get(`${API_BASE}/api/users`),
        axios.get(`${API_BASE}/api/prediksi-all`),
      ]);
      if (!mountedRef.current) return;
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data ?? []);
      setPredictions(Array.isArray(predRes.data) ? predRes.data : predRes.data?.data ?? []);
      setLastUpdated(new Date());
    } catch (err) {
      if (!mountedRef.current) return;
      setError(
        `Gagal mengambil data dari server. ${
          err.response ? `Status ${err.response.status}.` : "Periksa koneksi atau status backend."
        }`
      );
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const mountedRef = { current: true };
    checkHealth(mountedRef);
    fetchData(mountedRef);
    const interval = setInterval(() => {
      checkHealth(mountedRef);
      fetchData(mountedRef);
    }, 30000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [checkHealth, fetchData]);

  const refresh = () => {
    const mountedRef = { current: true };
    checkHealth(mountedRef);
    fetchData(mountedRef);
  };

  const classCounts = useMemo(() => {
    const counts = { healthy: 0, bleached: 0, dead: 0, algae: 0 };
    predictions.forEach((p) => {
      counts[normalizeClass(p.hasil ?? p.kelas ?? p.prediksi ?? p.result)] += 1;
    });
    return counts;
  }, [predictions]);

  const chartData = [
    { name: "Healthy", jumlah: classCounts.healthy, fill: CLASS_STYLES.healthy.bar },
    { name: "Bleached", jumlah: classCounts.bleached, fill: CLASS_STYLES.bleached.bar },
    { name: "Dead", jumlah: classCounts.dead, fill: CLASS_STYLES.dead.bar },
    { name: "Algae", jumlah: classCounts.algae, fill: CLASS_STYLES.algae.bar },
  ];

  const filteredUsers = users.filter((u) =>
    `${u.username ?? u.nama ?? ""} ${u.email ?? ""}`.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredPreds = predictions.filter((p) =>
    `${p.user ?? p.username ?? ""} ${p.hasil ?? p.kelas ?? ""}`.toLowerCase().includes(predSearch.toLowerCase())
  );
  const userPage = useTablePagination(filteredUsers, 7);
  const predPage = useTablePagination(filteredPreds, 7);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "users", label: "Data Pengguna", icon: Users },
    { key: "riwayat", label: "Riwayat Prediksi", icon: Waves },
    { key: "statistik", label: "Statistik", icon: BarChart3 },
  ];

  const pageTitle = {
    dashboard: { title: "Dashboard", subtitle: "Ringkasan aktivitas Reef Scan" },
    users: { title: "Data Pengguna", subtitle: "Daftar seluruh pengguna terdaftar" },
    riwayat: { title: "Riwayat Prediksi", subtitle: "Semua hasil klasifikasi terumbu karang" },
    statistik: { title: "Statistik", subtitle: "Distribusi hasil klasifikasi" },
  }[activeMenu];

  const usersTable = (limit) => {
    const rows = limit ? filteredUsers.slice(0, limit) : userPage.paged;
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3 pr-4">ID</th>
              <th className="py-3 pr-4">Username</th>
              <th className="py-3 pr-4">Email</th>
              <th className="py-3">Tanggal Registrasi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="py-8 text-center text-slate-500">Memuat data...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="py-8 text-center text-slate-500">{error ? "Data tidak tersedia." : "Tidak ada data."}</td></tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="border-b border-slate-800/70 text-slate-300 transition-colors hover:bg-slate-800/30">
                  <td className="py-3 pr-4 text-slate-500">#{u.id}</td>
                  <td className="py-3 pr-4 font-medium text-slate-200">{u.username ?? u.nama}</td>
                  <td className="py-3 pr-4 text-slate-400">{u.email}</td>
                  <td className="py-3 text-slate-400">{u.tanggal_registrasi ?? u.created_at ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const predTable = (limit) => {
    const rows = limit ? filteredPreds.slice(0, limit) : predPage.paged;
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3 pr-4">ID</th>
              <th className="py-3 pr-4">User</th>
              <th className="py-3 pr-4">Hasil</th>
              <th className="py-3 pr-4">Confidence</th>
              <th className="py-3">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">Memuat data...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">{error ? "Data tidak tersedia." : "Tidak ada data."}</td></tr>
            ) : (
              rows.map((p) => {
                const key = normalizeClass(p.hasil ?? p.kelas ?? p.prediksi ?? p.result);
                const style = CLASS_STYLES[key];
                const conf = p.confidence ?? p.akurasi ?? 0;
                return (
                  <tr key={p.id} className="border-b border-slate-800/70 text-slate-300 transition-colors hover:bg-slate-800/30">
                    <td className="py-3 pr-4 text-slate-500">#{p.id}</td>
                    <td className="py-3 pr-4 font-medium text-slate-200">{p.user ?? p.username ?? "-"}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${style.badge}`}>
                        {style.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4"><ProgressBar value={conf <= 1 ? conf * 100 : conf} /></td>
                    <td className="py-3 text-slate-400">{p.tanggal ?? p.created_at ?? "-"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const chart = (height) =>
    loading ? (
      <div className="flex items-center justify-center text-sm text-slate-500" style={{ height }}>
        Memuat data...
      </div>
    ) : (
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="32%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} width={28} />
            <Tooltip
              cursor={{ fill: "rgba(148,163,184,0.06)" }}
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#e2e8f0", fontSize: 13 }}
            />
            <Bar dataKey="jumlah" radius={[6, 6, 0, 0]} maxBarSize={64}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );

  return (
    <div className="flex min-h-screen w-full bg-[#050b14] text-slate-100 antialiased">
      {/* SIDEBAR */}
      <aside className="flex w-60 flex-shrink-0 flex-col border-r border-slate-800/80 bg-[#04101c]">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
            <Waves size={18} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold tracking-wide text-white">REEF SCAN</p>
            <p className="truncate text-[11px] text-slate-500">
              {user?.username ? `Halo, ${user.username}` : "Admin Dashboard"}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeMenu === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveMenu(item.key)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                  active ? "bg-sky-500/15 text-sky-300" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-800/80 p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1200px] px-6 py-6 sm:px-8 sm:py-8">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-white sm:text-2xl">{pageTitle.title}</h1>
              <p className="mt-1 text-[13px] text-slate-500">{pageTitle.subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={refresh}
                className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-800"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs">
                <Circle
                  size={8}
                  className={
                    serverOnline === null ? "fill-slate-500 text-slate-500" : serverOnline ? "fill-emerald-400 text-emerald-400" : "fill-red-400 text-red-400"
                  }
                />
                <span className="text-slate-300">
                  {serverOnline === null ? "Memeriksa..." : serverOnline ? "Server Online" : "Server Offline"}
                </span>
              </div>
              <span className="hidden text-xs text-slate-500 sm:inline">{today}</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
              {error}
            </div>
          )}
          {lastUpdated && !error && (
            <p className="mb-6 text-[11px] text-slate-600">
              Terakhir diperbarui {lastUpdated.toLocaleTimeString("id-ID")}
            </p>
          )}

          {/* ===== DASHBOARD ===== */}
          {activeMenu === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <StatCard icon={Users} label="Total User" value={users.length} accent="sky" />
                <StatCard icon={Waves} label="Total Prediksi" value={predictions.length} accent="cyan" />
                <StatCard icon={Circle} label="Healthy" value={classCounts.healthy} accent="emerald" />
                <StatCard icon={Circle} label="Bleached" value={classCounts.bleached} accent="slate" />
                <StatCard icon={Circle} label="Dead" value={classCounts.dead} accent="red" />
                <StatCard icon={Circle} label="Algae" value={classCounts.algae} accent="green" />
              </div>

              <SectionCard title="Distribusi Hasil Klasifikasi">{chart(280)}</SectionCard>
              <SectionCard title="Pengguna Terbaru">{usersTable(5)}</SectionCard>
              <SectionCard title="Prediksi Terbaru">{predTable(5)}</SectionCard>
            </div>
          )}

          {/* ===== DATA PENGGUNA ===== */}
          {activeMenu === "users" && (
            <SectionCard
              title={`Data Pengguna (${users.length})`}
              action={<SearchBox value={userSearch} onChange={setUserSearch} placeholder="Cari user..." />}
            >
              {usersTable(null)}
              <Pagination pagination={userPage} />
            </SectionCard>
          )}

          {/* ===== RIWAYAT PREDIKSI ===== */}
          {activeMenu === "riwayat" && (
            <SectionCard
              title={`Riwayat Klasifikasi (${predictions.length})`}
              action={<SearchBox value={predSearch} onChange={setPredSearch} placeholder="Cari klasifikasi..." />}
            >
              {predTable(null)}
              <Pagination pagination={predPage} />
            </SectionCard>
          )}

          {/* ===== STATISTIK ===== */}
          {activeMenu === "statistik" && (
            <div className="space-y-6">
              <SectionCard title="Distribusi Hasil Klasifikasi">{chart(360)}</SectionCard>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(classCounts).map(([key, count]) => {
                  const style = CLASS_STYLES[key];
                  const total = predictions.length || 1;
                  const pct = ((count / total) * 100).toFixed(1);
                  return (
                    <div key={key} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${style.badge}`}>
                        {style.label}
                      </span>
                      <p className="mt-3 text-2xl font-semibold text-white">{count}</p>
                      <p className="mt-1 text-[12px] text-slate-500">{pct}% dari total prediksi</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
