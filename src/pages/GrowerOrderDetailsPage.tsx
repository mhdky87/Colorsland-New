import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { getMergedGrowerCatalog } from "../data/catalogHelpers";

type OrderItemStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "alternative_offered"
  | "alternative_accepted"
  | "alternative_rejected"
  | "customer_requested_change";

type ProductLengthOption = {
  length: string;
  price: number;
};

type CatalogProduct = {
  id?: string;
  slug: string;
  name: string;
  image?: string;
  description?: string;
  category: string;
  grower: string;
  price: number;
  boxType?: string;
  stemsPerBox: number;
  length?: string;
  lengths?: ProductLengthOption[];
  packing?: string;
  isActive?: boolean;
};

type OrderItem = {
  slug: string;
  name: string;
  price: string | number;
  image?: string;
  grower: string;
  boxType?: string;
  stemsPerBox: number;
  boxes: number;
  totalStems: number;
  selectedVariety?: string;
  selectedColor?: string;
  selectedLength?: string;
  deliveryDate?: string;
  itemStatus?: OrderItemStatus;
  status?: OrderItemStatus;
  alternativeOffer?: {
    category?: string;
    productSlug?: string;
    productName?: string;
    productId?: string;
    image?: string;
    boxType?: string;
    stemsPerBox?: number;
    length?: string;
    price?: number;
    note?: string;
  };
  requestedChange?: {
    boxes?: number;
    length?: string;
    note?: string;
  };
};

