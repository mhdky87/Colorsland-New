import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";

type AlternativeOffer = {
  category?: string;
  productSlug?: string;
  productName?: string;
  productId?: string;
  image?: string;
  boxType?: string;
  stemsPerBox?: number;
  length?: string;
  price?: number | string;
  note?: string;
};

type RequestedChange = {
  boxes?: number;
  length?: string;
  note?: string;
};

type OrderItem = {
  slug: string;
  name: string;
  price: number | string;
  image?: string;
  grower?: string;
  boxType?: string;
  stemsPerBox?: number;
  boxes?: number;
  quantity?: number;
  totalStems?: number;
  status?: string;
  itemStatus?: string;
  selectedVariety?: string;
  selectedColor?: string;
  selectedLength?: string;
  alternativeName?: string;
  alternativePrice?: number | string;
  alternativeSlug?: string;
  alternativeImage?: string;
  alternativeBoxType?: string;
  alternativeStemsPerBox?: number;
  alternativeCategory?: string;
  alternativeProductId?: string;
  alternativeLength?: string;
  alternativeLengths?: { length: string; price: number | string }[];
  alternativeOffer?: AlternativeOffer;
  requestedChange?: RequestedChange;
};

type OrderRecord = {
  id: string;
  parentOrderId?: string;
  grower?: string;
  status: string;
  createdAt: string;
  deliveryDate?: string;
  customer?: {
    name?: string;
    company?: string;
    phone?: string;
    city?: string;
    notes?: string;
  };
  companyProfile?: any;
  shippingAddress?: any;
  freightContact?: any;
  items: OrderItem[];
};
type ChangeDraft = {
  boxes: string;
  length: string;
  note: string;
};

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSave(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatStatus(status: string) {
  return String(status || "pending_review")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB");
}

function getNumericPrice(value: number | string | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const cleaned = value.replace(/\$/g, "").trim();
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getBoxes(item: OrderItem) {
  return Number(item.boxes ?? item.quantity ?? 0);
}

function getStemsPerBox(item: OrderItem) {
  return Number(item.stemsPerBox ?? 0);
}

function getTotalStems(item: OrderItem) {
  const explicit = Number(item.totalStems ?? 0);
  if (explicit > 0) return explicit;
  return getBoxes(item) * getStemsPerBox(item);
}

function getBoxPrice(item: OrderItem) {
  return getNumericPrice(item.price) * getStemsPerBox(item);
}

function getLineTotal(item: OrderItem) {
  return getBoxPrice(item) * getBoxes(item);
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case "approved":
    case "alternative_accepted":
      return "#1e8e3e";
    case "partially_approved":
    case "partially_reviewed":
      return "#d97706";
    case "alternative_offered":
      return "#7c3aed";
    case "customer_requested_change":
      return "#2563eb";
    case "alternative_rejected":
    case "rejected":
      return "#c0392b";
    case "pending":
    case "pending_review":
    default:
      return "#b7791f";
  }
}

function getDisplayItemStatus(item: OrderItem) {
  return item.itemStatus || item.status || "pending_review";
}

function getAlternativeDisplay(item: OrderItem) {
  const productName =
    item.alternativeOffer?.productName || item.alternativeName || "";
  const length = item.alternativeOffer?.length || item.alternativeLength || "";
  const price =
    item.alternativeOffer?.price != null
      ? getNumericPrice(item.alternativeOffer.price)
      : getNumericPrice(item.alternativePrice);
  const stemsPerBox =
    Number(item.alternativeOffer?.stemsPerBox ?? item.alternativeStemsPerBox ?? 0) ||
    getStemsPerBox(item);
  const boxType =
    item.alternativeOffer?.boxType || item.alternativeBoxType || item.boxType || "-";
  const image = item.alternativeOffer?.image || item.alternativeImage || "";
  const note = item.alternativeOffer?.note || "";

  return {
    productName,
    length,
    price,
    stemsPerBox,
    boxType,
    image,
    note,
    hasAlternative: Boolean(productName),
  };
}

function hasActionRequired(order: OrderRecord) {
  return order.items.some((item) => {
    const status = getDisplayItemStatus(item);
    return (
      status === "alternative_offered" ||
      status === "customer_requested_change"
    );
  });
}

function deriveOrderStatus(items: OrderItem[]) {
  const statuses = items.map((item) => getDisplayItemStatus(item));

  if (statuses.length === 0) return "pending_review";

  if (statuses.some((status) => status === "customer_requested_change")) {
    return "pending_review";
  }

  if (statuses.some((status) => status === "alternative_offered")) {
    return "alternative_offered";
  }

  if (
    statuses.every(
      (status) => status === "approved" || status === "alternative_accepted"
    )
  ) {
    return "approved";
  }

  if (
    statuses.every(
      (status) => status === "rejected" || status === "alternative_rejected"
    )
  ) {
    return "rejected";
  }

  if (
    statuses.some((status) =>
      ["approved", "alternative_accepted"].includes(status)
    )
  ) {
    return "partially_approved";
  }

  return "pending_review";
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [changeDrafts, setChangeDrafts] = useState<Record<string, ChangeDraft>>({});
  const [openEditors, setOpenEditors] = useState<Record<string, boolean>>({});
  const [activeFilter, setActiveFilter] = useState("all");

  const customerRaw = localStorage.getItem("customer");

  let customer: any = null;
  try {
    customer = customerRaw ? JSON.parse(customerRaw) : null;
  } catch {
    customer = customerRaw ? { name: customerRaw } : null;
  }

  function loadOrders() {
    const stored = safeRead<OrderRecord[]>("orders", []);

    if (!customer) {
      setOrders([]);
      return;
    }

    const filtered = stored.filter((order: any) => {
      const orderPhone = String(order.customer?.phone || "").trim();
      const customerPhone = String(customer?.phone || "").trim();

      const orderName = String(order.customer?.name || "")
        .trim()
        .toLowerCase();
      const customerName = String(customer?.name || "")
        .trim()
        .toLowerCase();

      if (customerPhone && orderPhone) {
        return customerPhone === orderPhone;
      }

      if (customerName && orderName) {
        return customerName === orderName;
      }

      return false;
    });

    const sorted = [...filtered].sort((a: OrderRecord, b: OrderRecord) => {
      const aTime = new Date(a.createdAt || "").getTime() || 0;
      const bTime = new Date(b.createdAt || "").getTime() || 0;
      return bTime - aTime;
    });

    setOrders(sorted);
  }

  useEffect(() => {
    loadOrders();
  }, [customerRaw]);

  const summary = useMemo(() => {
    const totalOrders = orders.length;
    const totalBoxes = orders.reduce(
      (sum, order) =>
        sum + order.items.reduce((s, item) => s + getBoxes(item), 0),
      0
    );
    const totalStems = orders.reduce(
      (sum, order) =>
        sum + order.items.reduce((s, item) => s + getTotalStems(item), 0),
      0
    );
    const totalAmount = orders.reduce(
      (sum, order) =>
        sum + order.items.reduce((s, item) => s + getLineTotal(item), 0),
      0
    );

    return {
      totalOrders,
      totalBoxes,
      totalStems,
      totalAmount,
    };
  }, [orders]);

  const statusSummary = useMemo(() => {
  return {
    all: orders.length,
pending: orders.filter((order) =>
  ["pending_review", "alternative_offered", "customer_requested_change"].includes(order.status) ||
  hasActionRequired(order)
).length,
    approved: orders.filter((order) =>
      ["approved", "partially_approved"].includes(order.status)
    ).length,
    rejected: orders.filter((order) => order.status === "rejected").length,
  };
}, [orders]);

  const filteredOrders = useMemo(() => {
  if (activeFilter === "all") return orders;

if (activeFilter === "pending") {
  return orders.filter((order) =>
    ["pending_review", "alternative_offered", "customer_requested_change"].includes(order.status) ||
    hasActionRequired(order)
  );
}
  if (activeFilter === "approved") {
    return orders.filter((order) =>
      ["approved", "partially_approved"].includes(order.status)
    );
  }

  if (activeFilter === "rejected") {
    return orders.filter((order) => order.status === "rejected");
  }

  return orders;
}, [orders, activeFilter]);

  if (!customer) {
    return <Navigate to="/login" replace />;
  }

  function persistUpdatedOrders(updatedOrders: OrderRecord[]) {
    safeSave("orders", updatedOrders);
    loadOrders();
  }

function updateOrderItem(
  orderId: string,
  itemIndex: number,
  updater: (item: OrderItem) => OrderItem
) {
  const stored = safeRead<OrderRecord[]>("orders", []);

  let targetParentId: string | undefined;

  const updatedOrders = stored.map((order) => {
    if (order.id === orderId) {
      targetParentId = order.parentOrderId;
    }
    return order;
  });

  const finalOrders = updatedOrders.map((order) => {
    // إذا نفس الأوردر
    if (order.id === orderId) {
      const updatedItems = order.items.map((item, index) =>
        index === itemIndex ? updater(item) : item
      );

      return {
        ...order,
        items: updatedItems,
        status: deriveOrderStatus(updatedItems),
      };
    }

    // إذا نفس parent order (مهم)
    if (targetParentId && order.parentOrderId === targetParentId) {
      const updatedStatus = deriveOrderStatus(order.items);

      return {
        ...order,
        status: updatedStatus,
      };
    }

    return order;
  });

  persistUpdatedOrders(finalOrders);
}

  function acceptAlternative(orderId: string, itemIndex: number) {
    updateOrderItem(orderId, itemIndex, (item) => {
      const alternative = getAlternativeDisplay(item);
      if (!alternative.hasAlternative) return item;

      const boxes = getBoxes(item);
      const stemsPerBox = alternative.stemsPerBox || getStemsPerBox(item);
      const totalStems = boxes * stemsPerBox;

      return {
        ...item,
        name: alternative.productName || item.name,
        slug: item.alternativeOffer?.productSlug || item.alternativeSlug || item.slug,
        image: alternative.image || item.image,
        price: alternative.price > 0 ? alternative.price : item.price,
        boxType: alternative.boxType || item.boxType,
        stemsPerBox,
        totalStems,
        selectedLength: alternative.length || item.selectedLength,
        status: "alternative_accepted",
        itemStatus: "alternative_accepted",
        requestedChange: undefined,
      };
    });
  }

  function rejectAlternative(orderId: string, itemIndex: number) {
    updateOrderItem(orderId, itemIndex, (item) => ({
      ...item,
      status: "alternative_rejected",
      itemStatus: "alternative_rejected",
      requestedChange: undefined,
    }));
  }

  function openChangeEditor(orderId: string, itemIndex: number, item: OrderItem) {
    const key = `${orderId}-${itemIndex}`;
    setOpenEditors((prev) => ({ ...prev, [key]: true }));
    setChangeDrafts((prev) => ({
      ...prev,
      [key]: prev[key] || {
        boxes: String(item.requestedChange?.boxes || getBoxes(item) || 1),
        length:
          item.requestedChange?.length ||
          item.alternativeOffer?.length ||
          item.selectedLength ||
          "",
        note: item.requestedChange?.note || "",
      },
    }));
  }

  function saveRequestedChange(orderId: string, itemIndex: number) {
    const key = `${orderId}-${itemIndex}`;
    const draft = changeDrafts[key];

    if (!draft) return;

    const parsedBoxes = Number(draft.boxes || 0);
    if (!Number.isFinite(parsedBoxes) || parsedBoxes <= 0) {
      alert("Please enter a valid boxes quantity.");
      return;
    }

    updateOrderItem(orderId, itemIndex, (item) => ({
      ...item,
      boxes: parsedBoxes,
      totalStems: parsedBoxes * getStemsPerBox(item),
      status: "customer_requested_change",
      itemStatus: "customer_requested_change",
      requestedChange: {
        boxes: parsedBoxes,
        length: draft.length.trim() || undefined,
        note: draft.note.trim() || undefined,
      },
    }));

    setOpenEditors((prev) => ({ ...prev, [key]: false }));
  }

  return (
    <section
      style={{
        maxWidth: "1320px",
        margin: "0 auto",
        padding: "60px 24px 90px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "30px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "40px", margin: "0 0 10px", color: "#222" }}>
            My Orders
          </h1>

          <p style={{ margin: 0, color: "#666", lineHeight: 1.8 }}>
            Review your orders, requested delivery dates, and supplier responses.
          </p>
        </div>

        <Link to="/shop" style={{ textDecoration: "none" }}>
          <button
            style={{
              padding: "10px 14px",
              background: "#7dbb2f",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Continue Shopping
          </button>
        </Link>
      </div>

            <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => setActiveFilter("all")}
          style={filterButtonStyle(activeFilter === "all")}
        >
          All ({statusSummary.all})
        </button>

        <button
          onClick={() => setActiveFilter("pending")}
          style={filterButtonStyle(activeFilter === "pending")}
        >
          Pending Action ({statusSummary.pending})
        </button>

        <button
          onClick={() => setActiveFilter("approved")}
          style={filterButtonStyle(activeFilter === "approved")}
        >
          Approved ({statusSummary.approved})
        </button>

        <button
          onClick={() => setActiveFilter("rejected")}
          style={filterButtonStyle(activeFilter === "rejected")}
        >
          Rejected ({statusSummary.rejected})
        </button>
      </div>

      {orders.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Orders</div>
            <div style={summaryValueStyle}>{summary.totalOrders}</div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Boxes</div>
            <div style={summaryValueStyle}>{summary.totalBoxes}</div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Total Stems</div>
            <div style={summaryValueStyle}>{summary.totalStems}</div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Grand Total</div>
            <div style={summaryValueStyle}>{formatMoney(summary.totalAmount)}</div>
          </div>
        </div>
      )}

      {filteredOrders.length === 0 && (
        <div
          style={{
            border: "1px solid #ececec",
            background: "#fafafa",
            padding: "30px",
            borderRadius: "8px",
          }}
        >
          <p style={{ margin: 0, color: "#666", fontSize: "16px" }}>
            No orders yet.
          </p>
        </div>
      )}

      <div style={{ display: "grid", gap: "20px" }}>
{filteredOrders.map((order) => {
  const orderBoxes = order.items.reduce(
    (sum, item) => sum + getBoxes(item),
    0
  );

  const orderStems = order.items.reduce(
    (sum, item) => sum + getTotalStems(item),
    0
  );

  const orderTotal = order.items.reduce(
    (sum, item) => sum + getLineTotal(item),
    0
  );

  const actionRequired = hasActionRequired(order);

  return (
            <div
              key={order.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                background: "#fff",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "20px",
                  flexWrap: "wrap",
                  padding: "20px",
                  borderBottom: "1px solid #ececec",
                  background: "#fafafa",
                }}
              >
                <div>
                  <p style={{ margin: "0 0 8px" }}>
                    <strong>Order ID:</strong> {order.id}
                  </p>
                  <p style={{ margin: "0 0 8px" }}>
                    <strong>Parent Order:</strong> {order.parentOrderId || "-"}
                  </p>
                  <p style={{ margin: "0 0 8px" }}>
                    <strong>Created:</strong> {formatDate(order.createdAt)}
                  </p>
                  <p style={{ margin: "0 0 8px" }}>
                    <strong>Requested Delivery:</strong>{" "}
                    {formatDate(order.deliveryDate)}
                  </p>
                  {order.customer?.name && (
                    <p style={{ margin: "0 0 8px" }}>
                      <strong>Customer:</strong> {order.customer.name}
                    </p>
                  )}
                  {order.customer?.company && (
                    <p style={{ margin: "0 0 8px" }}>
                      <strong>Company:</strong> {order.customer.company}
                    </p>
                  )}
                  {order.customer?.phone && (
                    <p style={{ margin: "0 0 8px" }}>
                      <strong>Phone:</strong> {order.customer.phone}
                    </p>
                  )}

                  {order.shippingAddress && (
                    <div style={{ marginTop: "10px" }}>
                      <strong>Shipping Address:</strong>
                      <div style={{ fontSize: "13px", color: "#555", marginTop: "4px" }}>
                        {order.shippingAddress.name} - {order.shippingAddress.city}
                      </div>
                    </div>
                  )}

                  {order.freightContact && (
                    <div style={{ marginTop: "10px" }}>
                      <strong>Freight Contact:</strong>
                      <div style={{ fontSize: "13px", color: "#555", marginTop: "4px" }}>
                        {order.freightContact.company}
                      </div>
                    </div>
                  )}

                  {order.companyProfile && (
                    <div style={{ marginTop: "10px" }}>
                      <strong>Company Profile:</strong>
                      <div style={{ fontSize: "13px", color: "#555", marginTop: "4px" }}>
                        {order.companyProfile.tradeName || order.companyProfile.legalName}
                      </div>
                    </div>
                  )}
                </div>

                {actionRequired && (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 12px",
      borderRadius: "999px",
      background: "#fff1f2",
      color: "#be123c",
      fontWeight: 800,
      fontSize: "12px",
      marginTop: "10px",
    }}
  >
    ● Action Required
  </div>
)}
                <div style={{ minWidth: "280px" }}>
                  <div style={summaryMiniGridStyle}>
                    <div style={miniStatStyle}>
                      <div style={miniLabelStyle}>Boxes</div>
                      <div style={miniValueStyle}>{orderBoxes}</div>
                    </div>
                    <div style={miniStatStyle}>
                      <div style={miniLabelStyle}>Stems</div>
                      <div style={miniValueStyle}>{orderStems}</div>
                    </div>
                    <div style={miniStatStyle}>
                      <div style={miniLabelStyle}>Total</div>
                      <div style={miniValueStyle}>{formatMoney(orderTotal)}</div>
                    </div>
                    <div style={miniStatStyle}>
                      <div style={miniLabelStyle}>Status</div>
                      <div
                        style={{
                          ...statusPillStyle,
                          background: getStatusBadgeColor(order.status),
                        }}
                      >
                        {formatStatus(order.status)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: "20px" }}>
                <strong
                  style={{
                    display: "block",
                    marginBottom: "14px",
                    color: "#222",
                    fontSize: "18px",
                  }}
                >
                  Items
                </strong>

                {actionRequired && (
                  <p style={{ fontSize: "13px", color: "#be123c", margin: "0 0 14px" }}>
                    This order has supplier updates waiting for your response.
                  </p>
                )}

                <div style={tableWrapStyle}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ background: "#f8faff" }}>
                        <th style={thStyle}>Product</th>
                        <th style={thStyle}>Grower</th>
                        <th style={thStyle}>Stem Price</th>
                        <th style={thStyle}>Stems / Box</th>
                        <th style={thStyle}>Box Price</th>
                        <th style={thStyle}>Boxes</th>
                        <th style={thStyle}>Total Stems</th>
                        <th style={thStyle}>Line Total</th>
                        <th style={thStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, i) => {
                        const boxes = getBoxes(item);
                        const stemsPerBox = getStemsPerBox(item);
                        const totalStems = getTotalStems(item);
                        const pricePerStem = getNumericPrice(item.price);
                        const boxPrice = getBoxPrice(item);
                        const lineTotal = getLineTotal(item);
                        const itemStatus = getDisplayItemStatus(item);
                        const alternative = getAlternativeDisplay(item);
                        const editorKey = `${order.id}-${i}`;
                        const isEditorOpen = openEditors[editorKey];
                        const draft = changeDrafts[editorKey] || {
                          boxes: String(boxes || 1),
                          length:
                            item.requestedChange?.length ||
                            alternative.length ||
                            item.selectedLength ||
                            "",
                          note: item.requestedChange?.note || "",
                        };

                        return (
                          <tr
  key={`${order.id}-${item.slug || i}-${i}`}
  style={{
    background:
      itemStatus === "alternative_offered"
        ? "#fff7ed"
        : itemStatus === "customer_requested_change"
        ? "#eff6ff"
        : "transparent",
  }}
>
                            <td style={tdStyle}>
                              <div
                                style={{
                                  display: "flex",
                                  gap: "12px",
                                  alignItems: "center",
                                }}
                              >
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    style={productThumbStyle}
                                  />
                                ) : null}

                                <div>
                                  <div style={{ fontWeight: 700, color: "#222" }}>
                                    {item.name}
                                  </div>

                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "#777",
                                      marginTop: "4px",
                                    }}
                                  >
                                    {item.boxType || "-"}
                                  </div>

                                  {(item.selectedVariety ||
                                    item.selectedColor ||
                                    item.selectedLength) && (
                                    <div
                                      style={{
                                        display: "grid",
                                        gap: "2px",
                                        fontSize: "12px",
                                        color: "#777",
                                        marginTop: "6px",
                                      }}
                                    >
                                      {item.selectedVariety && (
                                        <div>Variety: {item.selectedVariety}</div>
                                      )}
                                      {item.selectedColor && (
                                        <div>Color: {item.selectedColor}</div>
                                      )}
                                      {item.selectedLength && (
                                        <div>Length: {item.selectedLength}</div>
                                      )}
                                    </div>
                                  )}

                                  {alternative.hasAlternative && (
                                    <div
                                      style={{
                                        marginTop: "10px",
                                        padding: "10px",
                                        border: "1px solid #e5d4ff",
                                        background: "#faf5ff",
                                        borderRadius: "8px",
                                        minWidth: "260px",
                                      }}
                                    >
<div
  style={{
    fontSize: "11px",
    color: "#7c3aed",
    fontWeight: 800,
    background: "#ede9fe",
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "6px",
    marginBottom: "6px",
  }}
>
                                        Alternative Offer
                                      </div>

                                      <div
                                        style={{
                                          display: "flex",
                                          gap: "10px",
                                          alignItems: "center",
                                          marginTop: "8px",
                                        }}
                                      >
                                        {alternative.image ? (
                                          <img
                                            src={alternative.image}
                                            alt={alternative.productName}
                                            style={altThumbStyle}
                                          />
                                        ) : null}

                                        <div>
                                          <div
                                            style={{
                                              fontSize: "13px",
                                              fontWeight: 700,
                                              color: "#222",
                                            }}
                                          >
                                            {alternative.productName}
                                          </div>
                                          <div style={altMetaStyle}>
                                            Length: {alternative.length || "-"}
                                          </div>
                                          <div style={altMetaStyle}>
                                            Price / Stem: {formatMoney(alternative.price)}
                                          </div>
                                          <div style={altMetaStyle}>
                                            Stems / Box: {alternative.stemsPerBox}
                                          </div>
                                          <div style={altMetaStyle}>
                                            Box Type: {alternative.boxType || "-"}
                                          </div>
                                        </div>
                                      </div>

                                      {alternative.note && (
                                        <div style={altNoteStyle}>
                                          Note: {alternative.note}
                                        </div>
                                      )}

                                      {itemStatus === "alternative_offered" && (
                                        <div
                                          style={{
                                            display: "flex",
                                            gap: "8px",
                                            flexWrap: "wrap",
                                            marginTop: "10px",
                                          }}
                                        >
                                          <button
                                            style={miniApproveBtnStyle}
                                            onClick={() => acceptAlternative(order.id, i)}
                                          >
                                            Accept Alternative
                                          </button>

                                          <button
                                            style={miniRejectBtnStyle}
                                            onClick={() => rejectAlternative(order.id, i)}
                                          >
                                            Reject Alternative
                                          </button>

                                          <button
                                            style={miniEditBtnStyle}
                                            onClick={() => openChangeEditor(order.id, i, item)}
                                          >
                                            Request Change
                                          </button>
                                          <div style={{ fontSize: "11px", color: "#666", marginTop: "6px" }}>
  Please respond to continue order processing
</div>
                                        </div>
                                      )}

                                      {itemStatus === "alternative_accepted" && (
                                        <div style={acceptedInfoStyle}>
                                          Alternative accepted.
                                        </div>
                                      )}

                                      {itemStatus === "alternative_rejected" && (
                                        <div style={rejectedInfoStyle}>
                                          Alternative rejected.
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {item.requestedChange && (
                                    <div style={requestedChangeStyle}>
                                      <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                                        Requested Change Sent
                                      </div>
                                      <div>Boxes: {item.requestedChange.boxes || boxes}</div>
                                      <div>
                                        Preferred Length: {item.requestedChange.length || "-"}
                                      </div>
                                      {item.requestedChange.note && (
                                        <div>Note: {item.requestedChange.note}</div>
                                      )}
                                    </div>
                                  )}

                                  {isEditorOpen && (
                                    <div style={editorPanelStyle}>
                                      <div style={editorTitleStyle}>Request item change</div>

                                      <div style={editorGridStyle}>
                                        <div style={editorFieldStyle}>
                                          <label style={editorLabelStyle}>Boxes</label>
                                          <input
                                            type="number"
                                            min="1"
                                            value={draft.boxes}
                                            onChange={(e) =>
                                              setChangeDrafts((prev) => ({
                                                ...prev,
                                                [editorKey]: {
                                                  ...draft,
                                                  boxes: e.target.value,
                                                },
                                              }))
                                            }
                                            style={editorInputStyle}
                                          />
                                        </div>

                                        <div style={editorFieldStyle}>
                                          <label style={editorLabelStyle}>
                                            Preferred Length
                                          </label>
                                          <input
                                            value={draft.length}
                                            onChange={(e) =>
                                              setChangeDrafts((prev) => ({
                                                ...prev,
                                                [editorKey]: {
                                                  ...draft,
                                                  length: e.target.value,
                                                },
                                              }))
                                            }
                                            style={editorInputStyle}
                                            placeholder="Enter preferred length"
                                          />
                                        </div>
                                      </div>

                                      <div style={{ marginTop: "10px" }}>
                                        <label style={editorLabelStyle}>Note</label>
                                        <textarea
                                          value={draft.note}
                                          onChange={(e) =>
                                            setChangeDrafts((prev) => ({
                                              ...prev,
                                              [editorKey]: {
                                                ...draft,
                                                note: e.target.value,
                                              },
                                            }))
                                          }
                                          style={editorTextareaStyle}
                                          placeholder="Tell the grower what you want changed"
                                        />
                                      </div>

                                      <div style={editorActionsStyle}>
                                        <button
                                          style={miniApproveBtnStyle}
                                          onClick={() => saveRequestedChange(order.id, i)}
                                        >
                                          Save Request
                                        </button>
                                        <button
                                          style={miniEditBtnStyle}
                                          onClick={() =>
                                            setOpenEditors((prev) => ({
                                              ...prev,
                                              [editorKey]: false,
                                            }))
                                          }
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td style={tdStyle}>{item.grower || order.grower || "-"}</td>
                            <td style={tdStyle}>{formatMoney(pricePerStem)}</td>
                            <td style={tdStyle}>{stemsPerBox}</td>
                            <td style={tdStyle}>{formatMoney(boxPrice)}</td>
                            <td style={tdStyle}>{boxes}</td>
                            <td style={tdStyle}>{totalStems}</td>
                            <td style={{ ...tdStyle, fontWeight: 700 }}>
                              {formatMoney(lineTotal)}
                            </td>

                            <td style={tdStyle}>
                              <span
                                style={{
                                  ...statusPillStyle,
                                  background: getStatusBadgeColor(itemStatus),
                                }}
                              >
                                {formatStatus(itemStatus)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {order.customer?.notes && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "14px 16px",
                      background: "#fafafa",
                      border: "1px solid #ececec",
                      borderRadius: "6px",
                    }}
                  >
<p style={{ fontSize: "13px", color: "#666", marginBottom: "14px" }}>
  Review items below. If supplier offered alternatives, you can accept, reject, or request changes.
</p>

<strong
  style={{
    display: "block",
    marginBottom: "6px",
    color: "#222",
  }}
>
  Customer Notes
</strong>
                    <span
                      style={{
                        color: "#666",
                        lineHeight: 1.7,
                        fontSize: "14px",
                      }}
                    >
                      {order.customer.notes}
                    </span>
                  </div>
                )}

                <div
                  style={{
                    marginTop: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    alignItems: "center",
                    paddingTop: "12px",
                    borderTop: "1px solid #ececec",
                  }}
                >
                  <span style={{ color: "#555" }}>Total for this order</span>
                  <strong>{formatMoney(orderTotal)}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const summaryCardStyle: React.CSSProperties = {
  border: "1px solid #ececec",
  borderRadius: "12px",
  padding: "16px",
  background: "#fff",
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#777",
  marginBottom: "6px",
};

const summaryValueStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 800,
  color: "#222",
};

const summaryMiniGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "10px",
};

const miniStatStyle: React.CSSProperties = {
  border: "1px solid #ececec",
  borderRadius: "8px",
  padding: "10px",
  background: "#fff",
};

const miniLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#777",
  marginBottom: "4px",
};

const miniValueStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 800,
  color: "#222",
};

const statusPillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "5px 10px",
  borderRadius: "999px",
  color: "#fff",
  fontSize: "12px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const tableWrapStyle: React.CSSProperties = {
  overflowX: "auto",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "1080px",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 14px",
  fontSize: "12px",
  color: "#1f3c88",
  borderBottom: "1px solid #ececec",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "14px",
  borderBottom: "1px solid #f1f1f1",
  verticalAlign: "top",
  fontSize: "14px",
  color: "#444",
};

const productThumbStyle: React.CSSProperties = {
  width: "54px",
  height: "54px",
  borderRadius: "8px",
  objectFit: "cover",
  flexShrink: 0,
  background: "#f5f5f5",
};

const altThumbStyle: React.CSSProperties = {
  width: "44px",
  height: "44px",
  borderRadius: "8px",
  objectFit: "cover",
  flexShrink: 0,
  background: "#f5f5f5",
};

const altMetaStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#555",
  marginTop: "2px",
};

const altNoteStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#6b21a8",
  marginTop: "8px",
  lineHeight: 1.5,
};

const acceptedInfoStyle: React.CSSProperties = {
  marginTop: "10px",
  fontSize: "12px",
  color: "#1e8e3e",
  fontWeight: 700,
};

const rejectedInfoStyle: React.CSSProperties = {
  marginTop: "10px",
  fontSize: "12px",
  color: "#c0392b",
  fontWeight: 700,
};

