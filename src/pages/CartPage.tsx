import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function CartPage() {
  const { cart, removeFromCart, increaseQty, decreaseQty, clearCart } = useCart();

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => {
      return sum + item.price * item.stemsPerBox * item.boxes;
    }, 0);
  }, [cart]);

  const totalBoxes = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.boxes, 0);
  }, [cart]);

  const totalStems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalStems, 0);
  }, [cart]);

  return (
    <section
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 24px 60px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 8px", fontSize: "36px", color: "#222" }}>
            Cart
          </h1>
          <p style={{ margin: 0, color: "#666" }}>
            Review your selected products before checkout.
          </p>
        </div>

        {cart.length > 0 && (
          <button
            onClick={clearCart}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #e2e2e2",
              background: "#fff",
              color: "#b33a3a",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Clear Cart
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div
          style={{
            border: "1px solid #ececec",
            borderRadius: "12px",
            background: "#fafafa",
            padding: "28px",
          }}
        >
          <p style={{ margin: "0 0 16px", color: "#555", fontSize: "18px" }}>
            Your cart is empty.
          </p>

          <Link
            to="/shop"
            style={{
              display: "inline-block",
              textDecoration: "none",
              background: "#7dbb2f",
              color: "#fff",
              padding: "12px 18px",
              borderRadius: "8px",
              fontWeight: 700,
            }}
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gap: "16px", marginBottom: "28px" }}>
            {cart.map((item) => {
              const boxPrice = item.price * item.stemsPerBox;
              const lineTotal = boxPrice * item.boxes;

              return (
                <div
                  key={[
                    item.slug,
                    item.grower,
                    item.selectedVariety || "",
                    item.selectedLength || "",
                  ].join("__")}
                  style={{
                    border: "1px solid #ececec",
                    borderRadius: "14px",
                    background: "#fff",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "110px 1fr",
                      gap: "16px",
                      padding: "18px",
                    }}
                  >
                    <div
                      style={{
                        width: "110px",
                        height: "110px",
                        borderRadius: "12px",
                        overflow: "hidden",
                        background: "#f5f5f5",
                      }}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
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

                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "16px",
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                          marginBottom: "12px",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              margin: "0 0 6px",
                              fontSize: "24px",
                              color: "#222",
                            }}
                          >
                            {item.name}
                          </h3>

                          <div style={{ display: "grid", gap: "4px", color: "#666", fontSize: "14px" }}>
                            <div>
                              <strong>Grower:</strong> {item.grower}
                            </div>
                            <div>
                              <strong>Box Type:</strong> {item.boxType}
                            </div>
                            {item.selectedVariety ? (
                              <div>
                                <strong>Variety:</strong> {item.selectedVariety}
                              </div>
                            ) : null}
                            {item.selectedColor ? (
                              <div>
                                <strong>Color:</strong> {item.selectedColor}
                              </div>
                            ) : null}
                            {item.selectedLength ? (
                              <div>
                                <strong>Length:</strong> {item.selectedLength}
                              </div>
                            ) : null}
                            {item.deliveryDate ? (
                              <div>
                                <strong>Delivery Date:</strong> {item.deliveryDate}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            removeFromCart(
                              item.slug,
                              item.grower,
                              item.selectedVariety,
                              item.selectedLength
                            )
                          }
                          style={{
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1px solid #f0d0d0",
                            background: "#fff",
                            color: "#b33a3a",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: "10px",
                          marginBottom: "14px",
                        }}
                      >
                        <div style={metaBoxStyle}>
                          <div style={metaLabelStyle}>Price / Stem</div>
                          <div style={metaValueStyle}>{formatMoney(item.price)}</div>
                        </div>

                        <div style={metaBoxStyle}>
                          <div style={metaLabelStyle}>Stems / Box</div>
                          <div style={metaValueStyle}>{item.stemsPerBox}</div>
                        </div>

                        <div style={metaBoxStyle}>
                          <div style={metaLabelStyle}>Price / Box</div>
                          <div style={metaValueStyle}>{formatMoney(boxPrice)}</div>
                        </div>

                        <div style={metaBoxStyle}>
                          <div style={metaLabelStyle}>Total Stems</div>
                          <div style={metaValueStyle}>{item.totalStems}</div>
                        </div>

                        <div style={metaBoxStyle}>
                          <div style={metaLabelStyle}>Line Total</div>
                          <div style={metaValueStyle}>{formatMoney(lineTotal)}</div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "16px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <button
                            onClick={() =>
                              decreaseQty(
                                item.slug,
                                item.grower,
                                item.selectedVariety,
                                item.selectedLength
                              )
                            }
                            style={qtyBtnStyle}
                          >
                            -
                          </button>

                          <div
                            style={{
                              minWidth: "40px",
                              textAlign: "center",
                              fontSize: "18px",
                              fontWeight: 800,
                              color: "#222",
                            }}
                          >
                            {item.boxes}
                          </div>

                          <button
                            onClick={() =>
                              increaseQty(
                                item.slug,
                                item.grower,
                                item.selectedVariety,
                                item.selectedLength
                              )
                            }
                            style={qtyBtnStyle}
                          >
                            +
                          </button>
                        </div>

                        <div style={{ fontSize: "14px", color: "#666" }}>
                          Boxes selected: <strong>{item.boxes}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              border: "1px solid #ececec",
              borderRadius: "14px",
              background: "#fafafa",
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px",
                marginBottom: "18px",
              }}
            >
              <div style={metaBoxStyle}>
                <div style={metaLabelStyle}>Items</div>
                <div style={metaValueStyle}>{cart.length}</div>
              </div>

              <div style={metaBoxStyle}>
                <div style={metaLabelStyle}>Total Boxes</div>
                <div style={metaValueStyle}>{totalBoxes}</div>
              </div>

              <div style={metaBoxStyle}>
                <div style={metaLabelStyle}>Total Stems</div>
                <div style={metaValueStyle}>{totalStems}</div>
              </div>

              <div style={metaBoxStyle}>
                <div style={metaLabelStyle}>Grand Total</div>
                <div style={metaValueStyle}>{formatMoney(totalPrice)}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link
                to="/shop"
                style={{
                  textDecoration: "none",
                  padding: "12px 18px",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                  background: "#fff",
                  color: "#222",
                  fontWeight: 700,
                }}
              >
                Continue Shopping
              </Link>

              <Link
                to="/checkout"
                style={{
                  textDecoration: "none",
                  padding: "12px 18px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#7dbb2f",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

const metaBoxStyle: React.CSSProperties = {
  border: "1px solid #ededed",
  borderRadius: "12px",
  padding: "12px",
  background: "#fff",
};

const metaLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#777",
  marginBottom: "4px",
};

const metaValueStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 800,
  color: "#222",
};

const qtyBtnStyle: React.CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  background: "#fff",
  color: "#222",
  fontWeight: 800,
  cursor: "pointer",
};
