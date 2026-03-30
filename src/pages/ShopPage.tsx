import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DynamicProductCard from "../components/DynamicProductCard";
import { useCart } from "../context/CartContext";
import { growers } from "../data/growers";
import { getMergedGrowerCatalog } from "../data/catalogHelpers";

type ViewMode = "grid" | "table";

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function getNumericPrice(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getProductLengthOptions(product: any) {
  return Array.isArray(product?.lengths) ? product.lengths : [];
}

function getSelectedLengthPrice(product: any, selectedLength: string) {
  const options = getProductLengthOptions(product);
  if (!selectedLength) return getNumericPrice(product?.price);

  const match = options.find((item: any) => String(item?.length || "") === selectedLength);
  if (!match) return getNumericPrice(product?.price);

  return getNumericPrice(match?.price);
}

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();

  const initialGrowerFromQuery = searchParams.get("grower") || "";

  const [selectedGrower, setSelectedGrower] = useState(
    initialGrowerFromQuery || growers[0]?.slug || ""
  );
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [deliveryDate, setDeliveryDate] = useState(
    localStorage.getItem("deliveryDate") || ""
  );
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLengths, setSelectedLengths] = useState<Record<string, string>>({});
  const [boxesByProduct, setBoxesByProduct] = useState<Record<string, number>>({});
  const [addedNotice, setAddedNotice] = useState("");

  useEffect(() => {
    if (deliveryDate) {
      localStorage.setItem("deliveryDate", deliveryDate);
    } else {
      localStorage.removeItem("deliveryDate");
    }
  }, [deliveryDate]);

  useEffect(() => {
    const growerFromQuery = searchParams.get("grower");
    if (growerFromQuery && growers.some((g) => g.slug === growerFromQuery)) {
      setSelectedGrower(growerFromQuery);
      setSelectedCategory("");
    }
  }, [searchParams]);

  const currentGrower = useMemo(() => {
    return growers.find((g) => g.slug === selectedGrower) || growers[0];
  }, [selectedGrower]);

  const catalog = useMemo(() => {
    return getMergedGrowerCatalog(selectedGrower);
  }, [selectedGrower]);

  const filteredProducts = useMemo(() => {
    return catalog.products.filter((product: any) => {
      if (product.isActive === false) return false;
      if (!selectedCategory) return true;
      return String(product.category).toLowerCase() === selectedCategory.toLowerCase();
    });
  }, [catalog, selectedCategory]);

  useEffect(() => {
    setSelectedLengths((prev) => {
      const next = { ...prev };
      filteredProducts.forEach((product: any) => {
        const id = String(product.id);
        if (next[id] !== undefined) return;

        const options = getProductLengthOptions(product);
        next[id] = options.length > 0 ? String(options[0]?.length || "") : "";
      });
      return next;
    });

    setBoxesByProduct((prev) => {
      const next = { ...prev };
      filteredProducts.forEach((product: any) => {
        const id = String(product.id);
        if (next[id] === undefined) next[id] = 1;
      });
      return next;
    });
  }, [filteredProducts]);


function showAddedNotice(message: string) {
  setAddedNotice(message);

  setTimeout(() => {
    setAddedNotice("");
  }, 1500);
}

  const handleGrowerChange = (growerSlug: string) => {
    setSelectedGrower(growerSlug);
    setSelectedCategory("");
  };

const handleAddFromDetails = (product: any) => {
  const productId = String(product.id);
  const stemsPerBox = getNumericPrice(product.stemsPerBox);
  const boxes = Math.max(1, getNumericPrice(boxesByProduct[productId] || 1));
  const selectedLength = selectedLengths[productId] || "";
  const pricePerStem = getSelectedLengthPrice(product, selectedLength);

  addToCart({
    slug: product.slug,
    name: product.name,
    price: pricePerStem,
    image: product.image || "",
    boxes,
    grower: product.grower,
    boxType: product.boxType || "Standard Box",
    stemsPerBox,
    totalStems: stemsPerBox * boxes,
    selectedLength: selectedLength || undefined,
  });

  // 🔥 تصفير البوكس
  setBoxesByProduct((prev) => ({
    ...prev,
    [productId]: 1,
  }));

  // 🔥 إشعار
  showAddedNotice(
    `${product.name}${selectedLength ? ` (${selectedLength})` : ""} added to cart`
  );
};

  return (
    <div style={{ background: "#f7f7f7", minHeight: "100vh" }}>
      <section style={{ padding: "24px 24px 10px" }}>
        <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              gap: "14px",
              overflowX: "auto",
              paddingBottom: "8px",
            }}
          >
            {growers.map((grower) => {
              const active = grower.slug === selectedGrower;

              return (
                <button
                  key={grower.slug}
                  onClick={() => handleGrowerChange(grower.slug)}
                  style={{
                    minWidth: "210px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "14px",
                    border: active ? "2px solid #1f3c88" : "1px solid #d9d9d9",
                    background: active ? "#eef3ff" : "#fff",
                    cursor: "pointer",
                    boxShadow: active
                      ? "0 8px 20px rgba(31,60,136,0.12)"
                      : "0 4px 12px rgba(0,0,0,0.05)",
                    textAlign: "left",
                  }}
                >
                  <img
                    src={grower.image}
                    alt={grower.name}
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />

                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#222",
                        fontSize: "15px",
                        lineHeight: 1.2,
                      }}
                    >
                      {grower.name}
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginTop: "4px",
                        lineHeight: 1.4,
                      }}
                    >
                      {active ? "Selected grower" : "Click to browse products"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section style={{ padding: "0 24px" }}>
        <div
          style={{
            maxWidth: "1320px",
            margin: "0 auto",
            background: "#1f3c88",
            color: "#fff",
            borderRadius: "12px 12px 0 0",
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontWeight: 700 }}>Delivery Date:</span>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "none",
                outline: "none",
                minWidth: "180px",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontWeight: 700 }}>View:</span>

            <button
              onClick={() => setViewMode("grid")}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.35)",
                background: viewMode === "grid" ? "#fff" : "transparent",
                color: viewMode === "grid" ? "#1f3c88" : "#fff",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              With Images
            </button>

            <button
              onClick={() => setViewMode("table")}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.35)",
                background: viewMode === "table" ? "#fff" : "transparent",
                color: viewMode === "table" ? "#1f3c88" : "#fff",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Details
            </button>
          </div>
        </div>
      </section>

