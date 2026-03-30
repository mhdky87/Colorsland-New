function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Failed to parse ${key}:`, error);
    return fallback;
  }
}

function safeSave(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function migrateLegacyGrowerProducts() {
  const legacyProducts = safeRead<any[]>("growerProducts", []);
  if (!legacyProducts.length) return;

  const addedProducts = safeRead<any[]>("growerProductsAdded", []);

  const merged = [...addedProducts];

  legacyProducts.forEach((legacy) => {
    const exists = merged.some(
      (item) =>
        (legacy.id && item.id === legacy.id) ||
        (legacy.slug && item.slug === legacy.slug && item.grower === legacy.grower)
    );

    if (!exists) {
      merged.push({
        ...legacy,
        isActive: legacy.isActive !== false,
      });
    }
  });

  safeSave("growerProductsAdded", merged);

  // نحذف المفتاح القديم حتى لا يسبب لخبطة أو استهلاك زائد
  localStorage.removeItem("growerProducts");
}