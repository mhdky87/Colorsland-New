import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import DynamicProductCard from "../components/DynamicProductCard";
import { growers } from "../data/growers";
import { getAllMergedCatalog, getMergedGrowerCatalog } from "../data/catalogHelpers";

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();

  const growerSlug = searchParams.get("grower") || "";

  const decodedCategory = decodeURIComponent(slug || "");

  const grower = useMemo(() => {
    if (!growerSlug) return null;
    return growers.find((g) => g.slug === growerSlug) || null;
  }, [growerSlug]);

  const categoryProducts = useMemo(() => {
    const sourceCatalog = growerSlug
      ? getMergedGrowerCatalog(growerSlug)
      : getAllMergedCatalog();

    return sourceCatalog.products.filter((product: any) => {
      if (product.isActive === false) return false;
      return String(product.category).toLowerCase() === decodedCategory.toLowerCase();
    });
  }, [growerSlug, decodedCategory]);

  const relatedCategories = useMemo(() => {
    const sourceCatalog = growerSlug
      ? getMergedGrowerCatalog(growerSlug)
      : getAllMergedCatalog();

    return sourceCatalog.categories;
  }, [growerSlug]);

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <section
        style={{
          padding: "70px 24px 36px",
          background: "#f7f7f7",
          borderBottom: "1px solid #ececec",
        }}
      >
        <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: "14px",
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "#7dbb2f",
              fontWeight: 700,
            }}
          >
            Category
          </p>

          <h1
            style={{
              margin: "0 0 12px",
              fontSize: "48px",
              color: "#222",
              lineHeight: 1.1,
            }}
          >
            {decodedCategory}
          </h1>

          <p
            style={{
              margin: 0,
              color: "#666",
              fontSize: "17px",
              lineHeight: 1.8,
              maxWidth: "800px",
            }}
          >
            {grower
              ? `Browsing ${decodedCategory} products from ${grower.name}.`
              : `Browsing ${decodedCategory} products across all growers.`}
          </p>
        </div>
      </section>

      <section style={{ padding: "30px 24px 24px" }}>
        <div
          style={{
            maxWidth: "1320px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            gap: "14px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link
              to={growerSlug ? `/shop?grower=${growerSlug}` : "/shop"}
              style={{
                textDecoration: "none",
                display: "inline-block",
                padding: "10px 16px",
                borderRadius: "10px",
                background: "#1f3c88",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              Back to Shop
            </Link>

            {grower && (
              <Link
                to={`/growers/${grower.slug}`}
                style={{
                  textDecoration: "none",
                  display: "inline-block",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                  background: "#fff",
                  color: "#222",
                  fontWeight: 700,
                }}
              >
                Back to {grower.name}
              </Link>
            )}
          </div>

          <div style={{ color: "#666", fontWeight: 600 }}>
            {categoryProducts.length} product{categoryProducts.length === 1 ? "" : "s"}
          </div>
        </div>
      </section>

      {relatedCategories.length > 0 && (
        <section style={{ padding: "0 24px 20px" }}>
          <div
            style={{
              maxWidth: "1320px",
              margin: "0 auto",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            {relatedCategories.map((category: string) => {
              const active =
                category.toLowerCase() === decodedCategory.toLowerCase();

              return (
                <Link
                  key={category}
                  to={
                    growerSlug
                      ? `/category/${encodeURIComponent(category)}?grower=${growerSlug}`
                      : `/category/${encodeURIComponent(category)}`
                  }
                  style={{
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "9px 14px",
                    borderRadius: "999px",
                    border: active ? "1px solid #1f3c88" : "1px solid #ddd",
                    background: active ? "#eef3ff" : "#fff",
                    color: active ? "#1f3c88" : "#333",
                    fontWeight: active ? 700 : 600,
                    fontSize: "14px",
                  }}
                >
                  {category}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
          {categoryProducts.length === 0 ? (
            <div
              style={{
                border: "1px dashed #d6d6d6",
                borderRadius: "14px",
                background: "#fafafa",
                padding: "34px",
                color: "#666",
              }}
            >
              No active products found in this category.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "22px",
              }}
            >
              {categoryProducts.map((product: any) => (
                <DynamicProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}