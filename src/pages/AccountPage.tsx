import { Navigate, Link } from "react-router-dom";

export default function AccountPage() {
  const customerRaw = localStorage.getItem("customer");

  if (!customerRaw) {
    return <Navigate to="/login" replace />;
  }

  let customer: any = null;

  try {
    customer = JSON.parse(customerRaw);
  } catch {
    customer = { name: customerRaw };
  }

  const customerName =
    customer?.name || customer?.fullName || "Customer";
  const customerEmail = customer?.email || "Not provided";
  const customerCompany = customer?.company || "Not provided";
  const customerPhone = customer?.phone || "Not provided";
  const customerCity = customer?.city || "Not provided";

  return (
    <section
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "80px 24px",
      }}
    >
      <h1
        style={{
          fontSize: "42px",
          margin: "0 0 14px",
          color: "#222",
        }}
      >
        My Account
      </h1>

      <p
        style={{
          margin: "0 0 30px",
          color: "#666",
          lineHeight: 1.8,
          fontSize: "16px",
        }}
      >
        Manage your account information and access your orders from one place.
      </p>

      <div
        style={{
          border: "1px solid #ececec",
          borderRadius: "10px",
          background: "#fff",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "22px 24px",
            background: "#f7f7f7",
            borderBottom: "1px solid #ececec",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "24px",
              color: "#222",
            }}
          >
            Customer Information
          </h2>
        </div>

        <div
          style={{
            padding: "24px",
            display: "grid",
            gap: "16px",
          }}
        >
          <div style={infoRowStyle}>
            <span style={labelStyle}>Name</span>
            <strong style={valueStyle}>{customerName}</strong>
          </div>

          <div style={infoRowStyle}>
            <span style={labelStyle}>Email</span>
            <strong style={valueStyle}>{customerEmail}</strong>
          </div>

          <div style={infoRowStyle}>
            <span style={labelStyle}>Company</span>
            <strong style={valueStyle}>{customerCompany}</strong>
          </div>

          <div style={infoRowStyle}>
            <span style={labelStyle}>Phone</span>
            <strong style={valueStyle}>{customerPhone}</strong>
          </div>

          <div style={infoRowStyle}>
            <span style={labelStyle}>City</span>
            <strong style={valueStyle}>{customerCity}</strong>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "12px",
            }}
          >
            <Link to="/orders" style={{ textDecoration: "none" }}>
              <button style={primaryButtonStyle}>View My Orders</button>
            </Link>

            <Link to="/shop" style={{ textDecoration: "none" }}>
              <button style={secondaryButtonStyle}>Continue Shopping</button>
            </Link>

            <button
              onClick={() => {
                localStorage.removeItem("customer");
                window.location.href = "/login";
              }}
              style={dangerButtonStyle}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const infoRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  paddingBottom: "12px",
  borderBottom: "1px solid #f1f1f1",
  flexWrap: "wrap",
};

const labelStyle: React.CSSProperties = {
  color: "#666",
  fontSize: "15px",
};

const valueStyle: React.CSSProperties = {
  color: "#222",
  fontSize: "15px",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "12px 18px",
  background: "#7dbb2f",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: 600,
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "12px 18px",
  background: "#fff",
  color: "#222",
  border: "1px solid #ddd",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: 600,
};

const dangerButtonStyle: React.CSSProperties = {
  padding: "12px 18px",
  background: "#c0392b",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: 600,
};