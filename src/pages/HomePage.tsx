import banner1 from "../assets/plant1-testimonial-bg.jpg";
import banner2 from "../assets/plant1-banner2.jpg";
import banner3 from "../assets/plant1-banner3.jpg";

import s1 from "../assets/plant1-service-icon1.png";
import s2 from "../assets/plant1-service-icon2.png";
import s3 from "../assets/plant1-service-icon3.png";
import s4 from "../assets/plant1-service-icon4.png";
import { Link } from "react-router-dom";

const services = [
  {
    icon: s1,
    title: "Our services",
    desc: "We have a team specialized in managing orders and providing the required flowers.",
  },
  {
    icon: s2,
    title: "Growers",
    desc: "We provide the best quality from the largest flower farms in Kenya.",
  },
  {
    icon: s3,
    title: "Shipping services",
    desc: "We have partners leading freight shipping. They provide the required spaces at the best price.",
  },
  {
    icon: s4,
    title: "Support 24/7",
    desc: "Our team is ready at your service at any time to follow up your requests with pleasure.",
  },
];

const categoryTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "15px",
  fontWeight: 600,
  color: "#222",
};

const categoryHeadingStyle: React.CSSProperties = {
  margin: "10px 0 16px",
  fontSize: "42px",
  lineHeight: 1.12,
  fontWeight: 600,
  color: "#222",
};

const greenButtonStyle: React.CSSProperties = {
  display: "inline-block",
  background: "#7dbb2f",
  color: "#fff",
  textDecoration: "none",
  padding: "12px 22px",
  borderRadius: "4px",
  fontSize: "15px",
  fontWeight: 600,
};

export default function HomePage() {
  return (
    <>
      <section
        style={{
          background: `url(${banner1}) center center / cover no-repeat`,
          minHeight: "580px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            maxWidth: "1320px",
            margin: "0 auto",
            width: "100%",
            padding: "40px 24px",
          }}
        >
          <div
            style={{
              maxWidth: "520px",
              marginLeft: "130px",
            }}
          >
            <p
              style={{
                margin: "0 0 10px",
                fontSize: "20px",
                fontWeight: 500,
                color: "#222",
              }}
            >
              Colors Land
            </p>

            <h1
              style={{
                margin: "0 0 24px",
                fontSize: "58px",
                lineHeight: 1.12,
                fontWeight: 600,
                color: "#222",
              }}
            >
              New Generation In Flowers Trade Services
            </h1>

            <Link to="/product-category/flowers" style={greenButtonStyle}>
  Shop now
</Link>
          </div>
        </div>
      </section>

      <section
        style={{
          background: "#fff",
          padding: "68px 24px 78px",
        }}
      >
        <div
          style={{
            maxWidth: "1320px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "38px",
            textAlign: "center",
          }}
        >
          {services.map((item) => (
            <div key={item.title}>
              <div
                style={{
                  width: "108px",
                  height: "108px",
                  margin: "0 auto 22px",
                  borderRadius: "999px",
                  background: "#fff",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={item.icon}
                  alt={item.title}
                  style={{
                    width: "48px",
                    height: "48px",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>

              <h3
                style={{
                  margin: "0 0 12px",
                  fontSize: "22px",
                  fontWeight: 600,
                  color: "#222",
                }}
              >
                {item.title}
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#666",
                  fontSize: "16px",
                  lineHeight: 1.75,
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          padding: "30px 24px 90px",
          background: "#fff",
        }}
      >
        <div
          style={{
            maxWidth: "1320px",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              margin: "0 0 44px",
              color: "#7dbb2f",
              fontSize: "18px",
              letterSpacing: "0.8px",
              fontWeight: 600,
            }}
          >
            PRODUCT CATEGORIES
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
            }}
          >
            <div
              style={{
                minHeight: "430px",
                borderRadius: "2px",
                overflow: "hidden",
                background: `url(${banner2}) center center / cover no-repeat`,
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  padding: "46px",
                  maxWidth: "320px",
                }}
              >
                <p style={categoryTitleStyle}>Flowers</p>
                <h3 style={categoryHeadingStyle}>
                  Premium Roses
                  <br />
                  Spray roses
                </h3>
                <a href="/shop" style={greenButtonStyle}>
                  Shop now
                </a>
              </div>
            </div>

            <div
              style={{
                minHeight: "430px",
                borderRadius: "2px",
                overflow: "hidden",
                background: `url(${banner3}) center center / cover no-repeat`,
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  padding: "46px",
                  maxWidth: "300px",
                }}
              >
                <p style={categoryTitleStyle}>Foliage</p>
                <h3 style={categoryHeadingStyle}>
                  For Interior
                </h3>
                <a href="/shop" style={greenButtonStyle}>
                  Shop now
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}