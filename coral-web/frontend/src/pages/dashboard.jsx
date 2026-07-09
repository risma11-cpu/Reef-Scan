import { useState, useEffect, useMemo } from "react";
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

// Base URL backend Flask (PythonAnywhere).
// Diambil dari environment variable VITE_API_URL, dengan fallback ke URL produksi
// supaya dashboard tetap berfungsi walau .env belum di-set saat build.
const API_BASE = import.meta.env.VITE_API_URL || "https://cimaiiyah.pythonanywhere.com";

const CLASS_STYLES = {
  healthy: {
    label: "Healthy",
    badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    bar: "#34d399",
  },
  bleached: {
    label: "Bleached",
    badge: "bg-white/10 text-white border border-white/30",
    bar: "#e2e8f0",
  },
  dead: {
    label: "Dead",
    badge: "bg-red-500/15 text-red-400 border border-red-500/30",
    bar: "#f87171",
  },
  algae: {
    label: "Algae",
    badge: "bg-green-500/15 text-green-400 border border-green-500/30",
    bar: "#4ade80",
  },
};

function normalizeClass(raw) {
  if (!raw) return "healthy";
  const k = String(raw).toLowerCase();
  if (k.includes("bleach") || k.includes("memutih")) return "bleached";
  if (k.includes("dead") || k.includes("mati")) return "dead";
  if (k.includes("algae") || k.includes("lumut")) return "algae";
  return "healthy";
}

function useTablePagination(rows, pageSize = 6) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [rows.length]); // eslint-disable-line
  const paged = rows.slice((page - 1) * pageSize, page * pageSize);
  return { page, setPage, totalPages, paged };
}

const ACCENT_STYLES = {
  sky: { border: "hover:border-sky-400/40", chip: "bg-sky-500/15 text-sky-400" },
  cyan: { border: "hover:border-cyan-400/40", chip: "bg-cyan-500/15 text-cyan-400" },
  emerald: { border: "hover:border-emerald-400/40", chip: "bg-emerald-500/15 text-emerald-400" },
  slate: { border: "hover:border-slate-400/40", chip: "bg-slate-500/15 text-slate-300" },
  red: { border: "hover:border-red-400/40", chip: "bg-red-500/15 text-red-400" },
  green: { border: "hover:border-green-400/40", chip: "bg-green-500/15 text-green-400" },
};