type GrowerOrder = {
  id?: string;
  parentOrderId?: string;
  grower?: string;
  status: string;
  createdAt?: string;
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

type AlternativeDraft = {
  category: string;
  productSlug: string;
  length: string;
  price: string;
  note: string;
};

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

function getNumericPrice(value: string | number | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(/\$/g, "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function getLineTotal(item: OrderItem) {
  return (
    getNumericPrice(item.price) *
    Number(item.stemsPerBox || 0) *
    Number(item.boxes || 0)
  );
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeLengths(product: CatalogProduct | undefined): ProductLengthOption[] {
  if (!product) return [];

  if (Array.isArray(product.lengths) && product.lengths.length > 0) {
    return product.lengths
      .map((entry) => ({
        length: String(entry.length || "").trim(),
        price: Number(entry.price || 0),
      }))
      .filter((entry) => entry.length);
  }

  if (product.length) {
    return [
      {
        length: String(product.length).trim(),
        price: Number(product.price || 0),
      },
    ];
  }

  return [];
}

function normalizeOrder(order: GrowerOrder): GrowerOrder {
  return {
    ...order,
    id: order.id || "",
    grower: order.grower || "",
    createdAt: order.createdAt || "",
    status: order.status || "pending_review",
    items: Array.isArray(order.items)
      ? order.items.map((item) => ({
          ...item,
          itemStatus:
            (item.itemStatus || item.status || "pending_review") as OrderItemStatus,
        }))
      : [],
  };
}

function recalculateParentStatus(items: OrderItem[]) {
  if (items.length === 0) return "pending_review";

  const statuses = items.map((item) => item.itemStatus || "pending_review");

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
    return "partially_reviewed";
  }

  return "pending_review";
}

export default function GrowerOrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const currentGrower = localStorage.getItem("grower") || "";

  const [order, setOrder] = useState<GrowerOrder | null>(null);
  const [allOrders, setAllOrders] = useState<GrowerOrder[]>([]);
  const [alternativeDrafts, setAlternativeDrafts] = useState<
    Record<number, AlternativeDraft>
  >({});
  const [openAlternativeRows, setOpenAlternativeRows] = useState<Record<number, boolean>>(
    {}
  );

  const catalogProducts = useMemo<CatalogProduct[]>(() => {
    if (!currentGrower) return [];

    const merged = getMergedGrowerCatalog(currentGrower);
    const products = Array.isArray(merged?.products)
      ? (merged.products as CatalogProduct[])
      : [];

    return products.filter((product) => product.isActive !== false);
  }, [currentGrower]);

  const catalogCategories = useMemo(() => {
    return Array.from(
      new Set(
        catalogProducts
          .map((product) => String(product.category || "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [catalogProducts]);

  useEffect(() => {
    const storedOrders = safeRead<GrowerOrder[]>("orders", []);
    const normalizedOrders = storedOrders.map(normalizeOrder);

    setAllOrders(normalizedOrders);

    const foundOrder =
      normalizedOrders.find(
        (entry) => entry.id === orderId && entry.grower === currentGrower
      ) || null;

    setOrder(foundOrder);

    if (foundOrder) {
      const initiallyOpen: Record<number, boolean> = {};
      foundOrder.items.forEach((item, index) => {
        if (
          item.itemStatus === "alternative_offered" ||
          item.alternativeOffer
        ) {
          initiallyOpen[index] = true;
        }
      });
      setOpenAlternativeRows(initiallyOpen);
    }
  }, [orderId, currentGrower]);

  const summary = useMemo(() => {
    if (!order) {
      return {
        totalBoxes: 0,
        totalStems: 0,
        totalAmount: 0,
      };
    }

    return {
      totalBoxes: order.items.reduce(
        (sum, item) => sum + Number(item.boxes || 0),
        0
      ),
      totalStems: order.items.reduce(
        (sum, item) => sum + Number(item.totalStems || 0),
        0
      ),
      totalAmount: order.items.reduce(
        (sum, item) => sum + getLineTotal(item),
        0
      ),
    };
  }, [order]);

  if (!currentGrower) {
    return <Navigate to="/grower-login" replace />;
  }

  if (!order) {
    return (
      <section style={pageStyle}>
        <div style={topBarStyle}>
          <button
            style={secondaryButtonStyle}
            onClick={() => navigate("/grower-admin")}
          >
            ← Back
          </button>
        </div>

        <div style={emptyStateStyle}>Order not found for this grower account.</div>
      </section>
    );
  }

  const safeOrder = order;

  function persistUpdatedOrder(updatedOrder: GrowerOrder) {
    const updatedOrders = allOrders.map((entry) =>
      entry.id === updatedOrder.id ? updatedOrder : entry
    );

    setAllOrders(updatedOrders);
    setOrder(updatedOrder);
    safeSave("orders", updatedOrders);
  }

  function updateWholeOrderStatus(newStatus: string) {
    const updatedOrder: GrowerOrder = {
      ...safeOrder,
      status: newStatus,
      items: safeOrder.items.map((item) => ({
        ...item,
        itemStatus:
          newStatus === "approved"
            ? "approved"
            : newStatus === "rejected"
            ? "rejected"
            : (item.itemStatus || "pending_review"),
      })),
    };

    persistUpdatedOrder(updatedOrder);
  }

  function updateItemStatus(index: number, newStatus: OrderItemStatus) {
    const updatedItems = safeOrder.items.map((item, itemIndex) =>
      itemIndex === index
        ? {
            ...item,
            itemStatus: newStatus,
            status: newStatus,
            alternativeOffer:
              newStatus === "alternative_offered" ||
              newStatus === "alternative_accepted" ||
              newStatus === "customer_requested_change"
                ? item.alternativeOffer
                : newStatus === "alternative_rejected"
                ? item.alternativeOffer
                : undefined,
          }
        : item
    );

    const updatedOrder: GrowerOrder = {
      ...safeOrder,
      items: updatedItems,
      status: recalculateParentStatus(updatedItems),
    };

    persistUpdatedOrder(updatedOrder);

    if (newStatus === "alternative_offered") {
      setOpenAlternativeRows((prev) => ({ ...prev, [index]: true }));
    } else {
      setOpenAlternativeRows((prev) => ({ ...prev, [index]: false }));
    }
  }

  function getProductsByCategory(category: string) {
    return catalogProducts.filter(
      (product) =>
        String(product.category || "").toLowerCase() ===
        String(category || "").toLowerCase()
    );
  }

  function getProductBySlug(slug: string) {
    return catalogProducts.find((product) => product.slug === slug);
  }

  function updateAlternativeDraft(
    index: number,
    field: keyof AlternativeDraft,
    value: string
  ) {
    setAlternativeDrafts((prev) => {
      const current: AlternativeDraft = prev[index] || {
        category: "",
        productSlug: "",
        length: "",
        price: "",
        note: "",
      };

      const next: AlternativeDraft = {
        ...current,
        [field]: value,
      };

      if (field === "category") {
        next.productSlug = "";
        next.length = "";
        next.price = "";
      }

      if (field === "productSlug") {
        const selectedProduct = getProductBySlug(value);
        const lengths = normalizeLengths(selectedProduct);

        next.length = lengths[0]?.length || "";
        next.price =
          lengths[0]?.price != null
            ? String(lengths[0].price)
            : selectedProduct
            ? String(selectedProduct.price || "")
            : "";
      }

      if (field === "length") {
        const selectedProduct = getProductBySlug(next.productSlug);
        const lengths = normalizeLengths(selectedProduct);
        const selectedLength = lengths.find((entry) => entry.length === value);

        if (selectedLength) {
          next.price = String(selectedLength.price);
        }
      }

      return {
        ...prev,
        [index]: next,
      };
    });
  }

  function openAlternativeForItem(index: number, item: OrderItem) {
    const initialCategory = item.alternativeOffer?.category || "";
    const initialProductSlug = item.alternativeOffer?.productSlug || "";
    const initialLength = item.alternativeOffer?.length || "";
    const initialPrice =
      item.alternativeOffer?.price != null
        ? String(item.alternativeOffer.price)
        : "";
    const initialNote = item.alternativeOffer?.note || "";

    setAlternativeDrafts((prev) => ({
      ...prev,
      [index]: prev[index] || {
        category: initialCategory,
        productSlug: initialProductSlug,
        length: initialLength,
        price: initialPrice,
        note: initialNote,
      },
    }));

    setOpenAlternativeRows((prev) => ({ ...prev, [index]: true }));
  }

  function saveAlternative(index: number) {
    const draft = alternativeDrafts[index];

    if (!draft?.category.trim()) {
      alert("Please select category.");
      return;
    }

    if (!draft?.productSlug.trim()) {
      alert("Please select alternative product.");
      return;
    }

    const selectedProduct = getProductBySlug(draft.productSlug);

    if (!selectedProduct) {
      alert("Selected product not found.");
      return;
    }

    const parsedPrice = Number(draft.price);

    if (!draft.price.trim() || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      alert("Please enter valid alternative price per stem.");
      return;
    }

    const selectedLengths = normalizeLengths(selectedProduct);
    const selectedLengthEntry = selectedLengths.find(
      (entry) => entry.length === draft.length
    );

    const updatedItems = safeOrder.items.map((item, itemIndex) =>
      itemIndex === index
        ? {
            ...item,
            itemStatus: "alternative_offered" as const,
            status: "alternative_offered" as const,
            alternativeOffer: {
              category: draft.category.trim(),
              productSlug: selectedProduct.slug,
              productName: selectedProduct.name,
              productId: selectedProduct.id,
              image: selectedProduct.image,
              boxType: selectedProduct.boxType,
              stemsPerBox: Number(
                selectedLengthEntry?.price != null || selectedProduct.stemsPerBox
                  ? selectedProduct.stemsPerBox || 0
                  : item.stemsPerBox || 0
              ),
              length: draft.length.trim() || undefined,
              price: parsedPrice,
              note: draft.note.trim() || undefined,
            },
          }
        : item
    );

    const updatedOrder: GrowerOrder = {
      ...safeOrder,
      items: updatedItems,
      status: recalculateParentStatus(updatedItems),
    };

    persistUpdatedOrder(updatedOrder);
    setOpenAlternativeRows((prev) => ({ ...prev, [index]: false }));
    alert("Alternative offer saved.");
  }

  return (
    <section style={pageStyle}>
      <div style={topBarStyle}>
        <button
          style={secondaryButtonStyle}
          onClick={() => navigate("/grower-admin")}
        >
          ← Back to Grower Dashboard
        </button>

        <div style={topActionsStyle}>
          <button
            style={approveButtonStyle}
            onClick={() => updateWholeOrderStatus("approved")}
          >
            Approve All
          </button>

          <button
            style={dangerButtonStyle}
            onClick={() => updateWholeOrderStatus("rejected")}
          >
            Reject All
          </button>

          <div style={badgeStyle(safeOrder.status)}>
            {formatStatus(safeOrder.status)}
          </div>
        </div>
      </div>

      <div style={headerCompactStyle}>
        <div style={compactInfoBoxStyle}>
          <div style={compactLabelStyle}>Order</div>
          <div style={compactValueStyle}>{safeOrder.id}</div>
        </div>

        <div style={compactInfoBoxStyle}>
          <div style={compactLabelStyle}>Customer</div>
          <div style={compactValueStyle}>{safeOrder.customer?.name || "Unknown"}</div>
        </div>

        <div style={compactInfoBoxStyle}>
          <div style={compactLabelStyle}>Company</div>
          <div style={compactValueStyle}>{safeOrder.customer?.company || "-"}</div>
        </div>

        <div style={compactInfoBoxStyle}>
          <div style={compactLabelStyle}>Phone</div>
          <div style={compactValueStyle}>{safeOrder.customer?.phone || "-"}</div>
        </div>

        <div style={compactInfoBoxStyle}>
          <div style={compactLabelStyle}>City</div>
          <div style={compactValueStyle}>{safeOrder.customer?.city || "-"}</div>
        </div>

        <div style={compactInfoBoxStyle}>
          <div style={compactLabelStyle}>Delivery</div>
          <div style={compactValueStyle}>{safeOrder.deliveryDate || "-"}</div>
        </div>

        <div style={compactInfoBoxStyle}>
          <div style={compactLabelStyle}>Boxes</div>
          <div style={compactValueStyle}>{summary.totalBoxes}</div>
        </div>

        <div style={compactInfoBoxStyle}>
          <div style={compactLabelStyle}>Stems</div>
          <div style={compactValueStyle}>{summary.totalStems}</div>
        </div>

        <div style={compactInfoBoxStyle}>
          <div style={compactLabelStyle}>Value</div>
          <div style={compactValueStyle}>{formatMoney(summary.totalAmount)}</div>
        </div>
      </div>
      <div style={detailsGridStyle}>
        {safeOrder.shippingAddress && (
          <div style={notesPanelStyle}>
            <div style={notesLabelStyle}>Shipping Address</div>
            <div style={notesValueStyle}>
              <div>{safeOrder.shippingAddress.name || "-"}</div>
              <div>{safeOrder.shippingAddress.address || "-"}</div>
              <div>
                {safeOrder.shippingAddress.city || "-"} - {safeOrder.shippingAddress.state || "-"}
              </div>
              <div>
                {safeOrder.shippingAddress.country || "-"}
                {safeOrder.shippingAddress.zip ? ` - ${safeOrder.shippingAddress.zip}` : ""}
              </div>
              {safeOrder.shippingAddress.phone && (
                <div>
                  {safeOrder.shippingAddress.phoneCode || ""} {safeOrder.shippingAddress.phone}
                </div>
              )}
            </div>
          </div>
        )}

        {safeOrder.freightContact && (
          <div style={notesPanelStyle}>
            <div style={notesLabelStyle}>Freight Contact</div>
            <div style={notesValueStyle}>
              <div>{safeOrder.freightContact.company || "-"}</div>
              <div>{safeOrder.freightContact.name || "-"}</div>
              <div>
                {safeOrder.freightContact.phoneCode || ""} {safeOrder.freightContact.phone || "-"}
              </div>
              <div>{safeOrder.freightContact.email || "-"}</div>
              <div>{safeOrder.freightContact.country || "-"}</div>
            </div>
          </div>
        )}

        {safeOrder.companyProfile && (
          <div style={notesPanelStyle}>
            <div style={notesLabelStyle}>Company Profile</div>
            <div style={notesValueStyle}>
              <div>
                {safeOrder.companyProfile.tradeName ||
                  safeOrder.companyProfile.legalName ||
                  "-"}
              </div>
              <div>{safeOrder.companyProfile.address || "-"}</div>
              <div>
                {safeOrder.companyProfile.city || "-"} - {safeOrder.companyProfile.state || "-"}
              </div>
              <div>{safeOrder.companyProfile.country || "-"}</div>
              <div>{safeOrder.companyProfile.email || "-"}</div>
              <div>{safeOrder.companyProfile.phone || "-"}</div>
            </div>
          </div>
        )}
      </div>
        {safeOrder.freightContact && (
          <div style={notesPanelStyle}>
            <div style={notesLabelStyle}>Freight Contact</div>
            <div style={notesValueStyle}>
              <div>{safeOrder.freightContact.company || "-"}</div>
              <div>{safeOrder.freightContact.name || "-"}</div>
              <div>
                {safeOrder.freightContact.phoneCode || ""} {safeOrder.freightContact.phone || "-"}
              </div>
              <div>{safeOrder.freightContact.email || "-"}</div>
              <div>{safeOrder.freightContact.country || "-"}</div>
            </div>
          </div>
        )}

        {safeOrder.companyProfile && (
          <div style={notesPanelStyle}>
            <div style={notesLabelStyle}>Company Profile</div>
            <div style={notesValueStyle}>
              <div>
                {safeOrder.companyProfile.tradeName ||
                  safeOrder.companyProfile.legalName ||
                  "-"}
              </div>
              <div>{safeOrder.companyProfile.address || "-"}</div>
              <div>
                {safeOrder.companyProfile.city || "-"} - {safeOrder.companyProfile.state || "-"}
              </div>
              <div>{safeOrder.companyProfile.country || "-"}</div>
              <div>{safeOrder.companyProfile.email || "-"}</div>
              <div>{safeOrder.companyProfile.phone || "-"}</div>
            </div>
          </div>
        )}

      {safeOrder.freightContact && (
        <div style={notesPanelStyle}>
          <div style={notesLabelStyle}>Freight Contact</div>
          <div style={notesValueStyle}>
            <div>{safeOrder.freightContact.company || "-"}</div>
            <div>{safeOrder.freightContact.name || "-"}</div>
            <div>
              {safeOrder.freightContact.phoneCode || ""} {safeOrder.freightContact.phone || "-"}
            </div>
            <div>{safeOrder.freightContact.email || "-"}</div>
            <div>{safeOrder.freightContact.country || "-"}</div>
          </div>
        </div>
      )}

      {safeOrder.companyProfile && (
        <div style={notesPanelStyle}>
          <div style={notesLabelStyle}>Company Profile</div>
          <div style={notesValueStyle}>
            <div>
              {safeOrder.companyProfile.tradeName ||
                safeOrder.companyProfile.legalName ||
                "-"}
            </div>
            <div>{safeOrder.companyProfile.address || "-"}</div>
            <div>
              {safeOrder.companyProfile.city || "-"} - {safeOrder.companyProfile.state || "-"}
            </div>
            <div>{safeOrder.companyProfile.country || "-"}</div>
            <div>{safeOrder.companyProfile.email || "-"}</div>
            <div>{safeOrder.companyProfile.phone || "-"}</div>
          </div>
        </div>
      )}

      <div style={notesPanelStyle}>
        <div style={notesLabelStyle}>Customer Notes</div>
        <div style={notesValueStyle}>{safeOrder.customer?.notes || "-"}</div>
      </div>

      <div style={tableWrapStyle}>
        <div style={tableTitleRowStyle}>
          <h2 style={sectionTitleStyle}>Order Items</h2>
          <p style={sectionSubtitleStyle}>
            Compact operational view for fast grower review.
          </p>
        </div>

        <div style={tableHeaderStyle}>
          <div>Product</div>
          <div>Variety</div>
          <div>Color</div>
          <div>Length</div>
          <div>Box</div>
          <div>Boxes</div>
          <div>Stems/Box</div>
          <div>Total</div>
          <div>Price</div>
          <div>Line Total</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        <div style={rowsWrapStyle}>
          {safeOrder.items.map((item, index) => {
            const lineTotal = getLineTotal(item);
            const currentStatus = item.itemStatus || "pending_review";
            const isAlternativeOpen =
              openAlternativeRows[index] ||
              currentStatus === "alternative_offered" ||
              !!item.alternativeOffer;

            const draft = alternativeDrafts[index] || {
              category: item.alternativeOffer?.category || "",
              productSlug: item.alternativeOffer?.productSlug || "",
              length: item.alternativeOffer?.length || "",
              price:
                item.alternativeOffer?.price != null
                  ? String(item.alternativeOffer.price)
                  : "",
              note: item.alternativeOffer?.note || "",
            };

            const categoryProducts = getProductsByCategory(draft.category);
            const selectedProduct = getProductBySlug(draft.productSlug);
            const selectedLengths = normalizeLengths(selectedProduct);

            return (
              <div key={`${item.slug}-${index}`} style={rowBlockStyle}>
                <div style={dataRowStyle}>
<div style={productCellWrapStyle}>
  {item.image ? (
    <img
      src={item.image}
      alt={item.name}
      style={productThumbStyle}
    />
  ) : (
    <div style={productThumbPlaceholderStyle}>-</div>
  )}

  <div>
    <div style={cellStrongStyle}>{item.name}</div>

    <div style={productMetaStyle}>
      {item.boxType || "-"} • {item.selectedLength || "-"}
    </div>
  </div>
</div>
                  <div style={cellStyle}>{item.selectedVariety || "-"}</div>
                  <div style={cellStyle}>{item.selectedColor || "-"}</div>
                  <div style={cellStyle}>{item.selectedLength || "-"}</div>
                  <div style={cellStyle}>{item.boxType || "-"}</div>
                  <div style={cellStyle}>{item.boxes}</div>
                  <div style={cellStyle}>{item.stemsPerBox}</div>
                  <div style={cellStyle}>{item.totalStems}</div>
                  <div style={cellStyle}>{formatMoney(getNumericPrice(item.price))}</div>
                  <div style={cellStyle}>{formatMoney(lineTotal)}</div>
                  <div style={cellStatusStyle}>
                    <span style={badgeStyle(currentStatus)}>
                      {formatStatus(currentStatus)}
                    </span>
                  </div>
                  <div style={cellActionsStyle}>
                    <button
                      style={miniApproveButtonStyle}
                      onClick={() => updateItemStatus(index, "approved")}
                    >
                      Approve
                    </button>

                    <button
                      style={miniDangerButtonStyle}
                      onClick={() => updateItemStatus(index, "rejected")}
                    >
                      Reject
                    </button>

                    <button
                      style={miniSecondaryButtonStyle}
                      onClick={() => {
                        updateItemStatus(index, "alternative_offered");
                        openAlternativeForItem(index, item);
                      }}
                    >
                      Alternative
                    </button>
                  </div>
                </div>

                {item.requestedChange && (
                  <div style={requestedChangeStripStyle}>
                    <div style={{ fontWeight: 800 }}>Customer requested change</div>

                    <div style={{ display: "grid", gap: "4px" }}>
                      <div>Boxes: {item.requestedChange.boxes || item.boxes}</div>
                      <div>Preferred Length: {item.requestedChange.length || "-"}</div>
                      {item.requestedChange.note ? (
                        <div>Note: {item.requestedChange.note}</div>
                      ) : null}
                    </div>
                  </div>
                )}

                {item.alternativeOffer && !isAlternativeOpen ? (
                  <div style={savedOfferStripStyle}>
                    <div style={{ fontWeight: 800 }}>Saved Alternative</div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span>{item.alternativeOffer.category || "-"}</span>
                      <span>/</span>
                      <span>{item.alternativeOffer.productName || "-"}</span>
                      <span>/</span>
                      <span>{item.alternativeOffer.length || "-"}</span>
                      <span>/</span>
                      <span>{formatMoney(Number(item.alternativeOffer.price || 0))}</span>
                    </div>

                    <button
                      style={miniLinkButtonStyle}
                      onClick={() => openAlternativeForItem(index, item)}
                    >
                      Edit
                    </button>
                  </div>
                ) : null}

                {isAlternativeOpen ? (
                  <div style={alternativePanelStyle}>
                    <div style={alternativePanelHeaderStyle}>
                      <div style={alternativePanelTitleStyle}>Alternative Offer</div>

                      <button
                        style={miniLinkButtonStyle}
                        onClick={() =>
                          setOpenAlternativeRows((prev) => ({
                            ...prev,
                            [index]: false,
                          }))
                        }
                      >
                        Hide
                      </button>
                    </div>

                    <div style={alternativeCompactGridStyle}>
                      <div style={fieldBlockStyle}>
                        <label style={labelStyle}>Category</label>
                        <select
                          value={draft.category}
                          onChange={(e) =>
                            updateAlternativeDraft(index, "category", e.target.value)
                          }
                          style={inputStyle}
                        >
                          <option value="">Select category</option>
                          {catalogCategories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={fieldBlockStyle}>
                        <label style={labelStyle}>Product</label>
                        <select
                          value={draft.productSlug}
                          onChange={(e) =>
                            updateAlternativeDraft(index, "productSlug", e.target.value)
                          }
                          style={inputStyle}
                          disabled={!draft.category}
                        >
                          <option value="">Select product</option>
                          {categoryProducts.map((product) => (
                            <option key={product.slug} value={product.slug}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={fieldBlockStyle}>
                        <label style={labelStyle}>Length</label>
                        <select
                          value={draft.length}
                          onChange={(e) =>
                            updateAlternativeDraft(index, "length", e.target.value)
                          }
                          style={inputStyle}
                          disabled={!draft.productSlug}
                        >
                          <option value="">Select length</option>
                          {selectedLengths.map((entry) => (
                            <option key={entry.length} value={entry.length}>
                              {entry.length}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={fieldBlockStyle}>
                        <label style={labelStyle}>Price / Stem</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={draft.price}
                          onChange={(e) =>
                            updateAlternativeDraft(index, "price", e.target.value)
                          }
                          style={inputStyle}
                        />
                      </div>

                      <div style={{ ...fieldBlockStyle, gridColumn: "1 / -1" }}>
                        <label style={labelStyle}>Note</label>
                        <textarea
                          value={draft.note}
                          onChange={(e) =>
                            updateAlternativeDraft(index, "note", e.target.value)
                          }
                          placeholder="Reason for alternative offer"
                          style={textareaCompactStyle}
                        />
                      </div>
                    </div>

                    <div style={alternativeActionsStyle}>
                      <button
                        style={primaryButtonStyle}
                        onClick={() => saveAlternative(index)}
                      >
                        Save Alternative Offer
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const pageStyle: CSSProperties = {
  maxWidth: "1440px",
  margin: "0 auto",
  padding: "28px 20px 60px",
  display: "grid",
  gap: "14px",
};

const topBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const topActionsStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
  flexWrap: "wrap",
};

const headerCompactStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "10px",
  alignItems: "stretch",
};

const compactInfoBoxStyle: CSSProperties = {
  border: "1px solid #ececec",
  borderRadius: "12px",
  background: "#fff",
  padding: "12px 14px",
};

const compactLabelStyle: CSSProperties = {
  fontSize: "11px",
  color: "#7a7a7a",
  marginBottom: "4px",
};

const compactValueStyle: CSSProperties = {
  fontSize: "15px",
  fontWeight: 800,
  color: "#222",
  lineHeight: 1.4,
};

const detailsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "12px",
};

const notesPanelStyle: CSSProperties = {
  border: "1px solid #ececec",
  borderRadius: "12px",
  background: "#fff",
  padding: "12px 14px",
};

const notesLabelStyle: CSSProperties = {
  fontSize: "11px",
  color: "#7a7a7a",
  marginBottom: "6px",
};

const notesValueStyle: CSSProperties = {
  fontSize: "14px",
  color: "#222",
  lineHeight: 1.7,
};

const tableWrapStyle: CSSProperties = {
  border: "1px solid #ececec",
  borderRadius: "16px",
  background: "#fff",
  padding: "14px",
  display: "grid",
  gap: "10px",
};

const tableTitleRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "end",
  gap: "10px",
  flexWrap: "wrap",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "22px",
  color: "#1f1f1f",
};

const sectionSubtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "13px",
  color: "#6d6d6d",
};

const tableHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "1.3fr .9fr .8fr .8fr .9fr .6fr .8fr .7fr .8fr .9fr 1fr 1.8fr",
  gap: "8px",
  padding: "10px 12px",
  borderRadius: "10px",
  background: "#f7f7f7",
  border: "1px solid #ececec",
  fontSize: "12px",
  fontWeight: 800,
  color: "#555",
};

const rowsWrapStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
};

const rowBlockStyle: CSSProperties = {
  border: "1px solid #ececec",
  borderRadius: "12px",
  overflow: "hidden",
  background: "#fff",
};

const dataRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "1.3fr .9fr .8fr .8fr .9fr .6fr .8fr .7fr .8fr .9fr 1fr 1.8fr",
  gap: "8px",
  padding: "10px 12px",
  alignItems: "center",
};

const productCellWrapStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
};

const productThumbStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "8px",
  objectFit: "cover",
  flexShrink: 0,
  border: "1px solid #ececec",
  background: "#f5f5f5",
};

const productThumbPlaceholderStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "8px",
  flexShrink: 0,
  border: "1px solid #ececec",
  background: "#f7f7f7",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#999",
  fontSize: "12px",
};

const productMetaStyle: CSSProperties = {
  fontSize: "11px",
  color: "#777",
  marginTop: "4px",
  lineHeight: 1.4,
};

const cellStyle: CSSProperties = {
  fontSize: "13px",
  color: "#222",
  lineHeight: 1.4,
  wordBreak: "break-word",
};

const cellStrongStyle: CSSProperties = {
  fontSize: "13px",
  color: "#111",
  fontWeight: 800,
  lineHeight: 1.4,
  wordBreak: "break-word",
};

const cellStatusStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const cellActionsStyle: CSSProperties = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap",
  justifyContent: "flex-start",
  alignItems: "center",
};

const requestedChangeStripStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: "8px 14px",
  alignItems: "start",
  padding: "12px 14px",
  borderTop: "1px solid #dbeafe",
  background: "#eff6ff",
  fontSize: "12px",
  color: "#1e40af",
};

const savedOfferStripStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "wrap",
  padding: "10px 12px",
  borderTop: "1px solid #f0f0f0",
  background: "#fafcff",
  fontSize: "12px",
  color: "#304a82",
};

const alternativePanelStyle: CSSProperties = {
  borderTop: "1px solid #e5d4ff",
  background: "#faf7ff",
  padding: "14px",
  display: "grid",
  gap: "12px",
};

const alternativePanelHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
};

const alternativePanelTitleStyle: CSSProperties = {
  fontSize: "14px",
  fontWeight: 800,
  color: "#6d28d9",
};

const alternativeCompactGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "10px",
};

const fieldBlockStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
};

const labelStyle: CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#444",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "9px",
  border: "1px solid #d9d9d9",
  background: "#fff",
  outline: "none",
  fontSize: "13px",
};

const textareaCompactStyle: CSSProperties = {
  width: "100%",
  minHeight: "70px",
  padding: "10px 12px",
  borderRadius: "9px",
  border: "1px solid #d9d9d9",
  background: "#fff",
  outline: "none",
  resize: "vertical",
  fontSize: "13px",
};

const alternativeActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  flexWrap: "wrap",
};

const primaryButtonStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  background: "#7dbb2f",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "13px",
};

const approveButtonStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  background: "#7dbb2f",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "13px",
};

const dangerButtonStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  background: "#c53b3b",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "13px",
};

const secondaryButtonStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #dfdfdf",
  background: "#fff",
  color: "#222",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "13px",
};

const miniApproveButtonStyle: CSSProperties = {
  padding: "7px 10px",
  borderRadius: "8px",
  border: "none",
  background: "#7dbb2f",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "11px",
};

const miniDangerButtonStyle: CSSProperties = {
  padding: "7px 10px",
  borderRadius: "8px",
  border: "none",
  background: "#c53b3b",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "11px",
};

const miniSecondaryButtonStyle: CSSProperties = {
  padding: "7px 10px",
  borderRadius: "8px",
  border: "1px solid #d9ccff",
  background: "#f6f0ff",
  color: "#6d28d9",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "11px",
};

const miniLinkButtonStyle: CSSProperties = {
  padding: 0,
  border: "none",
  background: "transparent",
  color: "#3059b8",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "12px",
};

const emptyStateStyle: CSSProperties = {
  padding: "30px",
  border: "1px dashed #dddddd",
  borderRadius: "14px",
  color: "#777",
  textAlign: "center",
  background: "#fafafa",
};

function badgeStyle(status: string): CSSProperties {
  const normalized = String(status || "pending_review");
  const isApproved = normalized === "approved" || normalized === "alternative_accepted";
  const isRejected = normalized === "rejected" || normalized === "alternative_rejected";
  const isAlternative = normalized === "alternative_offered";
  const isPartial = normalized === "partially_reviewed";
  const isCustomerChange = normalized === "customer_requested_change";

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 800,
    whiteSpace: "nowrap",
    background: isApproved
      ? "#e8f7da"
      : isRejected
      ? "#fdeaea"
      : isAlternative
      ? "#eaf1ff"
      : isCustomerChange
      ? "#eff6ff"
      : isPartial
      ? "#f7f2d9"
      : "#fff4d8",
    color: isApproved
      ? "#39710b"
      : isRejected
      ? "#a33333"
      : isAlternative
      ? "#3059b8"
      : isCustomerChange
      ? "#1e40af"
      : isPartial
      ? "#816400"
      : "#8a6700",
  };
}
