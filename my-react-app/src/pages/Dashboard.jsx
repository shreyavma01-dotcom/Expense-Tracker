import { Wallet, TrendingUp, TrendingDown, User } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const cardStyle = { border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" };

export default function Dashboard({ mobile, currentUser, transactions }) {
  const totalIncome = transactions.filter((tx) => tx.type === "income").reduce((a, tx) => a + Number(tx.amount), 0);
  const totalExpense = transactions.filter((tx) => tx.type === "expense").reduce((a, tx) => a + Number(tx.amount), 0);
  const balance = totalIncome - totalExpense;
  const savingRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : "0";
  const recentTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const chartData = [{ name: "Income", amount: totalIncome }, { name: "Expense", amount: totalExpense }];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="card" style={{ padding: mobile ? "16px 20px" : "20px 24px", ...cardStyle }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "6px", height: "24px", borderRadius: "3px", background: "var(--accent)" }} />
          <div className="sidebar-user-avatar" style={{ width: mobile ? "36px" : "42px", height: mobile ? "36px" : "42px", fontSize: mobile ? "13px" : "14px" }}>
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User size={16} />}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--muted-foreground)" }}>Welcome back</p>
            <h1 style={{ margin: 0, fontSize: mobile ? "17px" : "20px", fontWeight: "700", color: "var(--foreground)", letterSpacing: "-0.03em" }}>{currentUser?.name || "User"}</h1>
          </div>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--accent)", padding: "5px 12px", borderRadius: "8px", background: "color-mix(in srgb, var(--accent) 10%, transparent)", whiteSpace: "nowrap" }}>
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </div>
      <div className="grid-4">
        {[
          { title: "Balance", value: `₹${Number(balance).toLocaleString("en-IN")}`, icon: <Wallet size={18} />, color: "var(--green)", bg: "var(--green-bg)" },
          { title: "Income", value: `₹${Number(totalIncome).toLocaleString("en-IN")}`, icon: <TrendingUp size={18} />, color: "var(--blue)", bg: "var(--blue-bg)" },
          { title: "Expense", value: `₹${Number(totalExpense).toLocaleString("en-IN")}`, icon: <TrendingDown size={18} />, color: "var(--orange)", bg: "var(--orange-bg)" },
          { title: "Savings", value: `${savingRate}%`, icon: <TrendingUp size={18} />, color: "var(--purple)", bg: "var(--purple-bg)" },
        ].map((card, i) => (
          <div key={i} className="card" style={{ padding: mobile ? "14px" : "18px", ...cardStyle }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: card.bg, color: card.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{card.icon}</div>
              <span style={{ fontSize: "20px", fontWeight: "700", color: card.color, lineHeight: 1 }}>↑</span>
            </div>
            <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "var(--muted-foreground)", textTransform: "uppercase" }}>{card.title}</p>
            <h2 style={{ margin: "3px 0 0", fontSize: mobile ? "17px" : "20px", fontWeight: "700", color: "var(--foreground)", letterSpacing: "-0.03em" }}>{card.value}</h2>
          </div>
        ))}
      </div>
      <div className="grid-3">
        <div className="card" style={{ padding: mobile ? "18px" : "22px", ...cardStyle, gridColumn: mobile ? "1 / -1" : "span 2" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <div style={{ width: "4px", height: "18px", borderRadius: "2px", background: "var(--accent)" }} />
            <h2 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "var(--foreground)" }}>Income vs Expense</h2>
          </div>
          <div style={{ width: "100%", height: mobile ? "220px" : "280px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 13 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 13 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "none", borderRadius: "12px", color: "var(--foreground)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }} />
                <Bar dataKey="amount" barSize={mobile ? 32 : 42} radius={[8, 8, 0, 0]}>
                  <Cell fill="var(--green)" />
                  <Cell fill="var(--destructive)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card" style={{ padding: mobile ? "14px" : "18px", ...cardStyle, gridColumn: mobile ? "1 / -1" : "span 1" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <div style={{ width: "4px", height: "18px", borderRadius: "2px", background: "var(--accent)" }} />
            <h2 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "var(--foreground)" }}>Recent</h2>
          </div>
          {recentTransactions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px", color: "var(--muted-foreground)", fontSize: "13px" }}>No transactions yet</div>
          ) : recentTransactions.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 0" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: item.type === "income" ? "var(--green-bg)" : "color-mix(in srgb, var(--destructive) 10%, transparent)", color: item.type === "income" ? "var(--green)" : "var(--destructive)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
                {item.type === "income" ? "↑" : "↓"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: "500", color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</p>
                <p style={{ margin: 0, fontSize: "11px", color: "var(--muted-foreground)" }}>{item.category}</p>
              </div>
              <span style={{ fontWeight: "600", fontSize: "13px", color: item.type === "income" ? "var(--green)" : "var(--destructive)", whiteSpace: "nowrap" }}>
                {item.type === "income" ? "+" : "-"}₹{Number(item.amount).toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
