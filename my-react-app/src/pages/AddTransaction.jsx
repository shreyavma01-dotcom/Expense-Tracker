import { ArrowDown, ArrowUp } from "lucide-react";

export default function AddTransaction({ mobile, type, setType, amount, setAmount, category, setCategory, date, setDate, description, setDescription, addTransaction, inp }) {
  const quickAmounts = [100, 500, 1000, 5000];

  const activeColor = type === "Expense" ? "var(--destructive)" : "var(--green)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1, height: "100%", overflow: "hidden", padding: mobile ? "10px" : "2px" }}>
      <div className="card" style={{ padding: mobile ? "14px 18px" : "16px 20px", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "4px", height: "20px", borderRadius: "2px", background: activeColor }} />
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: mobile ? "17px" : "20px", fontWeight: "700", color: "var(--foreground)", letterSpacing: "-0.03em" }}>New Transaction</h1>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--muted-foreground)" }}>Record income or expense</p>
          </div>
        </div>
      </div>
      <div className="card" style={{ padding: mobile ? "16px" : "22px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
        <form onSubmit={addTransaction} style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
          <div style={{ display: "flex", gap: "8px", background: "var(--secondary)", padding: "4px", borderRadius: "12px" }}>
            {["Expense", "Income"].map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                style={{
                  flex: 1, padding: "9px", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                  fontSize: "13px", fontWeight: type === t ? "600" : "500",
                  background: type === t ? "var(--card)" : "transparent",
                  color: type === t ? (t === "Expense" ? "var(--destructive)" : "var(--green)") : "var(--muted-foreground)",
                  boxShadow: type === t ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.15s ease",
                }}>
                {t === "Expense" ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                {t}
              </button>
            ))}
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: "600", color: "var(--foreground)" }}>Amount</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "18px", fontWeight: "700", color: "var(--muted-foreground)" }}>₹</span>
              <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)}
                style={{ ...inp, padding: "14px 14px 14px 36px", fontSize: "22px", fontWeight: "700", borderRadius: "12px", border: type === "Expense" ? "1.5px solid color-mix(in srgb, var(--destructive) 20%, transparent)" : "1.5px solid color-mix(in srgb, var(--green) 20%, transparent)" }} />
            </div>
            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
              {quickAmounts.map((q) => (
                <button key={q} type="button" onClick={() => setAmount(String(q))}
                  style={{ flex: 1, padding: "6px 0", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: Number(amount) === q ? "600" : "500", background: Number(amount) === q ? activeColor : "var(--secondary)", color: Number(amount) === q ? "white" : "var(--muted-foreground)", transition: "all 0.12s ease" }}>
                  ₹{q}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: "600", color: "var(--foreground)" }}>Category</label>
            <input type="text" placeholder="e.g. Food, Rent, Salary..." value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inp, padding: "10px 12px", borderRadius: "10px", fontSize: "14px" }} />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: "600", color: "var(--foreground)" }}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inp, padding: "10px 12px", borderRadius: "10px", fontSize: "14px" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: "600", color: "var(--foreground)" }}>Note</label>
              <input type="text" placeholder="Add a note..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inp, padding: "10px 12px", borderRadius: "10px", fontSize: "14px" }} />
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button type="submit" style={{
            height: "48px", border: "none", borderRadius: "12px", cursor: "pointer", fontSize: "15px", fontWeight: "600",
            background: type === "Expense"
              ? "linear-gradient(135deg, var(--destructive), #b91c1c)"
              : "linear-gradient(135deg, var(--green), #047857)",
            color: "white",
            boxShadow: type === "Expense"
              ? "0 8px 24px color-mix(in srgb, var(--destructive) 25%, transparent)"
              : "0 8px 24px color-mix(in srgb, var(--green) 25%, transparent)",
            transition: "all 0.15s ease",
          }}>
            {type === "Expense" ? "Add Expense" : "Add Income"}
          </button>
        </form>
      </div>
    </div>
  );
}
