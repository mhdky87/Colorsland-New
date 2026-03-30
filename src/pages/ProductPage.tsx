import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DynamicProductCard from "../components/DynamicProductCard";
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

export default function ShopPage() {
  const [searchParams] = useSearchParams();

  const initialGrowerFromQuery = searchParams.get("grower") || "";

  const [selectedGrower, setSelectedGrower] = useState(
    initialGrowerFromQuery || growers[0]?.slug || ""
  );
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [deliveryDate, setDeliveryDate] = useState(
    localStorage.getItem("deliveryDate") || ""
  );
  const [selectedCategory, setSelectedCategory] = useState("");

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

  const handleGrowerChange = (growerSlug: string) => {
    setSelectedGrower(growerSlug);
    setSelectedCategory("");
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
            display: "grid",
            gridTemplateColumns: "280px 1fr",
            background: "#fff",
            border: "1px solid #e8e8e8",
            borderTop: "none",
            minHeight: "650px",
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

          <main style={{ padding: "18px" }}>
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
                  overflowX: "auto",
                  border: "1px solid #e8e8e8",
                  borderRadius: "12px",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "1100px",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f5f7fb" }}>
                      <th style={thStyle}>Image</th>
                      <th style={thStyle}>Product</th>
                      <th style={thStyle}>Category</th>
                      <th style={thStyle}>Box Type</th>
                      <th style={thStyle}>Stems / Box</th>
                      <th style={thStyle}>Price / Stem</th>
                      <th style={thStyle}>Price / Box</th>
                      <th style={thStyle}>Lengths & Prices</th>
                      <th style={thStyle}>Grower</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map((product: any) => {
                      const pricePerStem = getNumericPrice(product.price);
                      const stemsPerBox = getNumericPrice(product.stemsPerBox);
                      const boxPrice = pricePerStem * stemsPerBox;

                      return (
                        <tr key={product.id}>
                          <td style={tdStyle}>
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                style={{
                                  width: "62px",
                                  height: "62px",
                                  objectFit: "cover",
                                  borderRadius: "10px",
                                }}
                              />
                            ) : (
                              "-"
                            )}
                          </td>
                          <td style={tdStyle}>{product.name}</td>
                          <td style={tdStyle}>{product.category}</td>
                          <td style={tdStyle}>{product.boxType || "-"}</td>
                          <td style={tdStyle}>{stemsPerBox}</td>
                          <td style={tdStyle}>
                            {pricePerStem > 0 ? formatMoney(pricePerStem) : "-"}
                          </td>
                          <td style={tdStyle}>
                            {boxPrice > 0 ? formatMoney(boxPrice) : "-"}
                          </td>
                          <td style={tdStyle}>
                            {Array.isArray(product.lengths) && product.lengths.length > 0 ? (
                              <div style={{ display: "grid", gap: "4px" }}>
                                {product.lengths.map((l: any, i: number) => {
                                  const lengthPrice = getNumericPrice(l?.price);
                                  return (
                                    <div key={i}>
                                      {l.length || "-"} —{" "}
                                      {lengthPrice > 0 ? formatMoney(lengthPrice) : "غير متوفر"}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td style={tdStyle}>{product.grower}</td>
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
  padding: "14px 16px",
  fontSize: "14px",
  color: "#1f3c88",
  borderBottom: "1px solid #e8e8e8",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderBottom: "1px solid #efefef",
  verticalAlign: "top",
  color: "#333",
};
