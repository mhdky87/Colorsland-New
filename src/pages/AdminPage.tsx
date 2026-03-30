import { useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";

function getNumericPrice(price: any): number {
  if (typeof price === "number") return price;

  if (typeof price === "string") {
    return Number(price.replace(/[^0-9.]/g, "")) || 0;
  }

  return 0;
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusColor(status: string) {
  switch (status) {
    case "approved":
      return "#1e8e3e";
    case "processing":
      return "#2563eb";
    case "partially_approved":
      return "#d97706";
    case "alternative_offered":
      return "#7c3aed";
    case "rejected":
      return "#c0392b";
    case "pending_review":
    default:
      return "#b7791f";
  }
}

export default function AdminPage() {
  const isAdmin = localStorage.getItem("admin");

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const storedCustomers = JSON.parse(
      localStorage.getItem("customers") || "[]"
    );
    setCustomers(storedCustomers);

    const storedOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    setOrders(storedOrders);
  }, []);

  const parentOrders = useMemo(() => {
    return orders.filter((order) => !order.parentOrderId);
  }, [orders]);

  const childOrders = useMemo(() => {
    return orders.filter((order) => order.parentOrderId);
  }, [orders]);

  return (
    <section
      style={{
        maxWidth: "1320px",
        margin: "0 auto",
        padding: "60px 24px 90px",
      }}
    >
      <h1 style={{ fontSize: "40px", marginBottom: "30px", color: "#222" }}>
        Admin Dashboard
      </h1>

      {/* CREATE CUSTOMER */}
      <div style={card}>
        <h2 style={sectionTitle}>Create Customer</h2>

        <div style={{ display: "grid", gap: "10px", maxWidth: "420px" }}>
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={input}
          />

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
          />

          <input
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
          />

          <button
            onClick={() => {
              if (!name || !email || !password) {
                alert("Fill all fields");
                return;
              }

              const emailExists = customers.some(
                (customer) =>
                  customer.email.toLowerCase() === email.toLowerCase()
              );

              if (emailExists) {
                alert("This email already exists");
                return;
              }

              const newCustomer = {
                id: Date.now(),
                name,
                email,
                password,
                company: "",
                phone: "",
                city: "",
              };

              const updated = [...customers, newCustomer];

              setCustomers(updated);
              localStorage.setItem("customers", JSON.stringify(updated));

              setName("");
              setEmail("");
              setPassword("");
            }}
            style={btn}
          >
            Create
          </button>
        </div>
      </div>

      {/* CUSTOMERS LIST */}
      <div style={card}>
        <h2 style={sectionTitle}>Customers</h2>

        {customers.length === 0 && <p>No customers yet</p>}

        <div style={{ display: "grid", gap: "14px" }}>
          {customers.map((c) => (
            <div key={c.id} style={itemCard}>
              <div style={{ marginBottom: "6px" }}>
                <strong>{c.name}</strong> — {c.email}
              </div>

              <div style={{ fontSize: "13px", color: "#777" }}>
                Password: {c.password}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ORDERS */}
      <div style={card}>
        <h2 style={sectionTitle}>All Orders</h2>

        {parentOrders.length === 0 && <p>No orders</p>}

        <div style={{ display: "grid", gap: "20px" }}>
          {parentOrders.map((parentOrder) => {
            const relatedGrowerOrders = childOrders.filter(
              (child) => child.parentOrderId === parentOrder.id
            );

            const totalItems = relatedGrowerOrders.reduce((sum, growerOrder) => {
              return (
                sum +
                (growerOrder.items || []).reduce(
                  (itemsSum: number, item: any) => itemsSum + item.quantity,
                  0
                )
              );
            }, 0);

            const totalPrice = relatedGrowerOrders.reduce((sum, growerOrder) => {
              return (
                sum +
                (growerOrder.items || []).reduce((itemsSum: number, item: any) => {
                  const price = getNumericPrice(item.price);
                  return itemsSum + price * item.quantity;
                }, 0)
              );
            }, 0);

            const needsAction = relatedGrowerOrders.some((growerOrder) =>
              (growerOrder.items || []).some(
                (item: any) => item.status === "alternative"
              )
            );

            return (
              <div key={parentOrder.id} style={orderCard}>
                {/* Parent Header */}
                <div style={orderHeader}>
                  <div>
                    <h3
                      style={{
                        margin: "0 0 10px",
                        fontSize: "24px",
                        color: "#222",
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>Order #{parentOrder.id}</span>

                      {needsAction && (
                        <span style={needsActionBadge}>Needs Action</span>
                      )}
                    </h3>

                    <div style={{ display: "grid", gap: "6px", color: "#555" }}>
                      <span>
                        <strong>Name:</strong> {parentOrder.customer?.name}
                      </span>
                      <span>
                        <strong>Phone:</strong> {parentOrder.customer?.phone}
                      </span>
                      <span>
                        <strong>City:</strong> {parentOrder.customer?.city}
                      </span>
                      {parentOrder.customer?.company && (
                        <span>
                          <strong>Company:</strong>{" "}
                          {parentOrder.customer.company}
                        </span>
                      )}
                      {parentOrder.customer?.email && (
                        <span>
                          <strong>Email:</strong> {parentOrder.customer.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ minWidth: "240px" }}>
                    <div style={{ display: "grid", gap: "10px", color: "#555" }}>
                      <div style={summaryRow}>
                        <span>Status</span>
                        <span
                          style={{
                            ...badgeStyle,
                            background: getStatusColor(parentOrder.status),
                          }}
                        >
                          {formatStatus(parentOrder.status)}
                        </span>
                      </div>

                      <div style={summaryRow}>
                        <span>Growers</span>
                        <strong>{relatedGrowerOrders.length}</strong>
                      </div>

                      <div style={summaryRow}>
                        <span>Total Items</span>
                        <strong>{totalItems}</strong>
                      </div>

                      <div style={summaryRow}>
                        <span>Total</span>
                        <strong>${totalPrice.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Child Orders */}
                <div style={{ padding: "22px" }}>
                  <h4 style={{ margin: "0 0 16px", fontSize: "20px" }}>
                    Grower Orders
                  </h4>

                  <div style={{ display: "grid", gap: "16px" }}>
                    {relatedGrowerOrders.map((growerOrder) => {
                      const growerTotal = (growerOrder.items || []).reduce(
                        (sum: number, item: any) => {
                          const price = getNumericPrice(item.price);
return sum + price * item.quantity;
                        },
                        0
                      );

                      const growerNeedsAction = (growerOrder.items || []).some(
                        (item: any) => item.status === "alternative"
                      );

                      return (
                        <div key={growerOrder.id} style={growerCard}>
                          <div style={growerCardHeader}>
                            <div>
                              <h5
                                style={{
                                  margin: "0 0 6px",
                                  fontSize: "18px",
                                  color: "#222",
                                  display: "flex",
                                  gap: "8px",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                }}
                              >
                                <span>Grower: {growerOrder.grower}</span>

                                {growerNeedsAction && (
                                  <span style={needsActionBadge}>
                                    Needs Action
                                  </span>
                                )}
                              </h5>

                              <p
                                style={{
                                  margin: 0,
                                  color: "#666",
                                  fontSize: "14px",
                                }}
                              >
                                Segment ID: {growerOrder.id}
                              </p>
                            </div>

                            <span
                              style={{
                                ...badgeStyle,
                                background: getStatusColor(growerOrder.status),
                              }}
                            >
                              {formatStatus(growerOrder.status)}
                            </span>
                          </div>

                          <div style={{ padding: "18px" }}>
                            <div style={{ display: "grid", gap: "12px" }}>
                              {(growerOrder.items || []).map(
                                (item: any, index: number) => (
                                  <div key={index} style={itemRow}>
                                    <div>
                                      <div
                                        style={{
                                          fontWeight: 600,
                                          color: "#222",
                                          marginBottom: "4px",
                                        }}
                                      >
                                        {item.name}
                                      </div>

                                      <div
                                        style={{
                                          fontSize: "14px",
                                          color: "#666",
                                        }}
                                      >
                                        Qty: {item.quantity}
                                      </div>

                                      <div style={{ marginTop: "6px" }}>
                                        {item.status === "approved" && (
                                          <span
                                            style={{
                                              color: "#1e8e3e",
                                              fontSize: "13px",
                                            }}
                                          >
                                            ✔ Available
                                          </span>
                                        )}

                                        {item.status === "rejected" && (
                                          <span
                                            style={{
                                              color: "#c0392b",
                                              fontSize: "13px",
                                            }}
                                          >
                                            ❌ Not Available
                                          </span>
                                        )}

                                        {item.status === "alternative" && (
                                          <div
                                            style={{
                                              marginTop: "6px",
                                              fontSize: "13px",
                                            }}
                                          >
                                            <span style={{ color: "#7c3aed" }}>
                                              🔁 Alternative Offered
                                            </span>

                                            {item.alternativeName && (
                                              <div
                                                style={{
                                                  marginTop: "4px",
                                                  color: "#444",
                                                }}
                                              >
                                                → {item.alternativeName}
                                              </div>
                                            )}

                                            {item.alternativePrice && (
                                              <div style={{ color: "#444" }}>
                                                Price: ${item.alternativePrice}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {!item.status && (
                                          <span
                                            style={{
                                              color: "#b7791f",
                                              fontSize: "13px",
                                            }}
                                          >
                                            ⏳ Pending Review
                                          </span>
                                        )}
                                      </div>
                                    </div>

<div
  style={{
    textAlign: "right",
    whiteSpace: "nowrap",
    fontWeight: 600,
    color: "#222",
  }}
>
  $
  {(getNumericPrice(item.price) * item.quantity).toFixed(2)}
</div>
                                  </div>
                                )
                              )}
                            </div>

                            {growerOrder.customer?.notes && (
                              <div style={notesBox}>
                                <strong
                                  style={{
                                    display: "block",
                                    marginBottom: "6px",
                                    color: "#222",
                                  }}
                                >
                                  Notes
                                </strong>
                                <span
                                  style={{
                                    color: "#666",
                                    lineHeight: 1.7,
                                    fontSize: "14px",
                                  }}
                                >
                                  {growerOrder.customer.notes}
                                </span>
                              </div>
                            )}

                            <div style={totalRow}>
                              <span style={{ color: "#555" }}>
                                Total for {growerOrder.grower}
                              </span>
                              <strong>${growerTotal.toFixed(2)}</strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const card: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: "10px",
  padding: "22px",
  marginBottom: "22px",
  background: "#fff",
};

const sectionTitle: React.CSSProperties = {
  margin: "0 0 18px",
  fontSize: "24px",
  color: "#222",
};

const input: React.CSSProperties = {
  padding: "10px",
  border: "1px solid #ddd",
  borderRadius: "4px",
};

const btn: React.CSSProperties = {
  padding: "10px",
  background: "#7dbb2f",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  borderRadius: "4px",
  fontWeight: 600,
};

const itemCard: React.CSSProperties = {
  padding: "14px 0",
  borderBottom: "1px solid #eee",
};

const orderCard: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  background: "#fff",
  overflow: "hidden",
};

const orderHeader: React.CSSProperties = {
  padding: "22px 24px",
  background: "#f7f7f7",
  borderBottom: "1px solid #ececec",
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  flexWrap: "wrap",
  alignItems: "center",
};

const summaryRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
};

const badgeStyle: React.CSSProperties = {
  color: "#fff",
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const needsActionBadge: React.CSSProperties = {
  background: "#f97316",
  color: "#fff",
  padding: "4px 8px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const growerCard: React.CSSProperties = {
  border: "1px solid #ececec",
  borderRadius: "8px",
  overflow: "hidden",
};

const growerCardHeader: React.CSSProperties = {
  padding: "16px 18px",
  background: "#fcfcfc",
  borderBottom: "1px solid #ececec",
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  flexWrap: "wrap",
  alignItems: "center",
};

const itemRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  padding: "12px 0",
  borderBottom: "1px solid #f1f1f1",
  alignItems: "center",
};

const notesBox: React.CSSProperties = {
  marginTop: "16px",
  padding: "14px 16px",
  background: "#fafafa",
  border: "1px solid #ececec",
  borderRadius: "6px",
};

const totalRow: React.CSSProperties = {
  marginTop: "16px",
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "center",
  paddingTop: "12px",
  borderTop: "1px solid #ececec",
};