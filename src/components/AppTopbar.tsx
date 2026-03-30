export default function AppTopbar() {
  return (
    <header
      style={{
        height: "64px",
        background: "#fff",
        borderBottom: "1px solid #e5e5e5",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <input
        type="text"
        placeholder="Search..."
        style={{
          width: "280px",
          maxWidth: "100%",
          padding: "10px 12px",
          borderRadius: "10px",
          border: "1px solid #ddd",
          outline: "none",
          background: "#fafafa",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <span style={{ fontSize: "20px", cursor: "pointer" }}>🛒</span>
        <span style={{ fontSize: "20px", cursor: "pointer" }}>🔔</span>
        <span
          style={{
            padding: "8px 12px",
            borderRadius: "999px",
            background: "#111",
            color: "#fff",
            fontWeight: 700,
            fontSize: "13px",
          }}
        >
          CL
        </span>
      </div>
    </header>
  );
}