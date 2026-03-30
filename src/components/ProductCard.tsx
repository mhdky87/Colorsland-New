import ProductItemCard from "./VarietyCard";
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

export default function ProductCard({
  group,
  item,
}: {
  group: ProductGroup;
  item: ProductItem;
}) {
  return (
    <div
      style={{
        border: "1px solid #e8e8e8",
        borderRadius: "16px",
        overflow: "hidden",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "190px",
          background: "#f3f3f3",
        }}
      >
        {group.image ? (
          <img
            src={group.image}
            alt={item.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}
      </div>

      <div style={{ padding: "16px" }}>
        <h3
          style={{
            margin: "0 0 6px",
            fontSize: "18px",
            color: "#1e1e1e",
            lineHeight: 1.3,
          }}
        >
          {item.name}
        </h3>

        <p
          style={{
            fontSize: "13px",
            color: "#666",
            margin: "0 0 14px",
            lineHeight: 1.6,
          }}
        >
          {group.name}
        </p>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#777",
              padding: "6px 10px",
              border: "1px solid #e8e8e8",
              borderRadius: "999px",
              background: "#fafafa",
            }}
          >
            Box Type: <strong>{group.boxType}</strong>
          </div>

          <div
            style={{
              fontSize: "13px",
              color: "#777",
              padding: "6px 10px",
              border: "1px solid #e8e8e8",
              borderRadius: "999px",
              background: "#fafafa",
            }}
          >
            Stems / Box: <strong>{group.stemsPerBox}</strong>
          </div>
        </div>

        <ProductItemCard item={item} group={group} />
      </div>
    </div>
  );
}