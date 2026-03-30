import { useMemo, useState } from "react";
import { useCart } from "../context/CartContext";
import type { BoxType } from "../data/boxTypes";

type ProductItem = {
  name: string;
  color: string;
};

type ProductGroup = {
  id: string;
  slug: string;
  name: string;
  image?: string;
  description?: string;
  category: string;
  grower: string;
  boxType: BoxType;
  stemsPerBox: number;
  lengths: { length: string; price: number }[];
  items: ProductItem[];
};

export default function VarietyCard({
  item,
  group,
}: {
  item: ProductItem;
  group: ProductGroup;
}) {
  const { cart, addToCart } = useCart();

  const availableLengths = useMemo(() => {
    return group.lengths.filter((l) => l.price > 0);
  }, [group.lengths]);

  const [selectedLength, setSelectedLength] = useState(
    availableLengths[0]?.length || ""
  );

  const [boxes, setBoxes] = useState(1);

  const selectedLengthData = availableLengths.find(
    (l) => l.length === selectedLength
  );

  const totalStems = useMemo(() => {
    return boxes * group.stemsPerBox;
  }, [boxes, group.stemsPerBox]);

  const existingItem = cart.find(
    (cartItem) =>
      cartItem.slug === group.slug &&
      cartItem.grower === group.grower &&
      (cartItem.selectedVariety || "") === item.name &&
      (cartItem.selectedLength || "") === selectedLength &&
      cartItem.boxType === group.boxType
  );

  function handleAdd() {
    if (!selectedLength) {
      alert("Please select a length.");
      return;
    }

    if (boxes < 1) {
      alert("Boxes must be at least 1");
      return;
    }

    addToCart({
      slug: group.slug,
      name: item.name,
      price: Number(selectedLengthData?.price || 0),
      image: group.image || "",
      grower: group.grower,

      // 👇 الجديد
      boxType: group.boxType,
      stemsPerBox: group.stemsPerBox,
      boxes,
      totalStems,

      // 👇 القديم المهم
      selectedVariety: item.name,
      selectedColor: item.color || "",
      selectedLength,
    });
  }

  return (
    <div
      style={{
        border: "1px solid #e6e6e6",
        borderRadius: "12px",
        padding: "12px",
        background: "#fafafa",
      }}
    >
      {/* Color */}
      <div
        style={{
          fontSize: "13px",
          color: "#666",
          marginBottom: "10px",
        }}
      >
        Color: <strong>{item.color || "-"}</strong>
      </div>

      {/* Length */}
      <div style={{ marginBottom: "10px" }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "#1f3c88",
            marginBottom: "6px",
          }}
        >
          Length
        </div>

        <select
          value={selectedLength}
          onChange={(e) => setSelectedLength(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "10px",
            border: "1px solid #d5d5d5",
            outline: "none",
            background: "#fff",
          }}
        >
          {availableLengths.map((l) => (
            <option key={l.length} value={l.length}>
              {l.length}
            </option>
          ))}
        </select>
      </div>

      {/* Meta Info */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            padding: "10px",
            borderRadius: "10px",
            background: "#f7f9ff",
            border: "1px solid #e5ebff",
          }}
        >
          <div style={metaLabelStyle}>Price / Stem</div>
          <div style={metaValueStyle}>${selectedLengthData?.price ?? 0}</div>
        </div>

        <div
          style={{
            padding: "10px",
            borderRadius: "10px",
            background: "#f7f9ff",
            border: "1px solid #e5ebff",
          }}
        >
          <div style={metaLabelStyle}>Box Type</div>
          <div style={metaValueStyle}>{group.boxType}</div>
        </div>

        <div
          style={{
            padding: "10px",
            borderRadius: "10px",
            background: "#f7f9ff",
            border: "1px solid #e5ebff",
          }}
        >
          <div style={metaLabelStyle}>Stems / Box</div>
          <div style={metaValueStyle}>{group.stemsPerBox}</div>
        </div>

        <div
          style={{
            padding: "10px",
            borderRadius: "10px",
            background: "#f7f9ff",
            border: "1px solid #e5ebff",
          }}
        >
          <div style={metaLabelStyle}>Total Stems</div>
          <div style={metaValueStyle}>{totalStems}</div>
        </div>
      </div>

      {/* Boxes Input */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: 600 }}>Boxes:</span>

        <input
          type="number"
          value={boxes}
          min={1}
          onChange={(e) =>
            setBoxes(Math.max(1, Number(e.target.value) || 1))
          }
          style={{
            width: "90px",
            padding: "8px 10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            outline: "none",
          }}
        />
      </div>

      {/* Button */}
      <button
        onClick={handleAdd}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          border: "none",
          background: existingItem ? "#1f3c88" : "#7dbb2f",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {existingItem ? "Update Cart" : "Add to Cart"}
      </button>
    </div>
  );
}

const metaLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#666",
  marginBottom: "4px",
};

const metaValueStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#222",
};