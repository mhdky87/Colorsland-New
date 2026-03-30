import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

type CustomerInfo = {
  name: string;
  company: string;
  phone: string;
  city: string;
  notes: string;
};

function getStoredCompanyProfile() {
  try {
    const raw = localStorage.getItem("companyProfile");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getDefaultShippingAddress() {
  try {
    const raw = localStorage.getItem("shippingAddresses");
    if (!raw) return null;
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return null;
    return items.find((item) => item.isDefault) || items[0] || null;
  } catch {
    return null;
  }
}

function getDefaultFreightContact() {
  try {
    const raw = localStorage.getItem("freightDeliveryContacts");
    if (!raw) return null;
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return null;
    return items.find((item) => item.isDefault) || items[0] || null;
  } catch {
    return null;
  }
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Failed to parse ${key}:`, error);
    return fallback;
  }
}

function safeSave(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();

  const companyProfile = getStoredCompanyProfile();
  const defaultShippingAddress = getDefaultShippingAddress();
  const defaultFreightContact = getDefaultFreightContact();
  const allShippingAddresses = safeRead<any[]>("shippingAddresses", []);
  const allFreightContacts = safeRead<any[]>("freightDeliveryContacts", []);

  const [customer, setCustomer] = useState<CustomerInfo>({
    name: defaultFreightContact?.name || "",
    company: companyProfile?.tradeName || companyProfile?.legalName || "",
    phone: defaultFreightContact?.phone
      ? `${defaultFreightContact.phoneCode || ""} ${defaultFreightContact.phone}`.trim()
      : companyProfile?.phone || "",
    city: defaultShippingAddress?.city || companyProfile?.city || "",
    notes: "",
  });

const [selectedShippingAddress, setSelectedShippingAddress] = useState<any>(() => {
  const saved = localStorage.getItem("selectedShippingAddress");
  return saved ? JSON.parse(saved) : defaultShippingAddress || null;
});

const [selectedFreightContact, setSelectedFreightContact] = useState<any>(() => {
  const saved = localStorage.getItem("selectedFreightContact");
  return saved ? JSON.parse(saved) : defaultFreightContact || null;
});

  const [deliveryDate, setDeliveryDate] = useState(
    localStorage.getItem("deliveryDate") || ""
  );

  const groupedByGrower = useMemo(() => {
    const map = new Map<string, typeof cart>();

    cart.forEach((item) => {
      const key = item.grower || "unknown";
      const existing = map.get(key) || [];
      existing.push(item);
      map.set(key, existing);
    });

    return Array.from(map.entries()).map(([grower, items]) => ({
      grower,
      items,
    }));
  }, [cart]);

  const summary = useMemo(() => {
    const totalBoxes = cart.reduce((sum, item) => sum + Number(item.boxes || 0), 0);
    const totalStems = cart.reduce((sum, item) => sum + Number(item.totalStems || 0), 0);
    const totalPrice = cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
          Number(item.stemsPerBox || 0) *
          Number(item.boxes || 0),
      0
    );

    return {
      totalBoxes,
      totalStems,
      totalPrice,
    };
  }, [cart]);

  function updateCustomer<K extends keyof CustomerInfo>(key: K, value: CustomerInfo[K]) {
    setCustomer((prev) => ({ ...prev, [key]: value }));
  }

  function handlePlaceOrder() {
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (!deliveryDate.trim()) {
      alert("Please select the requested delivery date.");
      return;
    }

    if (!customer.name.trim()) {
      alert("Please enter customer name.");
      return;
    }

    if (!customer.phone.trim()) {
      alert("Please enter phone number.");
      return;
    }

    if (!selectedShippingAddress) {
      alert("Please add a shipping address from settings.");
      return;
    }

    if (!selectedFreightContact) {
      alert("Please add a freight contact from settings.");
      return;
    }

    const existingOrders = safeRead<any[]>("orders", []);
    const parentOrderId = `PARENT-${Date.now()}`;

    const newOrders = groupedByGrower.map((group) => {
      const totalGrowerValue = group.items.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
            Number(item.stemsPerBox || 0) *
            Number(item.boxes || 0),
        0
      );

      return {
        id: `ORD-${Date.now()}-${group.grower}`,
        parentOrderId,
        grower: group.grower,
        status: "pending_review",
        createdAt: new Date().toISOString(),
        deliveryDate,
        customer: {
          name: customer.name.trim(),
          company: customer.company.trim(),
          phone: customer.phone.trim(),
          city: customer.city.trim(),
          notes: customer.notes.trim(),
        },
        companyProfile,
        shippingAddress: selectedShippingAddress,
        freightContact: selectedFreightContact,
        totalValue: totalGrowerValue,
        items: group.items.map((item) => ({
          slug: item.slug,
          name: item.name,
          price: item.price,
          image: item.image || "",
          grower: item.grower,
          boxType: item.boxType || "Standard Box",
          stemsPerBox: Number(item.stemsPerBox || 0),
          boxes: Number(item.boxes || 0),
          totalStems: Number(item.totalStems || 0),
          selectedVariety: item.selectedVariety || "",
          selectedColor: item.selectedColor || "",
          selectedLength: item.selectedLength || "",
          deliveryDate,
          itemStatus: "pending_review",
        })),
      };
    });

    safeSave("orders", [...existingOrders, ...newOrders]);
    localStorage.setItem("deliveryDate", deliveryDate);

    clearCart();

    alert("Order placed successfully.");
    navigate("/orders");
  }

  if (cart.length === 0) {
    return (
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "70px 24px",
        }}
      >
        <div
          style={{
            border: "1px solid #ececec",
            borderRadius: "18px",
            background: "#fff",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: "0 0 12px", fontSize: "40px", color: "#222" }}>
            Checkout
          </h1>
          <p style={{ margin: "0 0 24px", color: "#666", fontSize: "16px" }}>
            Your cart is empty.
          </p>
          <button onClick={() => navigate("/shop")} style={primaryBtnStyle}>
            Back to Shop
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      style={{
        maxWidth: "1320px",
        margin: "0 auto",
        padding: "40px 24px 70px",
        display: "grid",
        gap: "24px",
      }}
    >
      <div>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: "13px",
            fontWeight: 700,
            color: "#7dbb2f",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Checkout
        </p>

        <h1 style={{ margin: 0, fontSize: "42px", color: "#222" }}>
          Complete Your Order
        </h1>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>Customer Information</h2>

          <div style={formGridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Customer Name</label>
              <input
                value={customer.name}
                onChange={(e) => updateCustomer("name", e.target.value)}
                style={inputStyle}
                placeholder="Enter customer name"
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Company</label>
              <input
                value={customer.company}
                onChange={(e) => updateCustomer("company", e.target.value)}
                style={inputStyle}
                placeholder="Enter company name"
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Phone</label>
              <input
                value={customer.phone}
                onChange={(e) => updateCustomer("phone", e.target.value)}
                style={inputStyle}
                placeholder="Enter phone number"
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>City</label>
              <input
                value={customer.city}
                onChange={(e) => updateCustomer("city", e.target.value)}
                style={inputStyle}
                placeholder="Enter city"
              />
            </div>

            <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
              <label style={labelStyle}>
                Requested Delivery Date <span style={{ color: "#c53b3b" }}>*</span>
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => {
                  setDeliveryDate(e.target.value);
                  localStorage.setItem("deliveryDate", e.target.value);
                }}
                style={inputStyle}
              />
            </div>

            <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={customer.notes}
                onChange={(e) => updateCustomer("notes", e.target.value)}
                style={textareaStyle}
                placeholder="Any special notes"
              />
            </div>
          </div>
        </div>

        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>Order Summary</h2>

          <div style={summaryListStyle}>
            <div style={summaryRowStyle}>
              <span>Requested Delivery</span>
              <strong>{deliveryDate || "-"}</strong>
            </div>

            <div style={summaryRowStyle}>
              <span>Total Boxes</span>
              <strong>{summary.totalBoxes}</strong>
            </div>

            <div style={summaryRowStyle}>
              <span>Total Stems</span>
              <strong>{summary.totalStems}</strong>
            </div>

            <div style={summaryRowStyle}>
              <span>Total</span>
              <strong>{formatMoney(summary.totalPrice)}</strong>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            style={{ ...primaryBtnStyle, width: "100%", marginTop: "18px" }}
          >
            Place Order
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        <div
          style={{
            ...panelStyle,
            padding: "18px",
          }}
        >
          <h2 style={sectionTitleStyle}>Shipping Address</h2>

          {allShippingAddresses.length > 1 && (
  <select
    value={selectedShippingAddress?.id || ""}
    onChange={(e) => {
      const found = allShippingAddresses.find((item) => item.id === e.target.value);
      setSelectedShippingAddress(found || null);
localStorage.setItem("selectedShippingAddress", JSON.stringify(found));
    }}
    style={{ ...inputStyle, marginBottom: "14px" }}
  >
    {allShippingAddresses.map((item) => (
      <option key={item.id} value={item.id}>
        {item.name} - {item.city}
      </option>
    ))}
  </select>
)}

          {selectedShippingAddress ? (
            <div style={{ lineHeight: 1.8, color: "#333", fontSize: "14px" }}>
              <div style={{ fontWeight: 800 }}>{selectedShippingAddress.name}</div>
              <div>{selectedShippingAddress.address}</div>
              <div>
                {selectedShippingAddress.city} - {selectedShippingAddress.state}
              </div>
              <div>
                {selectedShippingAddress.country}
                {selectedShippingAddress.zip ? ` - ${selectedShippingAddress.zip}` : ""}
              </div>
              {selectedShippingAddress.phone && (
                <div>
                  Phone: {selectedShippingAddress.phoneCode} {selectedShippingAddress.phone}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: "#777" }}>No default shipping address found.</div>
          )}
        </div>

        <div
          style={{
            ...panelStyle,
            padding: "18px",
          }}
        >
          <h2 style={sectionTitleStyle}>Freight Delivery Contact</h2>

          {allFreightContacts.length > 1 && (
  <select
    value={selectedFreightContact?.id || ""}
    onChange={(e) => {
      const found = allFreightContacts.find((item) => item.id === e.target.value);
      setSelectedFreightContact(found || null);
localStorage.setItem("selectedFreightContact", JSON.stringify(found));
    }}
    style={{ ...inputStyle, marginBottom: "14px" }}
  >
    {allFreightContacts.map((item) => (
      <option key={item.id} value={item.id}>
        {item.company} - {item.name}
      </option>
    ))}
  </select>
)}

          {selectedFreightContact ? (
            <div style={{ lineHeight: 1.8, color: "#333", fontSize: "14px" }}>
              <div style={{ fontWeight: 800 }}>{selectedFreightContact.company}</div>
              <div>{selectedFreightContact.name}</div>
              <div>
                {selectedFreightContact.phoneCode} {selectedFreightContact.phone}
              </div>
              <div>{selectedFreightContact.email || "-"}</div>
              <div>{selectedFreightContact.country}</div>
            </div>
          ) : (
            <div style={{ color: "#777" }}>No default freight contact found.</div>
          )}
        </div>
      </div>

      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>Items by Grower</h2>

        <div style={{ display: "grid", gap: "20px" }}>
          {groupedByGrower.map((group) => (
            <div key={group.grower} style={growerGroupStyle}>
              <div style={growerHeaderStyle}>
                <h3 style={{ margin: 0, fontSize: "22px", color: "#1f1f1f" }}>
                  {group.grower}
                </h3>
                <span style={growerBadgeStyle}>{group.items.length} items</span>
              </div>

              <div style={tableWrapStyle}>
                <div style={tableHeaderStyle}>
                  <div>Product</div>
                  <div>Length</div>
                  <div>Box Type</div>
                  <div>Boxes</div>
                  <div>Stems / Box</div>
                  <div>Total Stems</div>
                  <div>Price / Stem</div>
                  <div>Line Total</div>
                </div>

                {group.items.map((item, index) => {
                  const lineTotal =
                    Number(item.price || 0) *
                    Number(item.stemsPerBox || 0) *
                    Number(item.boxes || 0);

                  return (
                    <div key={`${item.slug}-${index}`} style={tableRowStyle}>
                      <div style={tableCellStrongStyle}>{item.name}</div>
                      <div style={tableCellStyle}>{item.selectedLength || "-"}</div>
                      <div style={tableCellStyle}>{item.boxType || "-"}</div>
                      <div style={tableCellStyle}>{item.boxes}</div>
                      <div style={tableCellStyle}>{item.stemsPerBox}</div>
                      <div style={tableCellStyle}>{item.totalStems}</div>
                      <div style={tableCellStyle}>
                        {formatMoney(Number(item.price || 0))}
                      </div>
                      <div style={tableCellStyle}>{formatMoney(lineTotal)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const panelStyle: React.CSSProperties = {
  border: "1px solid #ececec",
  borderRadius: "18px",
  background: "#fff",
  padding: "22px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 18px",
  fontSize: "24px",
  color: "#222",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
};

const fieldStyle: React.CSSProperties = {
  display: "grid",
  gap: "8px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#444",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #d9d9d9",
  background: "#fff",
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "110px",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #d9d9d9",
  background: "#fff",
  outline: "none",
  resize: "vertical",
};

const summaryListStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const summaryRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  padding: "10px 0",
  borderBottom: "1px solid #f0f0f0",
  color: "#444",
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#7dbb2f",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const growerGroupStyle: React.CSSProperties = {
  border: "1px solid #ececec",
  borderRadius: "16px",
  background: "#fafafa",
  padding: "16px",
  display: "grid",
  gap: "14px",
};

const growerHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const growerBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 800,
  background: "#eef8df",
  color: "#3f6b0b",
};

const tableWrapStyle: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
  border: "1px solid #ececec",
  borderRadius: "12px",
  background: "#fff",
};

const tableHeaderStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.4fr .9fr .9fr .7fr .9fr .9fr .9fr 1fr",
  gap: "10px",
  padding: "12px 14px",
  background: "#f7f7f7",
  borderBottom: "1px solid #ececec",
  fontSize: "12px",
  fontWeight: 800,
  color: "#555",
  minWidth: "920px",
};

const tableRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.4fr .9fr .9fr .7fr .9fr .9fr .9fr 1fr",
  gap: "10px",
  padding: "12px 14px",
  borderBottom: "1px solid #f2f2f2",
  alignItems: "center",
  minWidth: "920px",
};

const tableCellStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#222",
};

const tableCellStrongStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#111",
  fontWeight: 800,
};