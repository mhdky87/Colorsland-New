import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { growers } from "../data/growers";

export default function GrowerLoginPage() {
  const [slug, setSlug] = useState("");
  const navigate = useNavigate();

  return (
    <section
      style={{
        maxWidth: "500px",
        margin: "0 auto",
        padding: "100px 24px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "36px", marginBottom: "10px" }}>
        Grower Login
      </h1>

      <p style={{ color: "#666", marginBottom: "30px" }}>
        Access your grower dashboard to manage your orders.
      </p>

      <input
        placeholder="Enter Grower Slug (e.g. black-tulip)"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        style={{
          padding: "14px",
          width: "100%",
          border: "1px solid #ddd",
          borderRadius: "4px",
        }}
      />

      <button
        onClick={() => {
          const cleanSlug = slug.trim().toLowerCase();

          if (!cleanSlug) {
            alert("Please enter grower slug");
            return;
          }

          // ✅ تحقق من وجود المزرعة
          const exists = growers.find((g) => g.slug === cleanSlug);

          if (!exists) {
            alert("Invalid grower");
            return;
          }

          localStorage.setItem("grower", cleanSlug);
          navigate("/grower-orders");
        }}
        style={{
          marginTop: "20px",
          padding: "14px",
          width: "100%",
          background: "#222",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Login
      </button>
    </section>
  );
}