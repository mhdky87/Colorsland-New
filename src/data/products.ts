import banner2 from "../assets/plant1-banner2.jpg";
import banner3 from "../assets/plant1-banner3.jpg";
import hero from "../assets/plant1-testimonial-bg.jpg";
import type { BoxType } from "./boxTypes";

/**
 * IMPORTANT:
 * price = PRICE PER STEM
 * NOT price per box
 *
 * Derived pricing:
 * boxPrice = price * stemsPerBox
 */

export const products: {
  id: string;
  slug: string;
  name: string;
  image: string;
  description: string;
  category: string;
  grower: string;
  price: number; // price per stem
  boxType: BoxType;
  stemsPerBox: number;
  length?: string;
  packing?: string;
}[] = [
  {
    id: "p-001",
    slug: "premium-roses",
    name: "Premium Roses",
    image: banner2,
    description:
      "Premium roses selected for freshness, color consistency, and wholesale floral supply.",
    category: "flowers",
    grower: "black-tulip",
    price: 0.95, // old box price 19 / 20 stems
    boxType: "Jumbo Box",
    stemsPerBox: 20,
    length: "70cm",
    packing: "10 stems",
  },
  {
    id: "p-002",
    slug: "green-foliage",
    name: "Green Foliage",
    image: banner3,
    description:
      "Fresh greenery and foliage suitable for floral arrangements and decorative use.",
    category: "foliage",
    grower: "floranza",
    price: 0.93, // old box price 14 / 15 stems
    boxType: "Big Box",
    stemsPerBox: 15,
    packing: "bundle",
  },
  {
    id: "p-003",
    slug: "exotic-plants",
    name: "Exotic Plants",
    image: hero,
    description:
      "Exotic decorative plants with elegant presentation and reliable supply quality.",
    category: "plants",
    grower: "green-valley",
    price: 2.6, // old box price 26 / 10 stems
    boxType: "Zim Box",
    stemsPerBox: 10,
  },
  {
    id: "p-004",
    slug: "summer-flowers",
    name: "Summer Flowers",
    image: banner2,
    description:
      "Seasonal flower selections prepared for commercial and wholesale supply.",
    category: "flowers",
    grower: "rose-garden",
    price: 0.68, // old box price 17 / 25 stems
    boxType: "Standard Box",
    stemsPerBox: 25,
  },
  {
    id: "p-005",
    slug: "indoor-decor",
    name: "Indoor Decor Plants",
    image: banner3,
    description:
      "Indoor decorative plants curated for modern spaces and premium presentation.",
    category: "plants",
    grower: "green-valley",
    price: 34, // stemsPerBox = 1
    boxType: "Standard Box",
    stemsPerBox: 1,
  },
  {
    id: "p-006",
    slug: "fresh-bouquets",
    name: "Fresh Bouquets",
    image: hero,
    description:
      "Fresh bouquet collections designed for commercial floral sales and supply.",
    category: "bouquets",
    grower: "floranza",
    price: 1.83, // old box price 22 / 12 stems
    boxType: "Big Box",
    stemsPerBox: 12,
  },
];

export function getBoxPrice(product: { price: number; stemsPerBox: number }) {
  return Number(product.price || 0) * Number(product.stemsPerBox || 0);
}