<section style={{ padding: "0 24px 50px" }}>
  <div
    style={{
      maxWidth: "1320px",
      margin: "0 auto",
      width: "100%",
      display: "grid",
      gridTemplateColumns: "220px minmax(0, 1fr)",
      background: "#fff",
      border: "1px solid #e8e8e8",
      borderTop: "none",
      minHeight: "650px",
      boxSizing: "border-box",
    }}
  >
          <aside
            style={{
              borderRight: "1px solid #ececec",
              padding: "18px",
              background: "#fafafa",
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: "14px",
                color: "#1f3c88",
                marginBottom: "14px",
                textTransform: "uppercase",
              }}
            >
              Categories
            </div>

            {catalog.categories.length === 0 ? (
              <div style={{ color: "#777", fontSize: "14px" }}>
                No categories yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {catalog.categories.map((category: string) => {
                  const active = category === selectedCategory;

                  return (
                    <button
                      key={category}
                      onClick={() => {
                        if (selectedCategory === category) {
                          setSelectedCategory("");
                        } else {
                          setSelectedCategory(category);
                        }
                      }}
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: active ? "1px solid #1f3c88" : "1px solid #e3e3e3",
                        background: active ? "#eef3ff" : "#fff",
                        color: active ? "#1f3c88" : "#333",
                        cursor: "pointer",
                        fontWeight: active ? 700 : 500,
                        lineHeight: 1.4,
                      }}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <main
  style={{
    padding: "18px",
    minWidth: 0,
    overflow: "hidden",
  }}
>

  {addedNotice && (
  <div
    style={{
      marginBottom: "14px",
      padding: "12px 14px",
      borderRadius: "10px",
      background: "#ecf8df",
      border: "1px solid #cfe8a8",
      color: "#2f5f0b",
      fontWeight: 700,
      fontSize: "14px",
    }}
  >
    ✅ {addedNotice}
  </div>
)}

  
            <div style={{ marginBottom: "18px" }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: "30px",
                  color: "#222",
                }}
              >
                {currentGrower?.name || "Grower Products"}
              </h1>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#666",
                  lineHeight: 1.7,
                  maxWidth: "850px",
                }}
              >
                {currentGrower?.description}
              </p>
            </div>

            <div style={{ marginBottom: "18px" }}>
              <h2 style={{ margin: 0, fontSize: "24px", color: "#1f3c88" }}>
                {selectedCategory || "All Products"}
              </h2>
              <p style={{ margin: "8px 0 0", color: "#666" }}>
                {filteredProducts.length} active product
                {filteredProducts.length === 1 ? "" : "s"}
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div
                style={{
                  padding: "30px",
                  border: "1px dashed #ccc",
                  borderRadius: "12px",
                  color: "#666",
                  background: "#fafafa",
                }}
              >
                No active products found in this selection.
              </div>
            ) : viewMode === "grid" ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "20px",
                }}
              >
                {filteredProducts.map((product: any) => (
                  <DynamicProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
<div
  style={{
    width: "100%",
    border: "1px solid #e8e8e8",
    borderRadius: "12px",
    overflow: "hidden",
  }}
>
<table
  style={{
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
  }}
>
<thead>
  <tr style={{ background: "#f5f7fb" }}>
    <th style={{ ...thStyle, width: "24%" }}>Product</th>
    <th style={{ ...thStyle, width: "14%" }}>Category</th>
    <th style={{ ...thStyle, width: "14%" }}>Specs</th>
    <th style={{ ...thStyle, width: "12%" }}>Length</th>
    <th style={{ ...thStyle, width: "14%" }}>Price</th>
    <th style={{ ...thStyle, width: "10%" }}>Boxes</th>
    <th style={{ ...thStyle, width: "12%" }}>Total</th>
    <th style={{ ...thStyle, width: "14%" }}>Action</th>
  </tr>
</thead>

                  <tbody>
                    {filteredProducts.map((product: any) => {
                      const productId = String(product.id);
                      const selectedLength = selectedLengths[productId] || "";
                      const pricePerStem = getSelectedLengthPrice(product, selectedLength);
                      const stemsPerBox = getNumericPrice(product.stemsPerBox);
                      const boxPrice = pricePerStem * stemsPerBox;
                      const boxes = Math.max(1, getNumericPrice(boxesByProduct[productId] || 1));
                      const lineTotal = boxPrice * boxes;
                      const lengthOptions = getProductLengthOptions(product);

                      return (
<tr key={product.id}>
  <td style={tdStyle}>
    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
      {product.image ? (
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: "54px",
            height: "54px",
            objectFit: "cover",
            borderRadius: "10px",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: "54px",
            height: "54px",
            borderRadius: "10px",
            background: "#f1f1f1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#999",
            fontSize: "11px",
            flexShrink: 0,
          }}
        >
          -
        </div>
      )}

      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: "#222", lineHeight: 1.3 }}>
          {product.name}
        </div>

        {product.description ? (
          <div
            style={{
              fontSize: "11px",
              color: "#666",
              marginTop: "4px",
              lineHeight: 1.4,
            }}
          >
            {product.description}
          </div>
        ) : null}
      </div>
    </div>
  </td>

  <td style={tdStyle}>{product.category}</td>

  <td style={tdStyle}>
    <div style={{ fontSize: "12px", lineHeight: 1.5 }}>
      <div><strong>Box:</strong> {product.boxType || "-"}</div>
      <div><strong>Stems:</strong> {stemsPerBox}</div>
    </div>
  </td>

  <td style={tdStyle}>
    {lengthOptions.length > 0 ? (
      <select
        value={selectedLength}
        onChange={(e) =>
          setSelectedLengths((prev) => ({
            ...prev,
            [productId]: e.target.value,
          }))
        }
        style={selectStyle}
      >
        {lengthOptions.map((option: any, index: number) => (
          <option
            key={`${productId}-length-${index}`}
            value={String(option?.length || "")}
          >
            {String(option?.length || "-")}
          </option>
        ))}
      </select>
    ) : (
      "-"
    )}
  </td>

  <td style={tdStyle}>
    <div style={{ fontSize: "12px", lineHeight: 1.5 }}>
      <div><strong>Stem:</strong> {pricePerStem > 0 ? formatMoney(pricePerStem) : "-"}</div>
      <div><strong>Box:</strong> {boxPrice > 0 ? formatMoney(boxPrice) : "-"}</div>
    </div>
  </td>

  <td style={tdStyle}>
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <button
        onClick={() =>
          setBoxesByProduct((prev) => ({
            ...prev,
            [productId]: Math.max(
              1,
              getNumericPrice(prev[productId] || 1) - 1
            ),
          }))
        }
        style={counterBtnStyle}
      >
        -
      </button>

      <input
        type="number"
        min={1}
        value={boxes}
        onChange={(e) =>
          setBoxesByProduct((prev) => ({
            ...prev,
            [productId]: Math.max(1, getNumericPrice(e.target.value || 1)),
          }))
        }
        style={boxesInputStyle}
      />

      <button
        onClick={() =>
          setBoxesByProduct((prev) => ({
            ...prev,
            [productId]: getNumericPrice(prev[productId] || 1) + 1,
          }))
        }
        style={counterBtnStyle}
      >
        +
      </button>
    </div>
  </td>

  <td style={{ ...tdStyle, fontWeight: 700 }}>
    {lineTotal > 0 ? formatMoney(lineTotal) : "-"}
  </td>

  <td style={tdStyle}>
    <button
      onClick={() => handleAddFromDetails(product)}
      style={addBtnStyle}
    >
      Add to Cart
    </button>
  </td>
</tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
      </section>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 10px",
  fontSize: "13px",
  color: "#1f3c88",
  borderBottom: "1px solid #e8e8e8",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 10px",
  borderBottom: "1px solid #efefef",
  verticalAlign: "top",
  color: "#333",
  fontSize: "13px",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  minWidth: "88px",
  padding: "7px 8px",
  borderRadius: "8px",
  border: "1px solid #d7d7d7",
  background: "#fff",
  fontSize: "12px",
};

const boxesInputStyle: React.CSSProperties = {
  width: "42px",
  padding: "7px 4px",
  borderRadius: "8px",
  border: "1px solid #d7d7d7",
  textAlign: "center",
  fontWeight: 700,
  fontSize: "12px",
};

const counterBtnStyle: React.CSSProperties = {
  width: "24px",
  height: "24px",
  borderRadius: "7px",
  border: "1px solid #d7d7d7",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "12px",
  lineHeight: 1,
};

const addBtnStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: "8px",
  border: "none",
  background: "#7dbb2f",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontSize: "12px",
};
