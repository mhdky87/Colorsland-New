import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { getMergedGrowerCatalog } from "../data/catalogHelpers";

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
  alternativeLengths?: Array<{ length: string; price: number | string }>;
};

type GrowerOrder = {
  id: string;
  parentOrderId?: string;
  grower: string;
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
  items: OrderItem[];
};

function deriveParentStatus(childStatuses: string[]) {
  if (childStatuses.length === 0) return "pending_review";

  const allApproved = childStatuses.every((status) => status === "approved");
  if (allApproved) return "approved";

  const allRejected = childStatuses.every((status) => status === "rejected");
  if (allRejected) return "rejected";

  if (childStatuses.some((status) => status === "alternative_offered")) {
    return "alternative_offered";
  }

  if (childStatuses.some((status) => status === "partially_approved")) {
    return "partially_approved";
  }

  if (childStatuses.some((status) => status === "approved")) {
    return "partially_approved";
  }

  return "pending_review";
}

function deriveGrowerStatus(itemStatuses: string[]) {
  if (
    itemStatuses.length > 0 &&
    itemStatuses.every(
      (status) => status === "approved" || status === "alternative_accepted"
    )
  ) {
    return "approved";
  }

  if (
    itemStatuses.length > 0 &&
    itemStatuses.every(
      (status) => status === "rejected" || status === "alternative_rejected"
    )
  ) {
    return "rejected";
  }

  if (itemStatuses.some((status) => status === "alternative_offered")) {
    return "alternative_offered";
  }

  if (
    itemStatuses.some((status) =>
      ["approved", "alternative_accepted"].includes(status)
    )
  ) {
    return "partially_approved";
  }

  return "pending_review";
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case "approved":
      return "#1e8e3e";
    case "partially_approved":
      return "#d97706";
    case "alternative_offered":
      return "#7c3aed";
    case "rejected":
      return "#c0392b";
    case "alternative_accepted":
      return "#1e8e3e";
    case "alternative_rejected":
      return "#c0392b";
    case "pending":
    case "pending_review":
    default:
      return "#b7791f";
  }
}

