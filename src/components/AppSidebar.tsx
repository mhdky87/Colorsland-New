import { Link, useLocation } from "react-router-dom";

const menu = [
  { name: "Dashboard", path: "/account" },
  { name: "Shop", path: "/shop" },
  { name: "Cart", path: "/cart" },
  { name: "Orders", path: "/orders" },
  { name: "Settings", path: "/settings" },
];


export default function AppSidebar() {
  const location = useLocation();

  return (
    <aside
      style={{
        width: "220px",
        height: "100vh",
        background: "#fff",
        borderRight: "1px solid #e5e5e5",
        padding: "20px 14px",
        position: "fixed",
        left: 0,
        top: 0,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          fontSize: "22px",
          fontWeight: 700,
          marginBottom: "24px",
        }}
      >
        Colorsland
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {menu.map((item) => {
          const active = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                textDecoration: "none",
                padding: "12px 14px",
                borderRadius: "10px",
                color: active ? "#111" : "#555",
                background: active ? "#f1f1f1" : "transparent",
                fontWeight: active ? 700 : 500,
                border: active ? "1px solid #e5e5e5" : "1px solid transparent",
              }}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}