const requestedChangeStyle: React.CSSProperties = {
  marginTop: "10px",
  padding: "10px",
  border: "1px solid #bfdbfe",
  background: "#dbeafe",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#1e3a8a",
  lineHeight: 1.6,
};

const editorPanelStyle: React.CSSProperties = {
  marginTop: "10px",
  padding: "12px",
  border: "1px solid #dbeafe",
  background: "#f8fbff",
  borderRadius: "8px",
};

const editorTitleStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 800,
  color: "#1f3c88",
  marginBottom: "10px",
};

const editorGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const editorFieldStyle: React.CSSProperties = {
  display: "grid",
  gap: "6px",
};

const editorLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#444",
};

const editorInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #d9d9d9",
  background: "#fff",
  outline: "none",
};

const editorTextareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "80px",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #d9d9d9",
  background: "#fff",
  outline: "none",
  resize: "vertical",
  marginTop: "6px",
};

const editorActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginTop: "10px",
};

const miniApproveBtnStyle: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: "8px",
  border: "none",
  background: "#7dbb2f",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "11px",
};

const miniRejectBtnStyle: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: "8px",
  border: "none",
  background: "#c53b3b",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "11px",
};

const miniEditBtnStyle: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: "8px",
  border: "1px solid #d9d9d9",
  background: "#fff",
  color: "#222",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "11px",
};

function filterButtonStyle(active: boolean): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: "999px",
    border: active ? "1px solid #7dbb2f" : "1px solid #d9d9d9",
    background: active ? "#eef8df" : "#fff",
    color: active ? "#3f6b0b" : "#444",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "12px",
  };
}