function formatStatus(status: string) {
  return String(status || "pending_review")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
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

function getNumericPrice(value: number | string | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const cleaned = value.replace(/\$/g, "").trim();
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
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

function hasAlternative(item: OrderItem) {
  return Boolean(item.alternativeName || item.alternativeProductId);
}

export default function GrowerOrdersPage() {
  const [orders, setOrders] = useState<GrowerOrder[]>([]);

  const growerSlug = localStorage.getItem("grower");

  if (!growerSlug) {
    return <Navigate to="/grower-login" replace />;
  }

  const catalog = useMemo(() => getMergedGrowerCatalog(growerSlug), [growerSlug]);

  const categoryOptions = useMemo(() => {
    return [...catalog.categories].sort((a, b) => a.localeCompare(b));
  }, [catalog.categories]);

  const productsByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    catalog.products.forEach((product: any) => {
      const categoryKey = String(product.category || "").toLowerCase();
      if (!grouped[categoryKey]) grouped[categoryKey] = [];
      grouped[categoryKey].push(product);
    });

    Object.keys(grouped).forEach((key) => {
      grouped[key] = grouped[key].sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );
    });

    return grouped;
  }, [catalog.products]);

  const syncGrowerOrders = (storedOrders: any[]) => {
    const filtered = storedOrders.filter(
      (order: any) => order.grower === growerSlug && order.parentOrderId
    );
    setOrders(filtered);
  };

  const persistOrders = (updater: (storedOrders: any[]) => any[]) => {
    const stored = JSON.parse(localStorage.getItem("orders") || "[]");
    const updated = updater(stored);
    localStorage.setItem("orders", JSON.stringify(updated));
    syncGrowerOrders(updated);
  };

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("orders") || "[]");
    syncGrowerOrders(stored);
  }, [growerSlug]);

  const summary = useMemo(() => {
    const totalOrders = orders.length;
    const totalBoxes = orders.reduce(
      (sum, order) => sum + order.items.reduce((s, item) => s + getBoxes(item), 0),
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

  const updateParentOrderStatus = (updatedOrders: any[], childOrderId: string) => {
    const currentChildOrder = updatedOrders.find((o: any) => o.id === childOrderId);

    if (currentChildOrder?.parentOrderId) {
      const siblingChildOrders = updatedOrders.filter(
        (o: any) =>
          o.parentOrderId === currentChildOrder.parentOrderId &&
          o.grower
      );

      const parentStatus = deriveParentStatus(
        siblingChildOrders.map((o: any) => o.status)
      );

      for (let i = 0; i < updatedOrders.length; i++) {
        if (
          updatedOrders[i].id === currentChildOrder.parentOrderId &&
          !updatedOrders[i].parentOrderId
        ) {
          updatedOrders[i] = {
            ...updatedOrders[i],
            status: parentStatus,
          };
          break;
        }
      }
    }

    return updatedOrders;
  };

  const handleOrderStatusChange = (orderId: string, newStatus: string) => {
    persistOrders((stored) => {
      const updated = stored.map((o: any) => {
        if (o.id !== orderId) return o;

        const nextItems = Array.isArray(o.items)
          ? o.items.map((item: any) => {
              const mappedItemStatus =
                newStatus === "approved"
                  ? "approved"
                  : newStatus === "rejected"
                  ? "rejected"
                  : newStatus === "pending_review"
                  ? "pending"
                  : newStatus === "alternative_offered"
                  ? "alternative_offered"
                  : item.status || "pending";

              return {
                ...item,
                status: mappedItemStatus,
              };
            })
          : o.items;

        return {
          ...o,
          status: newStatus,
          items: nextItems,
        };
      });

      return updateParentOrderStatus(updated, orderId);
    });
  };

  const handleItemStatusChange = (
    orderId: string,
    itemIndex: number,
    newStatus: string
  ) => {
    persistOrders((stored) => {
      const updated = stored.map((o: any) => {
        if (o.id !== orderId) return o;

        const updatedItems = o.items.map((it: any, index: number) => {
          if (index !== itemIndex) return it;

          const nextItem: any = {
            ...it,
            status: newStatus,
          };

          if (newStatus !== "alternative_offered") {
            nextItem.alternativeName = "";
            nextItem.alternativePrice = "";
            nextItem.alternativeSlug = "";
            nextItem.alternativeImage = "";
            nextItem.alternativeBoxType = "";
            nextItem.alternativeStemsPerBox = undefined;
            nextItem.alternativeCategory = "";
            nextItem.alternativeProductId = "";
          }

          return nextItem;
        });

        return {
          ...o,
          items: updatedItems,
          status: deriveGrowerStatus(updatedItems.map((it: any) => it.status || "pending")),
        };
      });

      return updateParentOrderStatus(updated, orderId);
    });
  };

  const handleAlternativeCategoryChange = (
    orderId: string,
    itemIndex: number,
    category: string
  ) => {
    persistOrders((stored) =>
      stored.map((o: any) => {
        if (o.id !== orderId) return o;

        return {
          ...o,
          items: o.items.map((it: any, index: number) =>
            index === itemIndex
              ? {
                  ...it,
                  status: "alternative_offered",
                  alternativeCategory: category,
                  alternativeProductId: "",
                  alternativeName: "",
                  alternativePrice: "",
                  alternativeSlug: "",
                  alternativeImage: "",
                  alternativeBoxType: "",
                  alternativeStemsPerBox: undefined,
                  alternativeLength: "",
                  alternativeLengths: [],
                }
              : it
          ),
        };
      })
    );
  };

  const handleAlternativeProductChange = (
    orderId: string,
    itemIndex: number,
    productId: string
  ) => {
    const alternativeProduct = catalog.products.find(
      (product: any) => String(product.id) === productId
    );

    if (!alternativeProduct) return;

    persistOrders((stored) =>
      stored.map((o: any) => {
        if (o.id !== orderId) return o;

        return {
          ...o,
          items: o.items.map((it: any, index: number) =>
            index === itemIndex
              ? {
                  ...it,
                  status: "alternative_offered",
                  alternativeCategory: String(alternativeProduct.category || ""),
                  alternativeProductId: String(alternativeProduct.id || productId),
                  alternativeName: alternativeProduct.name,
                  alternativePrice: "",
                  alternativeSlug: alternativeProduct.slug,
                  alternativeImage: alternativeProduct.image || "",
                  alternativeBoxType: alternativeProduct.boxType || "",
                  alternativeStemsPerBox: Number(alternativeProduct.stemsPerBox || 0),
                  alternativeLength: "",
                  alternativeLengths: Array.isArray(alternativeProduct.lengths)
                    ? alternativeProduct.lengths
                    : [],
                }
              : it
          ),
        };
      })
    );
  };

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
            Grower Orders
          </h1>

          <p style={{ margin: 0, color: "#666", lineHeight: 1.8 }}>
            Logged in as <strong>{growerSlug}</strong>. You can review only the
            orders assigned to your grower account.
          </p>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("grower");
            window.location.href = "/grower-login";
          }}
          style={{
            padding: "10px 14px",
            background: "#c0392b",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Logout
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

      {orders.length === 0 && (
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
        {orders.map((order) => {
          const orderBoxes = order.items.reduce((sum, item) => sum + getBoxes(item), 0);
          const orderStems = order.items.reduce(
            (sum, item) => sum + getTotalStems(item),
            0
          );
          const orderTotal = order.items.reduce(
            (sum, item) => sum + getLineTotal(item),
            0
          );

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
                    <strong>Parent Order:</strong> {order.parentOrderId}
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
                  {order.deliveryDate && (
                    <p style={{ margin: 0 }}>
                      <strong>Delivery Date:</strong> {order.deliveryDate}
                    </p>
                  )}
                </div>

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

                  <div style={{ marginTop: "14px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: 700,
                        color: "#222",
                      }}
                    >
                      Order Status
                    </label>

                    <select
                      value={order.status}
                      onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        minWidth: "220px",
                        width: "100%",
                      }}
                    >
                      <option value="pending_review">Pending Review</option>
                      <option value="approved">Approved</option>
                      <option value="partially_approved">Partially Approved</option>
                      <option value="alternative_offered">Alternative Offered</option>
                      <option value="rejected">Rejected</option>
                    </select>
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

                <div style={tableWrapStyle}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ background: "#f8faff" }}>
                        <th style={thStyle}>Product</th>
                        <th style={thStyle}>Stem Price</th>
                        <th style={thStyle}>Stems / Box</th>
                        <th style={thStyle}>Box Price</th>
                        <th style={thStyle}>Boxes</th>
                        <th style={thStyle}>Total Stems</th>
                        <th style={thStyle}>Line Total</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Action</th>
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

                        return (
                          <tr key={`${order.id}-${item.slug || i}-${i}`}>
                            <td style={tdStyle}>
                              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
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

                                  <div style={{ fontSize: "12px", color: "#777", marginTop: "4px" }}>
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
                                </div>
                              </div>
                            </td>

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
                                  background: getStatusBadgeColor(item.status || "pending"),
                                }}
                              >
                                {formatStatus(item.status || "pending")}
                              </span>
                            </td>

                            <td style={tdStyle}>
                              <select
                                value={item.status || "pending"}
                                onChange={(e) => handleItemStatusChange(order.id, i, e.target.value)}
                                style={{
                                  padding: "6px",
                                  borderRadius: "4px",
                                  border: "1px solid #ccc",
                                  minWidth: "170px",
                                }}
                              >
                                <option value="pending">Pending</option>
                                <option value="approved">Available</option>
                                <option value="rejected">Not Available</option>
                                <option value="alternative_offered">Offer Alternative</option>
                                <option value="alternative_accepted">Alternative Accepted</option>
                                <option value="alternative_rejected">Alternative Rejected</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "grid", gap: "12px", marginTop: "18px" }}>
                  {order.items.map((item: any, i: number) => {
                    const selectedCategory = String(item.alternativeCategory || "").toLowerCase();
                    const categoryProducts = selectedCategory
                      ? productsByCategory[selectedCategory] || []
                      : [];

                    return (
                      <div
                        key={`extra-${order.id}-${item.slug || i}-${i}`}
                        style={{
                          border: "1px solid #ececec",
                          borderRadius: "8px",
                          padding: "14px",
                          background: "#fcfcfc",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "12px",
                            flexWrap: "wrap",
                            alignItems: "start",
                            marginBottom: item.status === "alternative_offered" ? "14px" : "10px",
                          }}
                        >
                          <div>
                            <strong>{item.name}</strong>
                            <div style={{ fontSize: "13px", color: "#666", marginTop: "6px" }}>
                              Stem Price: {formatMoney(getNumericPrice(item.price))} · Box Price:{" "}
                              {formatMoney(getBoxPrice(item))} · Boxes: {getBoxes(item)} · Total:{" "}
                              {formatMoney(getLineTotal(item))}
                            </div>
                          </div>

                          <span
                            style={{
                              ...statusPillStyle,
                              background: getStatusBadgeColor(item.status || "pending"),
                            }}
                          >
                            {formatStatus(item.status || "pending")}
                          </span>
                        </div>

                        {item.status === "alternative_offered" && (
                          <div style={{ display: "grid", gap: "10px", marginBottom: "12px" }}>
                            <div style={{ display: "grid", gap: "6px" }}>
                              <label style={fieldLabelStyle}>Alternative category</label>
                              <select
                                value={selectedCategory}
                                onChange={(e) =>
                                  handleAlternativeCategoryChange(order.id, i, e.target.value)
                                }
                                style={inputStyle}
                              >
                                <option value="">Select category</option>
                                {categoryOptions.map((category) => (
                                  <option key={category} value={category}>
                                    {category}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div style={{ display: "grid", gap: "6px" }}>
                              <label style={fieldLabelStyle}>Alternative product</label>
                              <select
                                value={item.alternativeProductId || ""}
                                onChange={(e) =>
                                  handleAlternativeProductChange(order.id, i, e.target.value)
                                }
                                style={inputStyle}
                                disabled={!selectedCategory}
                              >
                                <option value="">
                                  {selectedCategory
                                    ? "Select product"
                                    : "Select category first"}
                                </option>
                                {categoryProducts.map((product: any) => (
                                  <option key={product.id} value={product.id}>
                                    {product.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {Array.isArray(item.alternativeLengths) &&
                              item.alternativeLengths.length > 0 && (
                                <div style={{ display: "grid", gap: "6px" }}>
                                  <label style={fieldLabelStyle}>Alternative length</label>
                                  <select
                                    value={item.alternativeLength || ""}
                                    onChange={(e) => {
                                      const selectedLength = e.target.value;
                                      const matchedLength = item.alternativeLengths?.find(
                                        (lengthOption: any) =>
                                          String(lengthOption.length) === selectedLength
                                      );

                                      if (!matchedLength) return;

                                      persistOrders((stored) =>
                                        stored.map((o: any) => {
                                          if (o.id !== order.id) return o;

                                          return {
                                            ...o,
                                            items: o.items.map((it: any, index: number) =>
                                              index === i
                                                ? {
                                                    ...it,
                                                    alternativeLength: selectedLength,
                                                    alternativePrice:
                                                      matchedLength.price ?? "",
                                                  }
                                                : it
                                            ),
                                          };
                                        })
                                      );
                                    }}
                                    style={inputStyle}
                                    disabled={!item.alternativeProductId}
                                  >
                                    <option value="">
                                      {item.alternativeProductId
                                        ? "Select length"
                                        : "Select product first"}
                                    </option>
                                    {item.alternativeLengths.map((lengthOption: any) => (
                                      <option
                                        key={`${lengthOption.length}-${lengthOption.price}`}
                                        value={lengthOption.length}
                                      >
                                        {lengthOption.length} —{" "}
                                        {formatMoney(
                                          getNumericPrice(lengthOption.price)
                                        )}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                          </div>
                        )}

                        {hasAlternative(item) && (
                          <div style={alternativePreviewStyle}>
                            <div
                              style={{
                                fontSize: "11px",
                                fontWeight: 800,
                                color: "#7c3aed",
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                marginBottom: "10px",
                              }}
                            >
                              Offered alternative
                            </div>

                            <div style={{ display: "grid", gap: "10px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  gap: "12px",
                                  alignItems: "center",
                                  opacity: 0.45,
                                }}
                              >
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    style={productThumbStyle}
                                  />
                                ) : null}

                                <div style={{ display: "grid", gap: "4px" }}>
                                  <strong style={{ color: "#222" }}>{item.name}</strong>
                                  <div style={{ fontSize: "13px", color: "#555" }}>
                                    Length: {item.selectedLength || "-"}
                                  </div>
                                  <div style={{ fontSize: "13px", color: "#555" }}>
                                    Stem Price: {formatMoney(getNumericPrice(item.price))}
                                  </div>
                                  <div style={{ fontSize: "12px", color: "#777" }}>
                                    {item.boxType || "-"}
                                  </div>
                                </div>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  gap: "12px",
                                  alignItems: "center",
                                  background: "#f3f0ff",
                                  border: "1px solid #e9ddff",
                                  borderRadius: "8px",
                                  padding: "10px",
                                }}
                              >
                                {item.alternativeImage ? (
                                  <img
                                    src={item.alternativeImage}
                                    alt={item.alternativeName || "Alternative"}
                                    style={productThumbStyle}
                                  />
                                ) : null}

                                <div style={{ display: "grid", gap: "4px" }}>
                                  <strong style={{ color: "#222" }}>{item.alternativeName}</strong>
                                  <div style={{ fontSize: "13px", color: "#555" }}>
                                    Length: {item.alternativeLength || "-"}
                                  </div>
                                  <div style={{ fontSize: "13px", color: "#555" }}>
                                    Stem Price: {formatMoney(getNumericPrice(item.alternativePrice))}
                                  </div>
                                  <div style={{ fontSize: "13px", color: "#555" }}>
                                    Stems / Box:{" "}
                                    {Number(
                                      item.alternativeStemsPerBox ||
                                        item.stemsPerBox ||
                                        0
                                    )}
                                  </div>
                                  <div style={{ fontSize: "12px", color: "#777" }}>
                                    {item.alternativeBoxType || item.boxType || "-"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div style={{ display: "grid", gap: "6px", marginTop: hasAlternative(item) ? "10px" : 0 }}>
                          {item.status === "approved" && (
                            <span style={{ color: "#1e8e3e", fontSize: "13px" }}>
                              ✔ Available
                            </span>
                          )}

                          {item.status === "rejected" && (
                            <span style={{ color: "#c0392b", fontSize: "13px" }}>
                              ❌ Not Available
                            </span>
                          )}

                          {item.status === "alternative_offered" && (
                            <span style={{ color: "#7c3aed", fontSize: "13px" }}>
                              🔁 Alternative Offered
                            </span>
                          )}

                          {item.status === "alternative_accepted" && (
                            <span style={{ color: "#1e8e3e", fontSize: "13px" }}>
                              ✅ Alternative Accepted
                            </span>
                          )}

                          {item.status === "alternative_rejected" && (
                            <span style={{ color: "#c0392b", fontSize: "13px" }}>
                              ❌ Alternative Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                  <span style={{ color: "#555" }}>
                    Total for this grower order
                  </span>
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
  minWidth: "1100px",
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "6px",
  border: "1px solid #ddd",
  fontSize: "14px",
  background: "#fff",
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#555",
};

const alternativePreviewStyle: React.CSSProperties = {
  border: "1px solid #eadcff",
  background: "#faf5ff",
  borderRadius: "10px",
  padding: "12px",
};
