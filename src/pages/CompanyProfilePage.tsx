import { useState } from "react";
import type { CSSProperties } from "react";

type CompanyProfile = {
  legalName: string;
  tradeName: string;
  address: string;
  state: string;
  city: string;
  zip: string;
  taxId: string;
  country: string;
  email: string;
  phone: string;
  fax: string;
  timezone: string;
};

const STORAGE_KEY = "companyProfile";

const defaultProfile: CompanyProfile = {
  legalName: "",
  tradeName: "",
  address: "",
  state: "",
  city: "",
  zip: "",
  taxId: "",
  country: "Saudi Arabia",
  email: "",
  phone: "",
  fax: "",
  timezone: "(UTC +03:00) Asia/Riyadh",
};

function getStoredProfile(): CompanyProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProfile;
    const parsed = JSON.parse(raw);
    return { ...defaultProfile, ...parsed };
  } catch {
    return defaultProfile;
  }
}

function saveStoredProfile(profile: CompanyProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export default function CompanyProfilePage() {
  const [form, setForm] = useState<CompanyProfile>(getStoredProfile);

  function updateField(key: keyof CompanyProfile, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.legalName.trim() || !form.tradeName.trim()) {
      alert("Please fill Legal Name and Trade Name.");
      return;
    }

    saveStoredProfile(form);
    alert("Company profile saved.");
  }

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", paddingBottom: "100px" }}>
      <h1 style={{ textAlign: "center", fontSize: "44px", marginBottom: "24px" }}>
        Your Company Profile
      </h1>

      <div
        style={{
          background: "#dff0ff",
          border: "1px solid #c8e3fb",
          color: "#2a6c99",
          padding: "14px 16px",
          borderRadius: "8px",
          marginBottom: "16px",
        }}
      >
        Save these details once, and later the checkout can use them automatically.
      </div>

      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>Basic Information</div>

        <div style={sectionBodyStyle}>
          <div style={gridOneStyle}>
            <input
              value={form.legalName}
              onChange={(e) => updateField("legalName", e.target.value)}
              placeholder="Legal Name *"
              style={inputStyle}
            />

            <input
              value={form.tradeName}
              onChange={(e) => updateField("tradeName", e.target.value)}
              placeholder="Trade Name *"
              style={inputStyle}
            />
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>Contact</div>

        <div style={sectionBodyStyle}>
          <div style={gridOneStyle}>
            <input
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="Address"
              style={inputStyle}
            />

            <div style={gridTwoStyle}>
              <input
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
                placeholder="State/Province"
                style={inputStyle}
              />
              <input
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="City/Suburb"
                style={inputStyle}
              />
            </div>

            <div style={gridTwoStyle}>
              <input
                value={form.zip}
                onChange={(e) => updateField("zip", e.target.value)}
                placeholder="Zip/Postal Code"
                style={inputStyle}
              />
              <input
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
                placeholder="Country"
                style={inputStyle}
              />
            </div>

            <div style={gridTwoStyle}>
              <input
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="Email"
                style={inputStyle}
              />
              <input
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="Telephone"
                style={inputStyle}
              />
            </div>

            <div style={gridTwoStyle}>
              <input
                value={form.fax}
                onChange={(e) => updateField("fax", e.target.value)}
                placeholder="Fax"
                style={inputStyle}
              />
              <input
                value={form.taxId}
                onChange={(e) => updateField("taxId", e.target.value)}
                placeholder="Tax ID"
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>Timezone</div>

        <div style={sectionBodyStyle}>
          <input
            value={form.timezone}
            onChange={(e) => updateField("timezone", e.target.value)}
            placeholder="Timezone"
            style={inputStyle}
          />
        </div>
      </section>

      <div
        style={{
          position: "fixed",
          left: "220px",
          right: 0,
          bottom: 0,
          background: "#243346",
          padding: "14px 24px",
          display: "flex",
          justifyContent: "flex-end",
          zIndex: 20,
        }}
      >
        <button onClick={handleSave} style={saveButtonStyle}>
          SAVE
        </button>
      </div>
    </div>
  );
}

const sectionStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e5e5",
  borderRadius: "10px",
  overflow: "hidden",
  marginBottom: "16px",
};

const sectionHeaderStyle: CSSProperties = {
  padding: "16px 18px",
  fontWeight: 700,
  fontSize: "22px",
  borderBottom: "1px solid #eee",
};

const sectionBodyStyle: CSSProperties = {
  padding: "18px",
};

const gridOneStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
};

const gridTwoStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "14px 14px",
  border: "1px solid #d9d9d9",
  borderRadius: "8px",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

const saveButtonStyle: CSSProperties = {
  border: "1px solid #7fa34d",
  background: "#8aad4f",
  color: "#fff",
  padding: "10px 18px",
  borderRadius: "8px",
  fontWeight: 700,
  cursor: "pointer",
};