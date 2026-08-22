import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  LayoutDashboard, ArrowRightLeft, BarChart3, FileText, PlusCircle, Trash2, Wallet, LogOut, Pencil, Moon, Sun, User,
} from "lucide-react";
import axios from "axios";
import { API_URL } from "./api.js";
import Dashboard from "./pages/Dashboard.jsx";
import AddTransaction from "./pages/AddTransaction.jsx";
import Reports from "./pages/Reports.jsx";

const useMobile = () => {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return mobile;
};

function Toast({ message, type, onClose }) {
  const dotColor = type === "success" ? "var(--green)" : type === "error" ? "var(--destructive)" : "var(--blue)";
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="toast">
      <span className="toast-dot" style={{ background: dotColor }} />
      {message}
    </div>
  );
}

function ExpenseTracker() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const mobile = useMobile();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState("Expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showSignup, setShowSignup] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.style.colorScheme = theme;
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);

  const toggleTheme = () => setTheme((p) => (p === "light" ? "dark" : "light"));

  const loadTransactions = useCallback(async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_URL}/api/transactions`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  }, []);

  const handleRequestError = useCallback((error, errorMessage, failureToast) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      setIsLoggedIn(false);
      setCurrentUser(null);
      showToast("Session expired. Please sign in again.", "error");
    } else {
      setError(errorMessage);
      if (failureToast) showToast(failureToast, "error");
    }
  }, [showToast]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setTransactions(await loadTransactions());
    } catch (error) {
      handleRequestError(error, "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  }, [loadTransactions, handleRequestError]);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    loadTransactions()
      .then((data) => { if (!cancelled) setTransactions(data); })
      .catch((error) => { if (!cancelled) handleRequestError(error, "Failed to fetch transactions"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isLoggedIn, loadTransactions, handleRequestError]);

  const addTransaction = async (e) => {
    e.preventDefault();
    if (!amount || !category || !date || !description) { showToast("Please fill all fields", "error"); return; }
    try {
      setLoading(true); setError("");
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/api/transactions`, {
        title: description, amount: Number(amount), type: type.toLowerCase(), category, description, date,
      }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      await fetchTransactions();
      setAmount(""); setCategory(""); setDate(""); setDescription(""); setType("Expense");
      showToast("Transaction added");
    } catch (error) { handleRequestError(error, "Failed to add transaction", "Failed to add"); }
    finally { setLoading(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setLoading(true); setError("");
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/transactions/${deleteTarget}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await fetchTransactions();
      showToast("Transaction deleted");
      setDeleteTarget(null);
    } catch (error) { handleRequestError(error, "Failed to delete", "Failed to delete"); }
    finally { setLoading(false); }
  };

  const saveEdit = async () => {
    try {
      setLoading(true); setError("");
      const token = localStorage.getItem("token");
      await axios.put(`${API_URL}/api/transactions/${editingId}`, { ...editData, amount: Number(editData.amount) }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await fetchTransactions();
      setEditingId(null);
      showToast("Transaction updated");
    } catch (error) { handleRequestError(error, "Failed to update", "Failed to update"); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) await axios.post(`${API_URL}/api/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Best-effort server logout; local session is cleared regardless.
    }
    localStorage.removeItem("token");
    setIsLoggedIn(false); setCurrentUser(null);
  };

  const totalIncome = transactions.filter((tx) => tx.type === "income").reduce((a, tx) => a + Number(tx.amount), 0);
  const totalExpense = transactions.filter((tx) => tx.type === "expense").reduce((a, tx) => a + Number(tx.amount), 0);

  const categoryData = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((acc, item) => {
      let cat = item.category.toLowerCase();
      if (cat === "travel" || cat === "transport") cat = "Transport";
      else cat = cat.charAt(0).toUpperCase() + cat.slice(1);
      const existing = acc.find((d) => d.name === cat);
      if (existing) existing.value += Number(item.amount);
      else acc.push({ name: cat, value: Number(item.amount) });
      return acc;
    }, []);

  const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  const filteredTransactions = transactions.filter((item) => {
    const matchesSearch = (item.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "All" || item.type === filterType;
    const matchesStartDate = !startDate || new Date(item.date) >= new Date(startDate);
    const matchesEndDate = !endDate || new Date(item.date) <= new Date(endDate);
    return matchesSearch && matchesType && matchesStartDate && matchesEndDate;
  });

  const chartData = [{ name: "Income", amount: totalIncome }, { name: "Expense", amount: totalExpense }];

  const registerUser = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/register`, { name: signupName, email: signupEmail, password: signupPassword });
      setShowSignup(false);
      setSignupName(""); setSignupEmail(""); setSignupPassword("");
      showToast("Account created! Sign in to continue.");
    } catch { showToast("Signup failed", "error"); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email: loginEmail, password: loginPassword });
      if (res.data) {
        if (res.data.token) localStorage.setItem("token", res.data.token);
        setIsLoggedIn(true);
        setCurrentUser(res.data.user);
        showToast("Welcome back!");
      }
    } catch { showToast("Invalid credentials", "error"); }
  };

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { key: "add", label: "Add", icon: <PlusCircle size={18} /> },
    { key: "transactions", label: "Transactions", icon: <ArrowRightLeft size={18} /> },
    { key: "analytics", label: "Analytics", icon: <BarChart3 size={18} /> },
    { key: "reports", label: "Filter", icon: <FileText size={18} /> },
  ];

  const inp = {
    width: "100%", padding: "10px 14px", borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border)", outline: "none", fontSize: "var(--text-sm)",
    background: "var(--input)", color: "var(--foreground)", boxSizing: "border-box",
    fontFamily: "var(--font-sans)",
  };

  if (!isLoggedIn) {
    const formContent = (
      <div className="card" style={{ padding: mobile ? "32px 24px" : "40px", width: "100%", border: "1px solid var(--border)", background: "var(--card)", borderRadius: "var(--radius-2xl)", boxShadow: "0 25px 60px -12px rgba(0,0,0,0.12)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <h1 className="page-title" style={{ fontSize: "24px", margin: 0 }}>
              {showSignup ? "Create an account" : "Sign in"}
            </h1>
            <p className="page-subtitle" style={{ margin: "6px 0 0" }}>
              {showSignup ? "Start tracking your expenses" : "Welcome back to Expense Tracker"}
            </p>
          </div>
          <button onClick={toggleTheme} className="btn-ghost" style={{ border: "1px solid var(--border)", padding: "8px" }}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
        {showSignup ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {[{ label: "Full name", placeholder: "John Doe", val: signupName, set: setSignupName, type: "text" },
              { label: "Email", placeholder: "m@example.com", val: signupEmail, set: setSignupEmail, type: "email" },
              { label: "Password", placeholder: "Create a password", val: signupPassword, set: setSignupPassword, type: "password" },
            ].map((f) => (
              <div key={f.label}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: "600", color: "var(--foreground)" }}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={f.val} onChange={(e) => f.set(e.target.value)} className="input" />
              </div>
            ))}
            <button onClick={registerUser} className="btn btn-primary" style={{ marginTop: "12px", height: "44px", width: "100%" }}>Create account</button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "6px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: "600", color: "var(--foreground)" }}>Email</label>
              <input type="email" placeholder="m@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="input" />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: "600", color: "var(--foreground)" }}>Password</label>
              <input type="password" placeholder="Enter your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="input" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: "20px", height: "44px", width: "100%" }}>Sign in</button>
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ position: "relative" }}>
                <div style={{ borderBottom: "1px solid var(--border)" }} />
                <span style={{ position: "absolute", top: "-8px", left: "50%", transform: "translateX(-50%)", background: "var(--card)", padding: "0 10px", fontSize: "12px", color: "var(--muted-foreground)" }}>or</span>
              </div>
              <button type="button" onClick={() => { setLoginEmail("admin@example.com"); setLoginPassword("ChangeMe123!"); }}
                className="btn btn-secondary" style={{ height: "44px", width: "100%", display: "flex", gap: "8px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
                Demo Admin Login
              </button>
            </div>
          </form>
        )}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button onClick={() => setShowSignup(!showSignup)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "var(--accent)", fontWeight: "500" }}>
            {showSignup ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    );

    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "var(--background)", padding: "16px", fontFamily: "var(--font-sans)" }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>{formContent}</div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      </div>
    );
  }

  const emptyState = (msg, sub) => (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Wallet size={22} />
      </div>
      <p style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "600", color: "var(--foreground)" }}>{msg}</p>
      {sub && <p style={{ margin: 0, fontSize: "13px", color: "var(--muted-foreground)" }}>{sub}</p>}
    </div>
  );

  const confirmDeleteModal = deleteTarget && (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "320px" }}>
        <div className="modal-icon" style={{ background: "color-mix(in srgb, var(--destructive) 12%, transparent)", color: "var(--destructive)" }}>
          <Trash2 size={20} />
        </div>
        <h2 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: "600", color: "var(--foreground)" }}>Delete transaction?</h2>
        <p style={{ margin: "0 0 20px", fontSize: "14px", color: "var(--muted-foreground)" }}>This action cannot be undone.</p>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={confirmDelete} className="btn btn-destructive" style={{ flex: 1, height: "44px" }}>Delete</button>
          <button onClick={() => setDeleteTarget(null)} className="btn btn-secondary" style={{ flex: 1, height: "44px" }}>Cancel</button>
        </div>
      </div>
    </div>
  );

  const sidebarContent = (
    <>
      <div className="logo" style={{ padding: "20px 20px 24px", display: "flex", alignItems: "center", gap: "10px" }}>
        <div className="logo-icon">
          <Wallet size={20} />
        </div>
        <span className="logo-text">Finance</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, padding: "0 12px" }}>
        {navItems.map((item) => (
          <button key={item.key} onClick={() => setActivePage(item.key)}
            className={`nav-item${activePage === item.key ? " active" : ""}`}>
            <span className="nav-item-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div className="nav-footer">
          <button onClick={toggleTheme} className="nav-item">
            <span className="nav-item-icon">{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</span>
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button onClick={handleLogout} className="nav-item" style={{ color: "var(--destructive)" }}>
            <span className="nav-item-icon"><LogOut size={18} /></span>
            Logout
          </button>
        </div>
      </div>
      {currentUser && (
        <div className="sidebar-user" style={{ borderTop: "1px solid var(--sidebar-border)", padding: "16px 20px", margin: 0 }}>
          <div className="sidebar-user-avatar">
            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <User size={16} />}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "var(--sidebar-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.name || "User"}</p>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted-foreground)" }}>{currentUser.email || ""}</p>
          </div>
        </div>
      )}
    </>
  );

  const renderTransactions = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div className="card" style={{ padding: mobile ? "14px 18px" : "16px 20px", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "4px", height: "20px", borderRadius: "2px", background: "var(--accent)" }} />
          <h1 style={{ margin: 0, fontSize: mobile ? "17px" : "20px", fontWeight: "700", color: "var(--foreground)", letterSpacing: "-0.03em", flex: 1 }}>Transactions</h1>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted-foreground)", padding: "4px 12px", borderRadius: "8px", background: "var(--secondary)" }}>{transactions.length} total</span>
        </div>
      </div>
      {loading ? (
        <div className="card" style={{ padding: "48px", textAlign: "center", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div className="spinner" />
        </div>
      ) : transactions.length === 0 ? (
        emptyState("No transactions yet", "Add your first transaction to get started")
      ) : (
        <>
          <div className="card" style={{ padding: "14px", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(4, 1fr)", gap: "8px" }}>
              <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input" style={{ padding: "10px 12px", fontSize: "14px", borderRadius: "10px" }} />
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ ...inp, cursor: "pointer", padding: "10px 12px", fontSize: "14px", borderRadius: "10px" }}>
                <option value="All">All</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" style={{ padding: "10px 12px", fontSize: "14px", borderRadius: "10px" }} />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" style={{ padding: "10px 12px", fontSize: "14px", borderRadius: "10px" }} />
            </div>
            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
              <button onClick={() => { setSearch(""); setFilterType("All"); setStartDate(""); setEndDate(""); }} className="btn btn-secondary" style={{ padding: "6px 14px", fontSize: "12px", borderRadius: "8px" }}>Reset</button>
            </div>
          </div>
          <div className="card" style={{ padding: mobile ? "6px" : "10px", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
            {filteredTransactions.length === 0 ? (
              <div style={{ padding: "28px", textAlign: "center", color: "var(--muted-foreground)", fontSize: "13px" }}>No matching transactions</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {filteredTransactions.map((item) => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 6px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: item.type === "income" ? "var(--green-bg)" : "color-mix(in srgb, var(--destructive) 10%, transparent)", color: item.type === "income" ? "var(--green)" : "var(--destructive)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
                      {item.type === "income" ? "↑" : "↓"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: "500", color: "var(--foreground)" }}>{item.description}</p>
                      <p style={{ margin: 0, fontSize: "11px", color: "var(--muted-foreground)" }}>{item.category} &middot; {item.date}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                      <span style={{ fontWeight: "600", fontSize: "14px", color: item.type === "income" ? "var(--green)" : "var(--destructive)", whiteSpace: "nowrap", minWidth: "60px", textAlign: "right" }}>
                        {item.type === "income" ? "+" : "-"}₹{item.amount}
                      </span>
                      <button onClick={() => { setEditingId(item.id); setEditData(item); }} style={{ width: "28px", height: "28px", borderRadius: "6px", border: "none", background: "transparent", color: "var(--muted-foreground)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => setDeleteTarget(item.id)} style={{ width: "28px", height: "28px", borderRadius: "6px", border: "none", background: "transparent", color: "var(--destructive)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div className="card" style={{ padding: mobile ? "14px 18px" : "16px 20px", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "4px", height: "20px", borderRadius: "2px", background: "var(--accent)" }} />
          <h1 style={{ margin: 0, fontSize: mobile ? "17px" : "20px", fontWeight: "700", color: "var(--foreground)", letterSpacing: "-0.03em" }}>Analytics</h1>
        </div>
      </div>
      {transactions.length === 0 ? (
        emptyState("No data to analyze", "Add some transactions first")
      ) : (
        <>
          <div className="card" style={{ padding: mobile ? "18px" : "22px", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <div style={{ width: "4px", height: "18px", borderRadius: "2px", background: "var(--green)" }} />
              <h2 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "var(--foreground)" }}>Income vs Expense</h2>
            </div>
            <div style={{ width: "100%", height: mobile ? "260px" : "340px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 13 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 13 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "none", borderRadius: "12px", color: "var(--foreground)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="amount" barSize={mobile ? 32 : 48} radius={[8, 8, 0, 0]}>
                    <Cell fill="var(--green)" />
                    <Cell fill="var(--destructive)" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card" style={{ padding: mobile ? "18px" : "22px", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <div style={{ width: "4px", height: "18px", borderRadius: "2px", background: "var(--orange)" }} />
              <h2 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "var(--foreground)" }}>Spending by Category</h2>
            </div>
            <div style={{ display: "flex", gap: "24px", alignItems: "center", flexDirection: mobile ? "column" : "row" }}>
              <div style={{ width: "100%", height: mobile ? "260px" : "340px", minWidth: mobile ? "auto" : "320px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={mobile ? 60 : 80} outerRadius={mobile ? 90 : 125} paddingAngle={2} stroke="none">
                      {categoryData.map((_, i) => (<Cell key={i} fill={chartColors[i % chartColors.length]} />))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "none", borderRadius: "12px", color: "var(--foreground)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
                {categoryData.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: chartColors[i % chartColors.length] }} />
                      <span style={{ color: "var(--foreground)", fontSize: "13px", fontWeight: "500" }}>{item.name}</span>
                    </div>
                    <strong style={{ color: "var(--foreground)", fontSize: "13px" }}>₹{item.value.toLocaleString("en-IN")}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const editingModal = editingId && (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ padding: mobile ? "24px" : "28px", width: mobile ? "100%" : "380px" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: "600", color: "var(--foreground)" }}>Edit Transaction</h2>
        <select value={editData.type || ""} onChange={(e) => setEditData({ ...editData, type: e.target.value })} style={{ ...inp, marginBottom: "8px" }}>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>
        <input type="text" placeholder="Category" value={editData.category || ""} onChange={(e) => setEditData({ ...editData, category: e.target.value })} style={{ ...inp, marginBottom: "8px" }} />
        <input type="date" value={editData.date || ""} onChange={(e) => setEditData({ ...editData, date: e.target.value })} style={{ ...inp, marginBottom: "8px" }} />
        <textarea placeholder="Description" value={editData.description || ""} onChange={(e) => setEditData({ ...editData, description: e.target.value })} style={{ ...inp, minHeight: "70px", resize: "none", marginBottom: "8px" }} />
        <input type="number" placeholder="Amount" value={editData.amount || ""} onChange={(e) => setEditData({ ...editData, amount: e.target.value })} style={{ ...inp, marginBottom: "4px" }} />
        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
          <button onClick={saveEdit} className="btn btn-primary" style={{ flex: 1, height: "44px" }}>Save</button>
          <button onClick={() => setEditingId(null)} className="btn btn-secondary" style={{ flex: 1, height: "44px" }}>Cancel</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "var(--font-sans)", background: "var(--background)", color: "var(--foreground)" }}>
      {mobile ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <div className="sidebar">
            {sidebarContent}
          </div>
          <div className="header" style={{ padding: "12px 16px", display: "flex", justifyContent: "flex-end", alignItems: "center", marginLeft: "var(--sidebar-width)" }}>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <button onClick={toggleTheme} className="btn-ghost" style={{ border: "1px solid var(--border)", padding: "6px" }}>
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <button onClick={handleLogout} className="btn-ghost" style={{ color: "var(--destructive)" }}>
                <LogOut size={16} />
              </button>
            </div>
          </div>
          <div className="fade-in" style={{ flex: 1, padding: activePage === "add" ? "0" : "12px", overflow: activePage === "add" ? "hidden" : "auto", display: "flex", flexDirection: "column", gap: "12px", paddingBottom: activePage === "add" ? "0" : "80px", marginLeft: "var(--sidebar-width)" }}>
            {error && (
              <div style={{ background: "color-mix(in srgb, var(--destructive) 12%, transparent)", color: "var(--destructive)", padding: "10px 14px", borderRadius: "var(--radius-lg)", fontWeight: "500", fontSize: "13px", border: "1px solid var(--destructive)" }}>{error}</div>
            )}
            {activePage === "dashboard" && <Dashboard mobile={mobile} currentUser={currentUser} transactions={transactions} />}
            {activePage === "add" && <AddTransaction mobile={mobile} type={type} setType={setType} amount={amount} setAmount={setAmount} category={category} setCategory={setCategory} date={date} setDate={setDate} description={description} setDescription={setDescription} addTransaction={addTransaction} inp={inp} />}
            {activePage === "transactions" && renderTransactions()}
            {activePage === "analytics" && renderAnalytics()}
            {activePage === "reports" && <Reports mobile={mobile} search={search} setSearch={setSearch} filterType={filterType} setFilterType={setFilterType} startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} filteredTransactions={filteredTransactions} inp={inp} />}
          </div>
          <nav className="mobile-nav">
            {navItems.map((item) => (
              <button key={item.key} onClick={() => setActivePage(item.key)} className={`mobile-nav-item${activePage === item.key ? " active" : ""}`}>
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
          {confirmDeleteModal}
          {editingModal}
        </div>
      ) : (
        <>
          <div className="sidebar">
            {sidebarContent}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", minHeight: "100vh", marginLeft: "var(--sidebar-width)" }}>
            <div className="header" style={{ padding: "0 24px", height: "52px", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>{currentUser?.email || ""}</span>
                <div className="sidebar-user-avatar" style={{ width: "30px", height: "30px", fontSize: "12px" }}>
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User size={14} />}
                </div>
              </div>
            </div>
            <div className="fade-in" style={{ flex: 1, padding: "20px 24px", overflow: activePage === "add" ? "hidden" : "auto", display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
              {error && (
                <div style={{ background: "color-mix(in srgb, var(--destructive) 12%, transparent)", color: "var(--destructive)", padding: "10px 14px", borderRadius: "var(--radius-lg)", fontWeight: "500", fontSize: "13px", border: "1px solid var(--destructive)" }}>{error}</div>
              )}
              {activePage === "dashboard" && <Dashboard mobile={mobile} currentUser={currentUser} transactions={transactions} />}
              {activePage === "add" && <AddTransaction mobile={mobile} type={type} setType={setType} amount={amount} setAmount={setAmount} category={category} setCategory={setCategory} date={date} setDate={setDate} description={description} setDescription={setDescription} addTransaction={addTransaction} inp={inp} />}
              {activePage === "transactions" && renderTransactions()}
              {activePage === "analytics" && renderAnalytics()}
              {activePage === "reports" && <Reports mobile={mobile} search={search} setSearch={setSearch} filterType={filterType} setFilterType={setFilterType} startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} filteredTransactions={filteredTransactions} inp={inp} />}
            </div>
          </div>
          {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
          {confirmDeleteModal}
          {editingModal}
        </>
      )}
    </div>
  );
}

export default ExpenseTracker;
