import logo from "../assets/Icon.png";

const footerLinkStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "#444",
  fontSize: "15px",
  lineHeight: 1.9,
};

export default function Footer() {
  return (
    <footer
      style={{
        background: "#f8f8f8",
        borderTop: "1px solid #ececec",
        marginTop: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          padding: "52px 24px 28px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr 1fr 1fr",
            gap: "36px",
            alignItems: "start",
          }}
        >
          <div>
            <img
              src={logo}
              alt="Colorsland"
              style={{
                height: "58px",
                width: "auto",
                objectFit: "contain",
                display: "block",
                marginBottom: "20px",
              }}
            />

            <p style={{ margin: "0 0 10px", color: "#444", lineHeight: 1.8 }}>
              Dubai Flower center OF-107, Dubai, UAE
            </p>
            <p style={{ margin: "0 0 10px", color: "#444" }}>
              +971-52-289-7942
            </p>
            <p style={{ margin: 0, color: "#444" }}>
              info@colorsland.com
            </p>
          </div>

          <div>
            <h3
              style={{
                margin: "0 0 16px",
                fontSize: "24px",
                color: "#222",
              }}
            >
              Information
            </h3>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <a href="#" style={footerLinkStyle}>Delivery Information</a>
              <a href="#" style={footerLinkStyle}>Privacy Policy</a>
              <a href="#" style={footerLinkStyle}>Terms & Condition</a>
              <a href="#" style={footerLinkStyle}>Search Terms</a>
              <a href="#" style={footerLinkStyle}>Order & Return</a>
            </div>
          </div>

          <div>
            <h3
              style={{
                margin: "0 0 16px",
                fontSize: "24px",
                color: "#222",
              }}
            >
              Customer Service
            </h3>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <a href="#" style={footerLinkStyle}>Customer Service</a>
              <a href="#" style={footerLinkStyle}>Privacy Policy</a>
              <a href="#" style={footerLinkStyle}>Terms & Condition</a>
              <a href="#" style={footerLinkStyle}>Best Seller</a>
              <a href="#" style={footerLinkStyle}>Manufactures</a>
            </div>
          </div>

          <div>
            <h3
              style={{
                margin: "0 0 16px",
                fontSize: "24px",
                color: "#222",
              }}
            >
              Newsletter
            </h3>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "22px",
              }}
            >
              <input
                type="email"
                placeholder="Enter your email here"
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "1px solid #ddd",
                  padding: "14px 14px",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
              <button
                style={{
                  background: "#7dbb2f",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "0 22px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                SUBSCRIBE
              </button>
            </div>

            <div style={{ color: "#444", lineHeight: 2 }}>
              <div>Monday - Friday &nbsp;&nbsp; 08:00 - 20:00</div>
              <div>Saturday &nbsp;&nbsp; 09:00 - 21:00</div>
              <div>Sunday &nbsp;&nbsp; 13:00 - 22:00</div>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "34px",
            paddingTop: "18px",
            borderTop: "1px solid #e9e9e9",
            fontSize: "14px",
            color: "#666",
          }}
        >
          © 2023 All rights reserved to COLORS LAND.LLC
        </div>
      </div>
    </footer>
  );
}