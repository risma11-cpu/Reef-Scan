import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  Users,
  Waves,
  BarChart3,
  Search,
  ChevronLeft,
  ChevronRight,
  Circle,
  RefreshCw,
  Lock,
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
import "./dashboard.css";

const API_BASE = import.meta.env.VITE_API_URL || "https://cimaiiyah.pythonanywhere.com";

const CLASS_STYLES = {
  healthy: { label: "Healthy", badgeClass: "badge badge-healthy", bar: "#34d399" },
  bleached: { label: "Bleached", badgeClass: "badge badge-bleached", bar: "#cbd5e1" },
  dead: { label: "Dead", badgeClass: "badge badge-dead", bar: "#f87171" },
  algae: { label: "Algae", badgeClass: "badge badge-algae", bar: "#4ade80" },
};

function normalizeClass(raw) {
  if (!raw) return "healthy";
  const k = String(raw).toLowerCase();
  if (k.includes("bleach") || k.includes("memutih")) return "bleached";
  if (k.includes("dead") || k.includes("mati")) return "dead";
  if (k.includes("algae") || k.includes("lumut")) return "algae";
  return "healthy";
}

function CoralLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 21V13M12 13C12 13 8 12.5 8 8.5C8 6 9.5 5 11 5.5C11 5.5 10 3 12 3C14 3 13 5.5 13 5.5C14.5 5 16 6 16 8.5C16 12.5 12 13 12 13Z"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M7.5 13C7.5 13 5 12.5 5 9.5C5 7.5 6.2 7 7.2 7.5"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M16.5 13C16.5 13 19 12.5 19 9.5C19 7.5 17.8 7 16.8 7.5"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M4 21C4 21 4.5 17.5 8 17.5C10 17.5 10.5 19 12 19C13.5 19 14 17.5 16 17.5C19.5 17.5 20 21 20 21"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${accent}`}>
        <Icon size={19} />
      </div>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
}

function ProgressBar({ value }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="progress-wrap">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-value">{pct.toFixed(1)}%</span>
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
    <div className="pagination">
      <span>Halaman {page} dari {totalPages}</span>
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          <ChevronLeft size={14} />
        </button>
        <button
          className="pagination-btn"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="search-box">
      <Search size={14} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function SectionCard({ title, action, children }) {
  return (
    <div className="section-card">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const AUTH_TOKEN_KEY = "reef_admin_token";

function PasswordGate({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/api/admin/login`, { password });
      const token = res.data?.token;
      if (!token) throw new Error("no-token");
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      onSuccess();
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Password salah. Coba lagi.");
      } else {
        setError("Gagal menghubungi server. Periksa koneksi backend.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="gate-wrap">
      <div className="gate-card">
        <div className="gate-logo">
          <CoralLogo size={26} />
        </div>
        <h1 className="gate-title">REEF SCAN</h1>
        <p className="gate-subtitle">Berikan password untuk mengakses data admin</p>

        <form onSubmit={handleSubmit} className="gate-form">
          <div className="gate-input-wrap">
            <Lock size={15} />
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
            />
          </div>
          {error && <p className="gate-error">{error}</p>}
          <button type="submit" className="gate-submit" disabled={submitting}>
            {submitting ? "Memeriksa..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [authed, setAuthed] = useState(() => Boolean(sessionStorage.getItem(AUTH_TOKEN_KEY)));

  if (!authed) {
    return <PasswordGate onSuccess={() => setAuthed(true)} />;
  }

  return <DashboardContent onUnauthorized={() => setAuthed(false)} />;
}

function DashboardContent({ onUnauthorized }) {
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
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    const headers = { "X-Admin-Token": token };
    try {
      const [usersRes, predRes] = await Promise.all([
        axios.get(`${API_BASE}/api/users`, { headers }),
        axios.get(`${API_BASE}/api/prediksi-all`, { headers }),
      ]);
      if (!mountedRef.current) return;
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data ?? []);
      setPredictions(Array.isArray(predRes.data) ? predRes.data : predRes.data?.data ?? []);
      setLastUpdated(new Date());
    } catch (err) {
      if (!mountedRef.current) return;
      if (err.response?.status === 401) {
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        onUnauthorized?.();
        return;
      }
      setError(
        `Gagal mengambil data dari server. ${
          err.response ? `Status ${err.response.status}.` : "Periksa koneksi atau status backend."
        }`
      );
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [onUnauthorized]);

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

  const sortedPredictions = useMemo(() => {
    return [...predictions].sort((a, b) => {
      const dateA = new Date(a.waktu ?? a.tanggal ?? a.created_at ?? 0);
      const dateB = new Date(b.waktu ?? b.tanggal ?? b.created_at ?? 0);
      return dateB - dateA;
    });
  }, [predictions]);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const dateA = new Date(a.created_at ?? a.tanggal_registrasi ?? 0);
      const dateB = new Date(b.created_at ?? b.tanggal_registrasi ?? 0);
      return dateB - dateA;
    });
  }, [users]);

  const filteredUsers = sortedUsers.filter((u) =>
    `${u.username ?? u.nama ?? ""} ${u.email ?? ""}`.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredPreds = sortedPredictions.filter((p) => {
    const key = normalizeClass(p.hasil ?? p.kelas ?? p.prediksi ?? p.result);
    const label = CLASS_STYLES[key].label;
    const haystack = `${p.user ?? p.username ?? ""} ${label} ${p.hasil ?? p.kelas ?? p.prediksi ?? p.result ?? ""}`;
    return haystack.toLowerCase().includes(predSearch.toLowerCase());
  });
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
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Tanggal Registrasi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="table-empty">Memuat data...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="table-empty">{error ? "Data tidak tersedia." : "Tidak ada data."}</td></tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id}>
                  <td className="cell-id">#{u.id}</td>
                  <td className="cell-strong">{u.username ?? u.nama}</td>
                  <td>{u.email}</td>
                  <td>{formatDate(u.created_at ?? u.tanggal_registrasi)}</td>
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
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Hasil</th>
              <th>Confidence</th>
              <th>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="table-empty">Memuat data...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="table-empty">{error ? "Data tidak tersedia." : "Tidak ada data."}</td></tr>
            ) : (
              rows.map((p) => {
                const key = normalizeClass(p.hasil ?? p.kelas ?? p.prediksi ?? p.result);
                const style = CLASS_STYLES[key];
                const conf = p.confidence ?? p.akurasi ?? 0;
                return (
                  <tr key={p.id}>
                    <td className="cell-id">#{p.id}</td>
                    <td className="cell-strong">{p.user ?? p.username ?? "-"}</td>
                    <td><span className={style.badgeClass}>{style.label}</span></td>
                    <td><ProgressBar value={conf <= 1 ? conf * 100 : conf} /></td>
                    <td>{formatDate(p.waktu ?? p.tanggal ?? p.created_at)}</td>
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
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
        Memuat data...
      </div>
    ) : (
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="32%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1c2b3d" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} width={28} />
            <Tooltip
              cursor={{ fill: "rgba(148,163,184,0.06)" }}
              contentStyle={{ background: "#0d1826", border: "1px solid #1c2b3d", borderRadius: 10, color: "#e2e8f0", fontSize: 13 }}
            />
            <Bar dataKey="jumlah" radius={[6, 6, 0, 0]} maxBarSize={64}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );

  return (
    <div className="dashboard">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <CoralLogo size={18} />
          </div>
          <div>
            <p className="sidebar-title">REEF SCAN</p>
            <p className="sidebar-subtitle">Admin Panel</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeMenu === item.key;
            return (
              <button
                key={item.key}
                className={`nav-item ${active ? "active" : ""}`}
                onClick={() => setActiveMenu(item.key)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* CONTENT */}
      <main className="main-content">
        <div className="content-inner">
          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">{pageTitle.title}</h1>
              <p className="page-subtitle">{pageTitle.subtitle}</p>
            </div>
            <div className="header-actions">
              <button className="pill pill-btn" onClick={refresh}>
                <RefreshCw size={12} className={loading ? "spin" : ""} />
                Refresh
              </button>
              <div className="pill">
                <span
                  className={`status-dot ${
                    serverOnline === null ? "checking" : serverOnline ? "online" : "offline"
                  }`}
                />
                {serverOnline === null ? "Memeriksa..." : serverOnline ? "Server Online" : "Server Offline"}
              </div>
              <span className="pill-date">{today}</span>
            </div>
          </div>

          {error && <div className="alert-error">{error}</div>}
          {lastUpdated && !error && (
            <p className="last-updated">Terakhir diperbarui {lastUpdated.toLocaleTimeString("id-ID")}</p>
          )}

          <div className="data-source-note">
            <CoralLogo size={14} />
            Data diambil langsung dari database <strong>SQLite</strong> melalui <strong>REST API</strong> (Flask, PythonAnywhere) — bukan data statis/dummy.
          </div>

          {/* ===== DASHBOARD ===== */}
          {activeMenu === "dashboard" && (
            <div className="stack">
              <div className="stat-grid">
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
            <div className="stack">
              <SectionCard title="Distribusi Hasil Klasifikasi">{chart(360)}</SectionCard>
              <div className="stat-mini-grid">
                {Object.entries(classCounts).map(([key, count]) => {
                  const style = CLASS_STYLES[key];
                  const total = predictions.length || 1;
                  const pct = ((count / total) * 100).toFixed(1);
                  return (
                    <div key={key} className="stat-mini-card">
                      <span className={style.badgeClass}>{style.label}</span>
                      <p className="stat-mini-value">{count}</p>
                      <p className="stat-mini-sub">{pct}% dari total prediksi</p>
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
