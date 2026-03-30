import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <section
      style={{
        maxWidth: "520px",
        margin: "0 auto",
        padding: "100px 24px",
      }}
    >
      <h1 style={{ fontSize: "40px", marginBottom: "20px", color: "#222" }}>
        Customer Login
      </h1>

      <p
        style={{
          color: "#666",
          marginBottom: "30px",
          lineHeight: 1.8,
        }}
      >
        Login using the account created for you by the admin.
      </p>

      <div
        style={{
          border: "1px solid #eee",
          borderRadius: "8px",
          padding: "30px",
          background: "#fff",
        }}
      >
        <div style={{ display: "grid", gap: "16px" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <button
            onClick={() => {
              if (!email || !password) {
                alert("Please fill all fields");
                return;
              }

              const customers = JSON.parse(
                localStorage.getItem("customers") || "[]"
              );

              const existingCustomer = customers.find(
                (customer: any) =>
                  customer.email.toLowerCase() === email.toLowerCase() &&
                  customer.password === password
              );

              if (!existingCustomer) {
                alert("Invalid login credentials");
                return;
              }

              localStorage.setItem(
                "customer",
                JSON.stringify(existingCustomer)
              );

              navigate("/account");
            }}
            style={{
              marginTop: "10px",
              padding: "14px",
              background: "#7dbb2f",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </div>
      </div>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  border: "1px solid #ddd",
  borderRadius: "4px",
  fontSize: "14px",
};