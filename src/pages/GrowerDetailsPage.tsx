import { Link, useParams } from "react-router-dom";
import DynamicProductCard from "../components/DynamicProductCard";
import { growers } from "../data/growers";
import { getMergedGrowerCatalog } from "../data/catalogHelpers";

export default function GrowerDetailsPage() {
  const { slug } = useParams();
  const grower = growers.find((g) => g.slug === slug);

  if (!grower || !slug) {
    return (
      <section
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "46px", marginBottom: "12px", color: "#222" }}>
          Grower Not Found
        </h1>

        <p style={{ fontSize: "18px", color: "#666", marginBottom: "24px" }}>
          The requested grower could not be found.
        </p>

        <Link
          to="/growers"
          style={{
            display: "inline-block",
            background: "#7dbb2f",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "4px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Back to Growers
        </Link>
      </section>
    );
  }

  const catalog = getMergedGrowerCatalog(slug);
  const activeProducts = catalog.products.filter(
    (product: any) => product.isActive !== false
  );

  return (
    <>
      <section
        style={{
          padding: "80px 24px",
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
              fontWeight: 600,
            }}
          >
            Grower Profile
          </p>

          <h1
            style={{
              fontSize: "54px",
              margin: "0 0 18px",
              color: "#222",
              lineHeight: 1.1,
            }}
          >
            {grower.name}
          </h1>

          <p
            style={{
              fontSize: "18px",
              color: "#666",
              maxWidth: "760px",
              lineHeight: 1.9,
              margin: 0,
            }}
          >
            {grower.description}
          </p>
        </div>
      </section>

      <section
        style={{
          padding: "80px 24px",
          background: "#fff",
        }}
      >
        <div
          style={{
            maxWidth: "1320px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "40px",
            alignItems: "center",
          }}
        >
          <img
            src={grower.image}
            alt={grower.name}
            style={{
              width: "100%",
              borderRadius: "8px",
              display: "block",
              objectFit: "cover",
            }}
          />

          <div>
            <h2
              style={{
                fontSize: "34px",
                margin: "0 0 16px",
                color: "#222",
              }}
            >
              About {grower.name}
            </h2>

            <p
              style={{
                lineHeight: 1.9,
                color: "#555",
                margin: "0 0 20px",
                fontSize: "16px",
              }}
            >
              {grower.description}
            </p>

            <p
              style={{
                lineHeight: 1.8,
                color: "#666",
                margin: "0 0 24px",
                fontSize: "15px",
              }}
            >
              Orders placed from this grower are reviewed directly by the grower
              based on stock availability. If some items are unavailable, the
              grower may approve available items or suggest alternatives.
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link
                to={`/shop?grower=${grower.slug}`}
                style={{
                  display: "inline-block",
                  background: "#7dbb2f",
                  color: "#fff",
                  padding: "12px 22px",
                  borderRadius: "4px",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                View Grower Products
              </Link>

              <Link
                to="/growers"
                style={{
                  display: "inline-block",
                  background: "#fff",
                  color: "#222",
                  padding: "12px 22px",
                  borderRadius: "4px",
                  textDecoration: "none",
                  fontWeight: 600,
                  border: "1px solid #ddd",
                }}
              >
                Back to Growers
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          padding: "0 24px 90px",
          background: "#fff",
        }}
      >
        <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
              alignItems: "flex-end",
              marginBottom: "24px",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "36px",
                  margin: "0 0 8px",
                  color: "#222",
                }}
              >
                Products by {grower.name}
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#666",
                  lineHeight: 1.7,
                }}
              >
                {catalog.categories.length} categories · {activeProducts.length} active
                products
              </p>
            </div>
          </div>

          {catalog.categories.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "26px",
              }}
            >
              {catalog.categories.map((category: string) => (
                <Link
                  key={category}
                  to={`/category/${encodeURIComponent(category)}?grower=${grower.slug}`}
                  style={{
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "9px 14px",
                    borderRadius: "999px",
                    background: "#f3f6fb",
                    border: "1px solid #dbe3f0",
                    color: "#1f3c88",
                    fontWeight: 700,
                    fontSize: "14px",
                  }}
                >
                  {category}
                </Link>
              ))}
            </div>
          )}

          {activeProducts.length === 0 ? (
            <div
              style={{
                border: "1px solid #ececec",
                background: "#fafafa",
                padding: "32px",
                borderRadius: "6px",
              }}
            >
              <p style={{ color: "#666", fontSize: "17px", margin: 0 }}>
                No products are currently assigned to this grower.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "24px",
              }}
            >
              {activeProducts.map((product: any) => (
                <DynamicProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}