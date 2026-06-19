export default function Reports({ mobile, search, setSearch, filterType, setFilterType, startDate, setStartDate, endDate, setEndDate, filteredTransactions, inp }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div className="card" style={{ padding: mobile ? "14px 18px" : "16px 20px", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "4px", height: "20px", borderRadius: "2px", background: "var(--accent)" }} />
          <h1 style={{ margin: 0, fontSize: mobile ? "17px" : "20px", fontWeight: "700", color: "var(--foreground)", letterSpacing: "-0.03em" }}>Filter</h1>
        </div>
      </div>
      <div className="card" style={{ padding: mobile ? "16px" : "20px", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(4, 1fr)", gap: "10px", marginBottom: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "600", color: "var(--foreground)" }}>Search</label>
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input" style={{ padding: "10px 12px", fontSize: "14px", borderRadius: "10px" }} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "600", color: "var(--foreground)" }}>Type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ ...inp, cursor: "pointer", padding: "10px 12px", fontSize: "14px", borderRadius: "10px" }}>
              <option value="All">All</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "600", color: "var(--foreground)" }}>From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" style={{ padding: "10px 12px", fontSize: "14px", borderRadius: "10px" }} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "600", color: "var(--foreground)" }}>To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" style={{ padding: "10px 12px", fontSize: "14px", borderRadius: "10px" }} />
          </div>
        </div>
        <button onClick={() => { setSearch(""); setFilterType("All"); setStartDate(""); setEndDate(""); }} className="btn btn-secondary" style={{ padding: "6px 14px", fontSize: "12px", borderRadius: "8px" }}>Reset Filters</button>
      </div>
      <div className="card" style={{ padding: mobile ? "14px" : "18px", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
        <h2 style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: "600", color: "var(--foreground)" }}>Results ({filteredTransactions.length})</h2>
        {filteredTransactions.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--muted-foreground)", fontSize: "13px" }}>No matching transactions</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredTransactions.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: "500", color: "var(--foreground)" }}>{item.description}</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--muted-foreground)" }}>{item.category} &middot; {item.date}</p>
                </div>
                <span style={{ fontWeight: "600", fontSize: "14px", color: item.type === "income" ? "var(--green)" : "var(--destructive)", whiteSpace: "nowrap", marginLeft: "8px" }}>
                  {item.type === "income" ? "+" : "-"}₹{item.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
