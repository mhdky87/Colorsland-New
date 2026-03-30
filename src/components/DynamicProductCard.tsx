import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "../context/CartContext";

type DynamicProductLength = {
  length?: string;
  price?: number | string;
};

type DynamicProduct = {
  id: string;
  slug: string;
  name: string;
  image?: string;
  description?: string;
  category: string;
  grower: string;
  price?: number;
  boxType?: "Jumbo Box" | "Big Box" | "Zim Box" | "Standard Box";
  stemsPerBox?: number;
  packing?: string;
  isActive?: boolean;
  color?: string;
  baseCategoryName?: string;
  lengths?: DynamicProductLength[];
};

function formatCategoryLabel(value: string) {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getNumericPrice(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/\$/g, "").trim();
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function isLengthAvailable(entry: any) {
  if (!entry) return false;
  if (entry.price === "غير متوفر") return false;
  if (entry.price === "" || entry.price === null || entry.price === undefined) {
    return false;
  }
  return getNumericPrice(entry.price) > 0;
}

export default function DynamicProductCard({
  product,
}: {
  product: DynamicProduct;
}) {
  const productLink = `/product/${product.slug}`;
  const { addToCart } = useCart();

  const [boxes, setBoxes] = useState(1);
  const [selectedLength, setSelectedLength] = useState<DynamicProductLength | null>(null);

  useEffect(() => {
    if (Array.isArray(product.lengths) && product.lengths.length > 0) {
      const firstAvailable =
        product.lengths.find((entry) => isLengthAvailable(entry)) ||
        product.lengths[0] ||
        null;

      setSelectedLength(firstAvailable);
    } else {
      setSelectedLength(null);
    }
  }, [product]);

  const pricePerStem = useMemo(() => {
    if (selectedLength) {
      const selectedPrice = getNumericPrice(selectedLength.price);
      if (selectedPrice > 0) return selectedPrice;
    }

    return typeof product.price === "number" && product.price > 0 ? product.price : 0;
  }, [product.price, selectedLength]);

  const stemsPerBox = Number(product.stemsPerBox || 0);

  const boxPrice = useMemo(() => {
    return pricePerStem * stemsPerBox;
  }, [pricePerStem, stemsPerBox]);

  const totalStems = useMemo(() => {
    return stemsPerBox * boxes;
  }, [stemsPerBox, boxes]);

  const total = useMemo(() => {
    return boxPrice * boxes;
  }, [boxPrice, boxes]);

  const handleAdd = () => {
    addToCart({
      slug: product.slug,
      name: product.name,
      price: pricePerStem,
      boxes,
      stemsPerBox,
      totalStems,
      grower: product.grower,
      image: product.image || "",
      boxType: product.boxType || "Standard Box",
      selectedLength: selectedLength?.length || "",
    });
  };

  return (
    <div
      style={{
        border: "1px solid #ececec",
        borderRadius: "14px",
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          height: "220px",
          background: "#f5f5f5",
        }}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#888",
              fontWeight: 700,
            }}
          >
            No Image
          </div>
        )}
      </div>

      <div style={{ padding: "18px" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: "22px", color: "#222" }}>
          {product.name}
        </h3>

        <p style={{ margin: "0 0 14px", fontSize: "14px", color: "#666" }}>
          {product.description || "No description available."}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "14px",
          }}
        >
          <div style={metaBoxStyle}>
            <div style={metaLabelStyle}>Category</div>
            <div style={metaValueStyle}>
              {formatCategoryLabel(
                product.category || product.baseCategoryName || ""
              )}
            </div>
          </div>

          <div style={metaBoxStyle}>
            <div style={metaLabelStyle}>Color</div>
            <div style={metaValueStyle}>{product.color || "-"}</div>
          </div>

          <div style={metaBoxStyle}>
            <div style={metaLabelStyle}>Box Type</div>
            <div style={metaValueStyle}>{product.boxType || "-"}</div>
          </div>

          <div style={metaBoxStyle}>
            <div style={metaLabelStyle}>Stems / Box</div>
            <div style={metaValueStyle}>{stemsPerBox}</div>
          </div>

          <div style={metaBoxStyle}>
            <div style={metaLabelStyle}>Price / Stem</div>
            <div style={metaValueStyle}>
              {pricePerStem > 0 ? `$${pricePerStem.toFixed(2)}` : "-"}
            </div>
          </div>

          <div style={metaBoxStyle}>
            <div style={metaLabelStyle}>Price / Box</div>
            <div style={metaValueStyle}>
              {boxPrice > 0 ? `$${boxPrice.toFixed(2)}` : "-"}
            </div>
          </div>
        </div>

        {Array.isArray(product.lengths) && product.lengths.length > 0 && (
          <div
            style={{
              marginBottom: "14px",
              padding: "12px",
              borderRadius: "10px",
              background: "#fafafa",
              border: "1px solid #ededed",
            }}
          >
            <div style={{ fontSize: "13px", marginBottom: "6px", color: "#555" }}>
              Length
            </div>

            <select
              value={selectedLength?.length || ""}
              onChange={(e) => {
                const nextLength =
                  product.lengths?.find((entry) => entry.length === e.target.value) || null;
                setSelectedLength(nextLength);
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                background: "#fff",
              }}
            >
              {product.lengths.map((entry, index) => {
                const lengthPrice = getNumericPrice(entry?.price);
                return (
                  <option key={`${entry.length || "length"}-${index}`} value={entry.length || ""}>
                    {entry.length || "-"} — {lengthPrice > 0 ? `$${lengthPrice.toFixed(2)}` : "غير متوفر"}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <div
          style={{
            marginBottom: "14px",
            padding: "12px",
            borderRadius: "10px",
            background: "#fafafa",
            border: "1px solid #ededed",
          }}
        >
          <div style={{ fontSize: "13px", marginBottom: "6px", color: "#555" }}>
            Number of Boxes
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setBoxes((prev) => Math.max(1, prev - 1))}
              style={counterBtn}
            >
              -
            </button>

            <span style={{ fontWeight: 700, minWidth: "22px", textAlign: "center" }}>
              {boxes}
            </span>

            <button
              onClick={() => setBoxes((prev) => prev + 1)}
              style={counterBtn}
            >
              +
            </button>
          </div>

          <div style={{ marginTop: "10px", fontSize: "13px", color: "#666" }}>
            Total Stems: <strong>{totalStems}</strong>
          </div>

          <div style={{ marginTop: "6px", fontSize: "13px", color: "#666" }}>
            Line Total: <strong>${total.toFixed(2)}</strong>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button style={primaryBtnStyle} onClick={handleAdd}>
            Add {boxes} Box{boxes > 1 ? "es" : ""} to Cart
          </button>

          <Link to={productLink}>
            <button style={secondaryBtnStyle}>View Product</button>
          </Link>

          <Link to={`/growers/${product.grower}`}>
            <button style={secondaryBtnStyle}>View Grower</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const metaBoxStyle: React.CSSProperties = {
  border: "1px solid #ededed",
  borderRadius: "10px",
  padding: "10px",
  background: "#fafafa",
};

const metaLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#777",
  marginBottom: "4px",
};

const metaValueStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#222",
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#7dbb2f",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  background: "#fff",
  color: "#222",
  fontWeight: 700,
  cursor: "pointer",
};

const counterBtn: React.CSSProperties = {
  width: "32px",
  height: "32px",
  borderRadius: "6px",
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
};