function StatCard({ icon: Icon, label, value, accent }) {
  const style = ACCENT_STYLES[accent] ?? ACCENT_STYLES.sky;
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${style.border}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${style.chip}`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-700/60">
        <div
          className="h-full rounded-full bg-sky-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-300">{pct.toFixed(1)}%</span>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [predSearch, setPredSearch] = useState("");
  const [serverOnline, setServerOnline] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function checkHealth(mountedRef) {
    try {
      await axios.get(`${API_BASE}/health`, { timeout: 8000 });
      if (mountedRef.current) setServerOnline(true);
    } catch {
      if (mountedRef.current) setServerOnline(false);
    }
  }

  async function fetchData(mountedRef) {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, predRes] = await Promise.all([
        axios.get(`${API_BASE}/api/users`),
        axios.get(`${API_BASE}/api/prediksi-all`),
      ]);
      if (!mountedRef.current) return;
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data ?? []);
      setPredictions(
        Array.isArray(predRes.data) ? predRes.data : predRes.data?.data ?? []
      );
      setLastUpdated(new Date());
    } catch (err) {
      if (!mountedRef.current) return;
      // Tidak ada fallback ke data dummy — semua data wajib berasal dari API.
      // Kalau gagal, tabel tetap kosong dan pesan error ditampilkan agar jelas.
      setError(
        `Gagal mengambil data dari server (${API_BASE}). ${
          err.response
            ? `Status ${err.response.status}.`
            : "Periksa koneksi atau status backend Flask."
        }`
      );
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

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
  }, []);

  function handleManualRefresh() {
    const mountedRef = { current: true };
    checkHealth(mountedRef);
    fetchData(mountedRef);
  }

  const classCounts = useMemo(() => {
    const counts = { healthy: 0, bleached: 0, dead: 0, algae: 0 };
    predictions.forEach((p) => {
      const key = normalizeClass(p.hasil ?? p.kelas ?? p.prediksi ?? p.result);
      counts[key] += 1;
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
    `${u.username ?? u.nama ?? ""} ${u.email ?? ""}`
      .toLowerCase()
      .includes(userSearch.toLowerCase())
  );
  const filteredPreds = predictions.filter((p) =>
    `${p.user ?? p.username ?? ""} ${p.hasil ?? p.kelas ?? ""}`
      .toLowerCase()
      .includes(predSearch.toLowerCase())
  );

  const userPage = useTablePagination(filteredUsers, 6);
  const predPage = useTablePagination(filteredPreds, 6);

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

  return (
    <div className="flex min-h-screen w-full bg-slate-950 text-slate-100">
      {/* SIDEBAR */}
      <aside className="flex w-64 flex-shrink-0 flex-col border-r border-slate-800 bg-gradient-to-b from-[#062033] to-[#03101c]">
        <div className="flex items-center gap-3 border-b border-slate-800/70 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
            <Waves size={22} />
          </div>
          <div>
            <p className="text-base font-bold leading-tight text-white">REEF SCAN</p>
            <p className="text-xs text-slate-400">Admin Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeMenu === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveMenu(item.key)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-sky-500/20 text-sky-300"
                    : "text-slate-400 hover:translate-x-1 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-800/70 p-3">
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/10">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto px-8 py-6">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-slate-400">Ringkasan aktivitas Reef Scan</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleManualRefresh}
              className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-700/60"
              title="Ambil ulang data dari API"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <div className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-sm">
              <Circle
                size={9}
                className={
                  serverOnline === null
                    ? "fill-slate-500 text-slate-500"
                    : serverOnline
                    ? "fill-emerald-400 text-emerald-400"
                    : "fill-red-400 text-red-400"
                }
              />
              <span className="text-slate-300">
                {serverOnline === null
                  ? "Memeriksa server..."
                  : serverOnline
                  ? "Server Online"
                  : "Server Offline"}
              </span>
            </div>
            <span className="text-sm text-slate-400">{today}</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {lastUpdated && !error && (
          <p className="mb-6 -mt-4 text-xs text-slate-500">
            Terakhir diperbarui: {lastUpdated.toLocaleTimeString("id-ID")}
          </p>
        )}

        {/* Stat Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={Users} label="Total User" value={users.length} accent="sky" />
          <StatCard icon={Waves} label="Total Prediksi" value={predictions.length} accent="cyan" />
          <StatCard icon={Circle} label="Healthy" value={classCounts.healthy} accent="emerald" />
          <StatCard icon={Circle} label="Bleached" value={classCounts.bleached} accent="slate" />
          <StatCard icon={Circle} label="Dead" value={classCounts.dead} accent="red" />
          <StatCard icon={Circle} label="Algae" value={classCounts.algae} accent="green" />
        </div>

        {/* Chart */}
        <div className="mb-8 rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 shadow-lg shadow-black/20">
          <h2 className="mb-4 text-base font-semibold text-white">
            Distribusi Hasil Klasifikasi
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 8,
                    color: "#e2e8f0",
                  }}
                />
                <Bar dataKey="jumlah" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabel User */}
        <div className="mb-8 rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 shadow-lg shadow-black/20">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-white">Data Pengguna</h2>
            <div className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-1.5">
              <Search size={15} className="text-slate-500" />
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Cari user..."
                className="w-40 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-3 pr-4">ID</th>
                  <th className="pb-3 pr-4">Username</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3">Tanggal Registrasi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      Memuat data...
                    </td>
                  </tr>
                ) : userPage.paged.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      {error ? "Data tidak tersedia (koneksi API bermasalah)." : "Tidak ada data."}
                    </td>
                  </tr>
                ) : (
                  userPage.paged.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-slate-800/60 transition-colors hover:bg-slate-700/20"
                    >
                      <td className="py-3 pr-4 text-slate-400">#{u.id}</td>
                      <td className="py-3 pr-4 font-medium text-slate-200">
                        {u.username ?? u.nama}
                      </td>
                      <td className="py-3 pr-4 text-slate-400">{u.email}</td>
                      <td className="py-3 text-slate-400">
                        {u.tanggal_registrasi ?? u.created_at ?? "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination pagination={userPage} />
        </div>

        {/* Tabel Prediksi */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 shadow-lg shadow-black/20">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-white">Riwayat Klasifikasi</h2>
            <div className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-1.5">
              <Search size={15} className="text-slate-500" />
              <input
                value={predSearch}
                onChange={(e) => setPredSearch(e.target.value)}
                placeholder="Cari klasifikasi..."
                className="w-40 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-3 pr-4">ID</th>
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 pr-4">Hasil</th>
                  <th className="pb-3 pr-4">Confidence</th>
                  <th className="pb-3">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      Memuat data...
                    </td>
                  </tr>
                ) : predPage.paged.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      {error ? "Data tidak tersedia (koneksi API bermasalah)." : "Tidak ada data."}
                    </td>
                  </tr>
                ) : (
                  predPage.paged.map((p) => {
                    const key = normalizeClass(p.hasil ?? p.kelas ?? p.prediksi ?? p.result);
                    const style = CLASS_STYLES[key];
                    const conf = p.confidence ?? p.akurasi ?? 0;
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-slate-800/60 transition-colors hover:bg-slate-700/20"
                      >
                        <td className="py-3 pr-4 text-slate-400">#{p.id}</td>
                        <td className="py-3 pr-4 font-medium text-slate-200">
                          {p.user ?? p.username ?? "-"}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${style.badge}`}
                          >
                            {style.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <ProgressBar value={conf <= 1 ? conf * 100 : conf} />
                        </td>
                        <td className="py-3 text-slate-400">
                          {p.tanggal ?? p.created_at ?? "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination pagination={predPage} />
        </div>
      </main>
    </div>
  );
}

function Pagination({ pagination }) {
  const { page, setPage, totalPages } = pagination;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
      <span>
        Halaman {page} dari {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 text-slate-300 transition-colors hover:bg-slate-700/40 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 text-slate-300 transition-colors hover:bg-slate-700/40 disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
