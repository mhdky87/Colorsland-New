import { Link } from "react-router-dom";
import { growers } from "../data/growers";

export default function GrowersPage() {
  return (
    <>
      <section
        style={{
          background: "#f7f7f7",
          padding: "70px 24px",
          borderBottom: "1px solid #ececec",
        }}
      >
        <div
          style={{
            maxWidth: "1320px",
            margin: "0 auto",
          }}
        >
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
            Growers Network
          </p>

          <h1
            style={{
              margin: "0 0 16px",
              fontSize: "54px",
              color: "#222",
              lineHeight: 1.1,
            }}
          >
            Our Growers
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "18px",
              color: "#666",
              lineHeight: 1.9,
              maxWidth: "760px",
            }}
          >
            Browse our growers network and explore products from multiple farms
            and suppliers. Each grower has its own catalog, and orders are
            reviewed directly by the selected grower based on availability.
          </p>
        </div>
      </section>

      <section
        style={{
          padding: "70px 24px 90px",
          background: "#fff",
        }}
      >
        <div
          style={{
            maxWidth: "1320px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "26px",
          }}
        >
          {growers.map((grower) => (
            <div
              key={grower.slug}
              style={{
                border: "1px solid #ececec",
                background: "#fff",
                overflow: "hidden",
                borderRadius: "4px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
              }}
            >
              <img
                src={grower.image}
                alt={grower.name}
                style={{
                  width: "100%",
                  height: "260px",
                  objectFit: "cover",
                  display: "block",
                }}
              />

              <div style={{ padding: "20px" }}>
                <h2
                  style={{
                    margin: "0 0 10px",
                    fontSize: "24px",
                    color: "#222",
                  }}
                >
                  {grower.name}
                </h2>

                <p
                  style={{
                    margin: "0 0 18px",
                    fontSize: "15px",
                    lineHeight: 1.8,
                    color: "#666",
                    minHeight: "82px",
                  }}
                >
                  {grower.description}
                </p>

                <Link
                  to={`/growers/${grower.slug}`}
                  style={{
                    display: "inline-block",
                    textDecoration: "none",
                    background: "#7dbb2f",
                    color: "#fff",
                    padding: "10px 18px",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  View Grower
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}