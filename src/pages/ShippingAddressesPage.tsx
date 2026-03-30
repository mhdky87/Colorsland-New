import { useMemo, useState } from "react";

type ShippingAddress = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  phoneCode: string;
  phone: string;
  faxCode: string;
  fax: string;
  isDefault?: boolean;
};

const STORAGE_KEY = "shippingAddresses";

function getStoredAddresses(): ShippingAddress[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredAddresses(addresses: ShippingAddress[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
}

export default function ShippingAddressesPage() {
  const [addresses, setAddresses] = useState<ShippingAddress[]>(getStoredAddresses);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "Saudi Arabia",
    zip: "",
    phoneCode: "+966",
    phone: "",
    faxCode: "+966",
    fax: "",
  });

  const hasAddresses = useMemo(() => addresses.length > 0, [addresses]);

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm({
      name: "",
      address: "",
      city: "",
      state: "",
      country: "Saudi Arabia",
      zip: "",
      phoneCode: "+966",
      phone: "",
      faxCode: "+966",
      fax: "",
    });
  }

  function handleSave() {
    if (!form.name.trim() || !form.address.trim() || !form.city.trim() || !form.state.trim()) {
      alert("Please fill the required fields.");
      return;
    }

    const newAddress: ShippingAddress = {
      id: Date.now().toString(),
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country.trim(),
      zip: form.zip.trim(),
      phoneCode: form.phoneCode.trim(),
      phone: form.phone.trim(),
      faxCode: form.faxCode.trim(),
      fax: form.fax.trim(),
      isDefault: addresses.length === 0,
    };

    const updated = [newAddress, ...addresses];
    setAddresses(updated);
    saveStoredAddresses(updated);
    resetForm();
    setShowForm(false);
  }

  function handleDelete(id: string) {
    const updated = addresses.filter((item) => item.id !== id);
    setAddresses(updated);
    saveStoredAddresses(updated);
  }

  function handleSetDefault(id: string) {
    const updated = addresses.map((item) => ({
      ...item,
      isDefault: item.id === id,
    }));
    setAddresses(updated);
    saveStoredAddresses(updated);
  }

  return (
    <div style={{ maxWidth: "980px", margin: "0 auto", paddingBottom: "100px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "22px",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "44px", fontWeight: 700 }}>Shipping Addresses</h1>

        <button
          onClick={() => setShowForm(true)}
          style={{
            border: "1px solid #7fa34d",
            background: "#8aad4f",
            color: "#fff",
            padding: "12px 18px",
            borderRadius: "8px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + ADD NEW ADDRESS
        </button>
      </div>

      {!showForm && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "220px 1fr 120px",
              gap: "16px",
              padding: "16px 18px",
              fontWeight: 700,
              color: "#666",
              borderBottom: "1px solid #eee",
            }}
          >
            <div>Name</div>
            <div>Address</div>
            <div></div>
          </div>

          {!hasAddresses && (
            <div style={{ padding: "24px 18px", color: "#777" }}>No shipping addresses yet.</div>
          )}

          {addresses.map((item) => (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "220px 1fr 120px",
                gap: "16px",
                padding: "18px",
                borderBottom: "1px solid #f0f0f0",
                alignItems: "start",
              }}
            >
              <div>
                <div
                  style={{
                    color: "#6f9440",
                    fontWeight: 700,
                    textDecoration: "underline",
                    marginBottom: "8px",
                  }}
                >
                  {item.name}
                </div>

                {item.isDefault && (
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "12px",
                      padding: "4px 8px",
                      borderRadius: "999px",
                      background: "#666",
                      color: "#fff",
                    }}
                  >
                    Default
                  </span>
                )}
              </div>

              <div style={{ lineHeight: 1.7 }}>
                <div>{item.address}</div>
                <div>
                  {item.city} - {item.state}
                </div>
                <div>
                  {item.country}
                  {item.zip ? ` - ${item.zip}` : ""}
                </div>
                {(item.phone || item.fax) && (
                  <div style={{ marginTop: "6px", color: "#666", fontSize: "14px" }}>
                    {item.phone ? `Phone: ${item.phoneCode} ${item.phone}` : ""}
                    {item.phone && item.fax ? " | " : ""}
                    {item.fax ? `Fax: ${item.faxCode} ${item.fax}` : ""}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {!item.isDefault && (
                  <button
                    onClick={() => handleSetDefault(item.id)}
                    style={{
                      border: "1px solid #dcdcdc",
                      background: "#fff",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    Default
                  </button>
                )}

                <button
                  onClick={() => handleDelete(item.id)}
                  style={{
                    border: "1px solid #e3c5c5",
                    background: "#fff5f5",
                    color: "#a33",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: "10px",
            padding: "18px",
          }}
        >
          <h2 style={{ textAlign: "center", fontSize: "42px", marginTop: "8px", marginBottom: "26px" }}>
            Create new address
          </h2>

          <div style={{ maxWidth: "600px", margin: "0 auto", display: "grid", gap: "14px" }}>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Name *"
              style={inputStyle}
            />

            <input
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="Address *"
              style={inputStyle}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <input
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="City/Suburb *"
                style={inputStyle}
              />
              <input
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
                placeholder="State/Province *"
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <input
                value={form.zip}
                onChange={(e) => updateField("zip", e.target.value)}
                placeholder="Zip/Postal Code"
                style={inputStyle}
              />
              <input
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
                placeholder="Country *"
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 120px 1fr", gap: "12px" }}>
              <input
                value={form.phoneCode}
                onChange={(e) => updateField("phoneCode", e.target.value)}
                placeholder="+ Tel. Code *"
                style={inputStyle}
              />
              <input
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="Telephone *"
                style={inputStyle}
              />
              <input
                value={form.faxCode}
                onChange={(e) => updateField("faxCode", e.target.value)}
                placeholder="+"
                style={inputStyle}
              />
              <input
                value={form.fax}
                onChange={(e) => updateField("fax", e.target.value)}
                placeholder="Fax"
                style={inputStyle}
              />
            </div>
          </div>

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
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                style={{
                  border: "1px solid #cfd6dd",
                  background: "#fff",
                  color: "#222",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                style={{
                  border: "1px solid #7fa34d",
                  background: "#8aad4f",
                  color: "#fff",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 14px",
  border: "1px solid #d9d9d9",
  borderRadius: "8px",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};