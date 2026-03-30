import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

type FreightContact = {
  id: string;
  company: string;
  name: string;
  email: string;
  phoneCode: string;
  phone: string;
  country: string;
  isDefault?: boolean;
};

const STORAGE_KEY = "freightDeliveryContacts";

function getStoredContacts(): FreightContact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredContacts(items: FreightContact[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function FreightDeliveryContactsPage() {
  const [contacts, setContacts] = useState<FreightContact[]>(getStoredContacts);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    company: "",
    name: "",
    email: "",
    phoneCode: "+966",
    phone: "",
    country: "Saudi Arabia",
  });

  const hasContacts = useMemo(() => contacts.length > 0, [contacts]);

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm({
      company: "",
      name: "",
      email: "",
      phoneCode: "+966",
      phone: "",
      country: "Saudi Arabia",
    });
  }

  function handleSave() {
    if (!form.company.trim() || !form.name.trim() || !form.phone.trim() || !form.country.trim()) {
      alert("Please fill the required fields.");
      return;
    }

    const newItem: FreightContact = {
      id: Date.now().toString(),
      company: form.company.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      phoneCode: form.phoneCode.trim(),
      phone: form.phone.trim(),
      country: form.country.trim(),
      isDefault: contacts.length === 0,
    };

    const updated = [newItem, ...contacts];
    setContacts(updated);
    saveStoredContacts(updated);
    resetForm();
    setShowForm(false);
  }

  function handleDelete(id: string) {
    const updated = contacts.filter((item) => item.id !== id);
    setContacts(updated);
    saveStoredContacts(updated);
  }

  function handleSetDefault(id: string) {
    const updated = contacts.map((item) => ({
      ...item,
      isDefault: item.id === id,
    }));
    setContacts(updated);
    saveStoredContacts(updated);
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
        <h1 style={{ margin: 0, fontSize: "44px", fontWeight: 700 }}>
          Freight Delivery Contacts
        </h1>

        <button
          onClick={() => setShowForm(true)}
          style={primaryButtonStyle}
        >
          + ADD NEW CONTACT
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
              gridTemplateColumns: "140px 1.3fr 1fr 1fr 150px 70px",
              gap: "16px",
              padding: "16px 18px",
              fontWeight: 700,
              color: "#666",
              borderBottom: "1px solid #eee",
            }}
          >
            <div>Country</div>
            <div>Company</div>
            <div>Name</div>
            <div>Email</div>
            <div>Phone</div>
            <div></div>
          </div>

          {!hasContacts && (
            <div style={{ padding: "24px 18px", color: "#777" }}>
              No freight delivery contacts yet.
            </div>
          )}

          {contacts.map((item) => (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 1.3fr 1fr 1fr 150px 70px",
                gap: "16px",
                padding: "18px",
                borderBottom: "1px solid #f0f0f0",
                alignItems: "start",
              }}
            >
              <div>{item.country}</div>

              <div>
                <div
                  style={{
                    color: "#6f9440",
                    fontWeight: 700,
                    textDecoration: "underline",
                    marginBottom: "8px",
                    lineHeight: 1.5,
                  }}
                >
                  {item.company}
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

              <div>{item.name}</div>
              <div>{item.email || "-"}</div>
              <div>
                {item.phoneCode} {item.phone}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {!item.isDefault && (
                  <button
                    onClick={() => handleSetDefault(item.id)}
                    style={secondaryButtonStyle}
                  >
                    Default
                  </button>
                )}

                <button
                  onClick={() => handleDelete(item.id)}
                  style={dangerButtonStyle}
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
          <h2
            style={{
              textAlign: "center",
              fontSize: "42px",
              marginTop: "8px",
              marginBottom: "26px",
            }}
          >
            Create new contact
          </h2>

          <div style={{ maxWidth: "600px", margin: "0 auto", display: "grid", gap: "14px" }}>
            <input
              value={form.company}
              onChange={(e) => updateField("company", e.target.value)}
              placeholder="Company *"
              style={inputStyle}
            />

            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Name *"
              style={inputStyle}
            />

            <input
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="Email"
              style={inputStyle}
            />

            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr", gap: "12px" }}>
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
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
                placeholder="Country *"
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
                style={cancelButtonStyle}
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                style={saveButtonStyle}
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

const primaryButtonStyle: CSSProperties = {
  border: "1px solid #7fa34d",
  background: "#8aad4f",
  color: "#fff",
  padding: "12px 18px",
  borderRadius: "8px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  border: "1px solid #dcdcdc",
  background: "#fff",
  padding: "8px 10px",
  borderRadius: "8px",
  cursor: "pointer",
};

const dangerButtonStyle: CSSProperties = {
  border: "1px solid #e3c5c5",
  background: "#fff5f5",
  color: "#a33",
  padding: "8px 10px",
  borderRadius: "8px",
  cursor: "pointer",
};

const cancelButtonStyle: CSSProperties = {
  border: "1px solid #cfd6dd",
  background: "#fff",
  color: "#222",
  padding: "10px 16px",
  borderRadius: "8px",
  fontWeight: 700,
  cursor: "pointer",
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