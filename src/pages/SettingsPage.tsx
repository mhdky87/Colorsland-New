import { Link } from "react-router-dom";

const sectionStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e5e5",
  borderRadius: "10px",
  marginBottom: "16px",
  overflow: "hidden",
};

const titleStyle: React.CSSProperties = {
  padding: "16px 18px",
  fontWeight: 700,
  fontSize: "22px",
  borderBottom: "1px solid #eee",
};

const linkWrapStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const linkStyle: React.CSSProperties = {
  padding: "16px 18px",
  borderBottom: "1px solid #f2f2f2",
  textDecoration: "none",
  color: "#6f9440",
  fontWeight: 500,
};

export default function SettingsPage() {
  return (
    <div style={{ maxWidth: "760px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", fontSize: "48px", marginBottom: "24px" }}>Settings</h1>

      <section style={sectionStyle}>
        <div style={titleStyle}>Company</div>
        <div style={linkWrapStyle}>
          <Link to="/settings/company-profile" style={linkStyle}>
  Company Profile
</Link>
          <span style={linkStyle}>Member Management</span>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={titleStyle}>Shipping</div>
        <div style={linkWrapStyle}>
          <span style={linkStyle}>Required Documents</span>
          <span style={linkStyle}>C&amp;F - CIF Ports Registration</span>
          <span style={linkStyle}>FOB Ports Registration</span>

          <Link to="/settings/shipping-addresses" style={linkStyle}>
            Shipping Addresses
          </Link>

          <Link to="/settings/freight-delivery-contacts" style={linkStyle}>
  Freight Delivery Contacts
</Link>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={titleStyle}>Integration</div>
        <div style={linkWrapStyle}>
          <span style={linkStyle}>Webhooks</span>
          <span style={linkStyle}>User Tokens</span>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={titleStyle}>Personal</div>
        <div style={linkWrapStyle}>
          <span style={linkStyle}>Profile</span>
          <span style={linkStyle}>Notifications Management</span>
        </div>
      </section>
    </div>
  );
}