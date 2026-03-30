import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import logo from "../assets/Icon.png";
import { useCart } from "../context/CartContext";

const linkStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "#222",
  fontSize: "15px",
  fontWeight: 500,
  letterSpacing: "0.4px",
};

const iconWrapStyle: React.CSSProperties = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
};

const iconStyle: React.CSSProperties = {
  fontSize: "20px",
  lineHeight: 1,
  cursor: "pointer",
  color: "#444",
};

const badgeStyle: React.CSSProperties = {
  position: "absolute",
  top: "-8px",
  right: "-10px",
  minWidth: "18px",
  height: "18px",
  borderRadius: "999px",
  background: "#7dbb2f",
  color: "#fff",
  fontSize: "11px",
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 5px",
};

const miniCartItemStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "10px 0",
  borderBottom: "1px solid #f1f1f1",
  fontSize: "14px",
};

const authButtonStyle: React.CSSProperties = {
  textDecoration: "none",
  border: "1px solid #ddd",
  background: "#fff",
  color: "#222",
  padding: "10px 14px",
  borderRadius: "4px",
  fontSize: "13px",
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

export default function Navbar() {
  const { cart } = useCart();
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const miniCartTimeoutRef = useRef<number | null>(null);

  const grower = localStorage.getItem("grower");
  const growerName = grower?.replace(/-/g, " ");

  const customerRaw = localStorage.getItem("customer");
  let customer: any = null;

  try {
    customer = customerRaw ? JSON.parse(customerRaw) : null;
  } catch {
    customer = customerRaw ? { name: customerRaw } : null;
  }

  const customerName =
    customer?.name || customer?.fullName || customer?.email || "Customer";

  const totalItems = cart.reduce(
    (sum, item) => sum + Number(item.boxes || 0),
    0
  );

  const totalPrice = cart.reduce((sum, item) => {
    const price = Number(item.price || 0);
    return sum + price * Number(item.boxes || 0);
  }, 0);

  function openMiniCart() {
    if (miniCartTimeoutRef.current) {
      window.clearTimeout(miniCartTimeoutRef.current);
      miniCartTimeoutRef.current = null;
    }
    setMiniCartOpen(true);
  }

  function closeMiniCartWithDelay() {
    if (miniCartTimeoutRef.current) {
      window.clearTimeout(miniCartTimeoutRef.current);
    }

    miniCartTimeoutRef.current = window.setTimeout(() => {
      setMiniCartOpen(false);
      miniCartTimeoutRef.current = null;
    }, 220);
  }

  return (
    <header
      style={{
        background: "#fff",
        borderBottom: "1px solid #ececec",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          padding: "16px 24px",
          display: "grid",
          gridTemplateColumns: "220px 1fr 320px",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <Link to="/">
            <img src={logo} alt="Colorsland" style={{ height: "54px" }} />
          </Link>
        </div>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "34px",
            flexWrap: "wrap",
          }}
        >
          <Link to="/" style={linkStyle}>
            HOME
          </Link>
          <Link to="/shop" style={linkStyle}>
            SHOP
          </Link>
          <Link to="/growers" style={linkStyle}>
            GROWERS
          </Link>
          <Link to="/about-us" style={linkStyle}>
            ABOUT US
          </Link>
          <Link to="/contact-us" style={linkStyle}>
            CONTACT US
          </Link>

          {grower && (
            <Link to="/grower-admin" style={linkStyle}>
              GROWER DASHBOARD
            </Link>
          )}

          {!grower && customer && (
            <Link to="/orders" style={linkStyle}>
              MY ORDERS
            </Link>
          )}
        </nav>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
            position: "relative",
            flexWrap: "wrap",
          }}
        >
          {grower && (
            <span style={{ fontSize: "13px", color: "#888" }}>
              👨‍🌾 {growerName}
            </span>
          )}

          {!grower && customer && (
            <span style={{ fontSize: "13px", color: "#888" }}>
              👤 {customerName}
            </span>
          )}

          {!grower && !customer && (
            <Link to="/login" style={authButtonStyle}>
              Login
            </Link>
          )}

          {!grower && customer && (
            <Link to="/account" style={authButtonStyle}>
              My Account
            </Link>
          )}

          {!grower && (
            <div
              onMouseEnter={openMiniCart}
              onMouseLeave={closeMiniCartWithDelay}
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => setMiniCartOpen((prev) => !prev)}
                style={{
                  ...iconWrapStyle,
                  background: "transparent",
                  border: "none",
                }}
              >
                <span style={iconStyle}>🛍️</span>
                {totalItems > 0 && <span style={badgeStyle}>{totalItems}</span>}
              </button>

              {miniCartOpen && (
                <div
                  style={miniCartBox}
                  onMouseEnter={openMiniCart}
                  onMouseLeave={closeMiniCartWithDelay}
                >
                  <h4 style={miniCartTitle}>Cart Summary</h4>

                  {cart.length === 0 ? (
                    <p style={{ margin: 0, color: "#777" }}>
                      Your cart is empty.
                    </p>
                  ) : (
                    <>
                      {cart.map((item) => (
                        <div
                          key={`${item.slug}-${item.grower}`}
                          style={miniCartItemStyle}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{item.name}</div>
                            <div style={{ fontSize: "12px", color: "#888" }}>
                              {item.boxes} boxes ({item.totalStems} stems)
                            </div>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            $
                            {(
                              Number(item.price || 0) * Number(item.boxes || 0)
                            ).toFixed(2)}
                          </div>
                        </div>
                      ))}

                      <div style={miniCartTotal}>
                        <strong>Total</strong>
                        <strong>${totalPrice.toFixed(2)}</strong>
                      </div>

                      <Link to="/cart">
                        <button style={miniBtn}>View Cart</button>
                      </Link>

                      <Link to="/checkout">
                        <button style={checkoutBtn}>
                          Proceed to Checkout
                        </button>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {!grower && customer && (
            <button
              onClick={() => {
                localStorage.removeItem("customer");
                window.location.href = "/";
              }}
              style={{
                background: "#222",
                color: "#fff",
                border: "none",
                padding: "10px 12px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              Logout
            </button>
          )}

          {grower && (
            <button
              onClick={() => {
                localStorage.removeItem("grower");
                window.location.href = "/";
              }}
              style={{
                background: "#c0392b",
                color: "#fff",
                border: "none",
                padding: "10px 12px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

const miniCartBox: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 10px)",
  right: 0,
  width: "360px",
  background: "#fff",
  border: "1px solid #ececec",
  borderRadius: "8px",
  padding: "18px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  zIndex: 30,
};

const miniCartTitle: React.CSSProperties = {
  margin: "0 0 14px",
};

const miniCartTotal: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "16px",
};

const miniBtn: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  marginTop: "10px",
  borderRadius: "8px",
  border: "1px solid #d9d9d9",
  background: "#fff",
  cursor: "pointer",
};

const checkoutBtn: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  marginTop: "10px",
  background: "#7dbb2f",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
};