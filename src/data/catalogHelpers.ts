import { growers } from "./growers";
import { products as legacyProducts } from "./products";

import { products as subatiProducts } from "./subati";
import { products as primaRosaProducts } from "./prima-rosa";
import { products as poriniProducts } from "./porini";
import { products as pjDaveProducts } from "./pj-dave";
import { aaaRosesCatalog } from "./aaa-roses";

export type CatalogProduct = Record<string, any>;

export type CatalogCategory = {
  id: string;
  slug: string;
  name: string;
  grower: string;
  sourceType: "base" | "added" | "override";
  originalSlug?: string;
  originalName?: string;
  mergedTo?: string;
  isHidden?: boolean;
};

export type CategoryOverrideRecord = {
  id: string;
  grower: string;
  originalSlug?: string;
  originalName?: string;
  name: string;
  slug: string;
  mergedTo?: string;
  isHidden?: boolean;
};

export type Catalog = {
  categories: string[];
  products: CatalogProduct[];
};

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Failed to parse localStorage key: ${key}`, error);
    return fallback;
  }
}

function buildSlug(value: unknown): string {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-");
}

function normalizeCategoryName(category: unknown): string {
  const value = String(category || "").trim();
  if (!value) return "uncategorized";
  return value.toLowerCase();
}

function normalizeOptionalNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeOptionalString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * IMPORTANT:
 * price inside the catalog = PRICE PER STEM
 * NOT price per box.
 *
 * Final calculations everywhere in UI should follow:
 * boxPrice = price * stemsPerBox
 * lineTotal = boxPrice * boxes
 */
function normalizeProduct(product: CatalogProduct, growerSlug: string): CatalogProduct {
  const normalizedName = normalizeOptionalString(product.name, "Unnamed Product");
  const normalizedCategory = normalizeCategoryName(
    product.category || product.baseCategoryName
  );

  const normalizedPricePerStem = normalizeOptionalNumber(product.price, 0);
  const normalizedStemsPerBox = normalizeOptionalNumber(product.stemsPerBox, 0);

  return {
    ...product,
    id: product.id || `${growerSlug}-${Date.now()}`,
    slug:
      normalizeOptionalString(product.slug).trim() ||
      buildSlug(normalizedName) ||
      `${growerSlug}-${Date.now()}`,
    name: normalizedName,
    image: normalizeOptionalString(product.image, ""),
    description: normalizeOptionalString(product.description, ""),
    grower: normalizeOptionalString(product.grower, growerSlug),
    category: normalizedCategory,
    isActive: product.isActive !== false,

    // CORE PRICING SEMANTICS
    price: normalizedPricePerStem, // price per stem
    stemsPerBox: normalizedStemsPerBox,

    // derived helper values
    boxPrice: normalizedPricePerStem * normalizedStemsPerBox,

    boxType: normalizeOptionalString(product.boxType, ""),
    length: product.length ? String(product.length).trim() : undefined,
    packing: product.packing ? String(product.packing).trim() : undefined,
    minQty: normalizeOptionalNumber(product.minQty, 0),
    lengths: Array.isArray(product.lengths) ? product.lengths : [],
    items: Array.isArray(product.items) ? product.items : [],
    color: normalizeOptionalString(product.color, ""),
    baseCategoryName: normalizeOptionalString(product.baseCategoryName, ""),
    baseCategorySlug: normalizeOptionalString(product.baseCategorySlug, ""),
  };
}

function expandCatalogStructure(catalog: any, growerSlug: string): CatalogProduct[] {
  if (!catalog?.categories) return [];

  const products: CatalogProduct[] = [];

  catalog.categories.forEach((category: any) => {
    const categorySlug = normalizeOptionalString(category.slug, buildSlug(category.name));
    const categoryName = normalizeOptionalString(category.name, categorySlug);
    const normalizedCategoryName = normalizeCategoryName(categoryName);

    const availableLengths = Array.isArray(category.lengths)
      ? category.lengths.filter(
          (entry: any) =>
            entry &&
            entry.price !== "غير متوفر" &&
            entry.price !== "" &&
            entry.price !== null &&
            entry.price !== undefined
        )
      : [];

    // keep preview price as price per stem
    const previewPricePerStem =
      availableLengths.length > 0 ? Number(availableLengths[0].price) : 0;

    (category.items || []).forEach((item: any, index: number) => {
      const itemName = normalizeOptionalString(item?.name, `item-${index}`);

      products.push({
        id: `${growerSlug}-${categorySlug}-${index}`,
        slug: buildSlug(`${categorySlug}-${itemName}`),
        name: itemName,
        description: `${categoryName} - ${itemName}`,
        grower: growerSlug,
        category: normalizedCategoryName,
        baseCategoryName: categoryName,
        baseCategorySlug: categorySlug,
        color: normalizeOptionalString(item?.color, ""),
        lengths: Array.isArray(category.lengths) ? category.lengths : [],
        price: previewPricePerStem, // price per stem
        stemsPerBox: normalizeOptionalNumber(category.stemsPerBox, 0),
        boxType: normalizeOptionalString(category.boxType, ""),
        image: "",
        isActive: true,
      });
    });
  });

  return products;
}

function getBaseGrowerCategoryRecords(growerSlug: string): CatalogCategory[] {
  if (growerSlug === "aaa-roses" && aaaRosesCatalog?.categories) {
    return aaaRosesCatalog.categories.map((category: any, index: number) => {
      const name = normalizeOptionalString(category.name, `category-${index}`);
      const slug = normalizeOptionalString(category.slug, buildSlug(name));

      return {
        id: `${growerSlug}-base-category-${slug}`,
        slug,
        name: normalizeCategoryName(name),
        grower: growerSlug,
        sourceType: "base" as const,
        originalSlug: slug,
        originalName: name,
      };
    });
  }

  const baseProducts = getBaseGrowerProducts(growerSlug);
  const uniqueMap = new Map<string, CatalogCategory>();

  baseProducts.forEach((product, index) => {
    const categoryName = normalizeCategoryName(product.category);
    const categorySlug = buildSlug(product.baseCategorySlug || product.category || categoryName);

    if (!uniqueMap.has(categoryName)) {
      uniqueMap.set(categoryName, {
        id: `${growerSlug}-base-category-${categorySlug || index}`,
        slug: categorySlug || buildSlug(categoryName),
        name: categoryName,
        grower: growerSlug,
        sourceType: "base",
        originalSlug: categorySlug || buildSlug(categoryName),
        originalName: categoryName,
      });
    }
  });

  return Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function getAddedCategoryRecords(growerSlug: string): CatalogCategory[] {
  const data = safeRead<any[]>("growerCategories", []);

  return data
    .filter((c: any) => c.grower === growerSlug)
    .map((c: any, index: number) => {
      const name = normalizeCategoryName(c.name);
      const slug = normalizeOptionalString(c.slug, buildSlug(name));

      return {
        id: c.id || `${growerSlug}-added-category-${slug || index}`,
        slug,
        name,
        grower: growerSlug,
        sourceType: "added" as const,
      };
    });
}

export function getCategoryOverrides(growerSlug: string): CategoryOverrideRecord[] {
  const data = safeRead<CategoryOverrideRecord[]>("growerCategoryOverrides", []);
  return data.filter((c) => c.grower === growerSlug);
}

function normalizeCategoryOverrideRecords(growerSlug: string): CatalogCategory[] {
  return getCategoryOverrides(growerSlug).map((c, index) => ({
    id: c.id || `${growerSlug}-override-category-${index}`,
    slug: normalizeOptionalString(c.slug, buildSlug(c.name)),
    name: normalizeCategoryName(c.name),
    grower: growerSlug,
    sourceType: "override" as const,
    originalSlug: normalizeOptionalString(c.originalSlug, ""),
    originalName: normalizeOptionalString(c.originalName, ""),
    mergedTo: c.mergedTo ? normalizeCategoryName(c.mergedTo) : undefined,
    isHidden: c.isHidden === true,
  }));
}

function findCategoryOverride(
  productOrCategory: {
    category?: string;
    baseCategoryName?: string;
    baseCategorySlug?: string;
    name?: string;
    slug?: string;
  },
  categoryOverrides: CatalogCategory[]
) {
  const normalizedCategory = normalizeCategoryName(productOrCategory.category || productOrCategory.name);
  const baseCategorySlug = normalizeOptionalString(productOrCategory.baseCategorySlug || productOrCategory.slug, "");
  const baseCategoryName = normalizeCategoryName(
    productOrCategory.baseCategoryName || productOrCategory.category || productOrCategory.name
  );

  return categoryOverrides.find((item) => {
    const originalName = normalizeCategoryName(item.originalName || "");
    const originalSlug = normalizeOptionalString(item.originalSlug, "");

    return (
      (originalName && originalName === normalizedCategory) ||
      (originalName && originalName === baseCategoryName) ||
      (originalSlug && originalSlug === baseCategorySlug)
    );
  });
}

function applyCategoryOverridesToProducts(
  products: CatalogProduct[],
  categoryOverrides: CatalogCategory[]
): CatalogProduct[] {
  if (!categoryOverrides.length) return products;

  return products
    .map((product) => {
      const override = findCategoryOverride(product, categoryOverrides);

      if (!override) return product;
      if (override.isHidden) return null;

      const nextCategory = normalizeCategoryName(
        override.mergedTo || override.name || product.category
      );

      return normalizeProduct(
        {
          ...product,
          category: nextCategory,
          baseCategoryName: override.originalName || product.baseCategoryName,
          baseCategorySlug: override.originalSlug || product.baseCategorySlug,
        },
        product.grower
      );
    })
    .filter(Boolean) as CatalogProduct[];
}

export function getBaseGrowerProducts(growerSlug: string): CatalogProduct[] {
  let rawProducts: CatalogProduct[] = [];

  switch (growerSlug) {
    case "subati":
      rawProducts = subatiProducts || [];
      break;
    case "prima-rosa":
      rawProducts = primaRosaProducts || [];
      break;
    case "porini":
      rawProducts = poriniProducts || [];
      break;
    case "pj-dave":
      rawProducts = pjDaveProducts || [];
      break;
    case "aaa-roses":
      rawProducts = expandCatalogStructure(aaaRosesCatalog, growerSlug);
      break;
    default:
      rawProducts = legacyProducts.filter((p: any) => p.grower === growerSlug);
      break;
  }

  return rawProducts.map((product) => normalizeProduct(product, growerSlug));
}

export function getAddedProducts(growerSlug: string): CatalogProduct[] {
  const data = safeRead<CatalogProduct[]>("growerProductsAdded", []);
  return data
    .filter((p: any) => p.grower === growerSlug)
    .map((product) => normalizeProduct(product, growerSlug));
}

export function getProductOverrides(growerSlug: string): CatalogProduct[] {
  const data = safeRead<CatalogProduct[]>("growerProductOverrides", []);
  return data
    .filter((p: any) => p.grower === growerSlug)
    .map((product) => normalizeProduct(product, growerSlug));
}

export function getBaseGrowerCategories(growerSlug: string): CatalogCategory[] {
  return getBaseGrowerCategoryRecords(growerSlug);
}

export function getMergedGrowerCategories(growerSlug: string): CatalogCategory[] {
  const baseCategories = getBaseGrowerCategoryRecords(growerSlug);
  const addedCategories = getAddedCategoryRecords(growerSlug);
  const categoryOverrides = normalizeCategoryOverrideRecords(growerSlug);

  const mergedMap = new Map<string, CatalogCategory>();

  baseCategories.forEach((category) => {
    const override = findCategoryOverride(category, categoryOverrides);
    if (override?.isHidden) return;

    const effectiveName = normalizeCategoryName(
      override?.mergedTo || override?.name || category.name
    );
    const effectiveSlug = buildSlug(effectiveName);

    mergedMap.set(effectiveName, {
      ...category,
      id: override?.id || category.id,
      name: effectiveName,
      slug: effectiveSlug,
      sourceType: override ? "override" : "base",
      mergedTo: override?.mergedTo,
      isHidden: override?.isHidden,
    });
  });

  addedCategories.forEach((category) => {
    const override = findCategoryOverride(category, categoryOverrides);
    if (override?.isHidden) return;

    const effectiveName = normalizeCategoryName(
      override?.mergedTo || override?.name || category.name
    );
    const effectiveSlug = buildSlug(effectiveName);

    mergedMap.set(effectiveName, {
      ...category,
      id: override?.id || category.id,
      name: effectiveName,
      slug: effectiveSlug,
      sourceType: override ? "override" : "added",
      mergedTo: override?.mergedTo,
      isHidden: override?.isHidden,
      originalName: override?.originalName || category.originalName || category.name,
      originalSlug: override?.originalSlug || category.originalSlug || category.slug,
    });
  });

  return Array.from(mergedMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getAdminCategories(growerSlug: string): string[] {
  return getMergedGrowerCategories(growerSlug).map((category) => category.name);
}

function applyOverrides(
  baseProducts: CatalogProduct[],
  overrides: CatalogProduct[]
): CatalogProduct[] {
  return baseProducts.map((baseProduct) => {
    const override = overrides.find(
      (item) =>
        (item.id && baseProduct.id === item.id) ||
        (item.slug && baseProduct.slug === item.slug)
    );

    if (!override) return baseProduct;

    return normalizeProduct(
      {
        ...baseProduct,
        ...override,
      },
      baseProduct.grower
    );
  });
}

export function getMergedGrowerCatalog(growerSlug: string): Catalog {
  const baseProducts = getBaseGrowerProducts(growerSlug);
  const addedProducts = getAddedProducts(growerSlug);
  const overrides = getProductOverrides(growerSlug);
  const categoryOverrides = normalizeCategoryOverrideRecords(growerSlug);

  const overriddenBaseProducts = applyOverrides(baseProducts, overrides);

  const mergedMap = new Map<string, CatalogProduct>();

  overriddenBaseProducts.forEach((product) => {
    mergedMap.set(String(product.id || product.slug), product);
  });

  addedProducts.forEach((product) => {
    mergedMap.set(String(product.id || product.slug), product);
  });

  const mergedProducts = applyCategoryOverridesToProducts(
    Array.from(mergedMap.values()),
    categoryOverrides
  )
    .map((product) => normalizeProduct(product, growerSlug))
    .filter((product) => product.grower === growerSlug);

  const categories = getMergedGrowerCategories(growerSlug).map(
    (category) => category.name
  );

  return {
    categories,
    products: mergedProducts,
  };
}

export function getAllMergedCatalog(): Catalog {
  const allProducts: CatalogProduct[] = [];
  const allCategories: string[] = [];

  growers.forEach((grower) => {
    const catalog = getMergedGrowerCatalog(grower.slug);
    allProducts.push(...catalog.products);
    allCategories.push(...catalog.categories);
  });

  return {
    products: allProducts,
    categories: Array.from(new Set(allCategories)).sort((a, b) =>
      a.localeCompare(b)
    ),
  };
}
