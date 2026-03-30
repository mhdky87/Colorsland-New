export default function NotFoundPage() {
  return (
    <section
      style={{
        maxWidth: "1320px",
        margin: "0 auto",
        padding: "80px 24px",
      }}
    >
      <h1 style={{ fontSize: "48px", margin: "0 0 16px", color: "#222" }}>
        404
      </h1>
      <p style={{ fontSize: "18px", color: "#666", lineHeight: 1.8 }}>
        The page you are looking for was not found.
      </p>
    </section>
  );
}