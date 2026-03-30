import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { BOX_TYPES, type BoxType } from "../data/boxTypes";
import {
  getBaseGrowerProducts,
  getCategoryOverrides,
  getMergedGrowerCatalog,
  getMergedGrowerCategories,
} from "../data/catalogHelpers";

type AdminTab = "overview" | "products" | "orders";
type ProductViewMode = "cards" | "sidebar" | "grouped";

type ProductLengthOption = {
  length: string;
  price: number;
};

type ProductRecord = {
  id: string;
  slug: string;
  name: string;
  image?: string;
  description?: string;
  category: string;
  grower: string;
  price: number;
  boxType: BoxType;
  stemsPerBox: number;
  length?: string;
  lengths?: ProductLengthOption[];
  packing?: string;
  isActive?: boolean;
};

type OrderItem = {
  slug: string;
  name: string;
  price: string | number;
  image: string;
  grower: string;
  boxType: string;
  stemsPerBox: number;
  boxes: number;
  totalStems: number;
  selectedVariety?: string;
  selectedColor?: string;
  selectedLength?: string;
  deliveryDate?: string;
};

type GrowerOrder = {
  id: string;
  parentOrderId?: string;
  grower: string;
  status: string;
  createdAt: string;
  deliveryDate?: string;
  customer?: {
    name?: string;
    company?: string;
    phone?: string;
    city?: string;
    notes?: string;
  };
  items: OrderItem[];
};

type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  grower: string;
  sourceType?: "base" | "added" | "override";
  originalSlug?: string;
  originalName?: string;
  mergedTo?: string;
  isHidden?: boolean;
};

type CategoryOverrideRecord = {
  id: string;
  grower: string;
  originalSlug?: string;
  originalName?: string;
  name: string;
  slug: string;
  mergedTo?: string;
  isHidden?: boolean;
};

type ProductFormState = {
  name: string;
  description: string;
  category: string;
  price: string;
  boxType: BoxType;
  stemsPerBox: string;
  length: string;
  lengthsText: string;
  packing: string;
  image: string;
};

const initialFormState: ProductFormState = {
  name: "",
  description: "",
  category: "",
  price: "",
  boxType: "Standard Box",
  stemsPerBox: "",
  length: "",
  lengthsText: "",
  packing: "",
  image: "",
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-");
}

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

function readAddedProducts(): ProductRecord[] {
  return safeRead<ProductRecord[]>("growerProductsAdded", []);
}

function saveAddedProducts(products: ProductRecord[]) {
  safeSave("growerProductsAdded", products);
}

function readProductOverrides(): ProductRecord[] {
  return safeRead<ProductRecord[]>("growerProductOverrides", []);
}

function saveProductOverrides(products: ProductRecord[]) {
  safeSave("growerProductOverrides", products);
}

function getNumericPrice(value: number | string | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(/\$/g, "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function normalizeProductLengths(product: Partial<ProductRecord> | null | undefined): ProductLengthOption[] {
  if (!product) return [];

  const fromArray = Array.isArray((product as any).lengths)
    ? (product as any).lengths
        .map((entry: any) => ({
          length: String(entry?.length || "").trim(),
          price: Number(entry?.price || 0),
        }))
        .filter((entry: ProductLengthOption) => entry.length && entry.price > 0)
    : [];

  if (fromArray.length > 0) return fromArray;

  if (product.length && Number(product.price || 0) > 0) {
    return [
      {
        length: String(product.length).trim(),
        price: Number(product.price || 0),
      },
    ];
  }

  return [];
}

function formatLengthsText(lengths: ProductLengthOption[]) {
  return lengths.map((entry) => `${entry.length}:${entry.price}`).join("\n");
}

function parseLengthsText(value: string): ProductLengthOption[] {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.includes(":") ? ":" : line.includes("=") ? "=" : "-";
      const parts = line.split(separator);
      const length = String(parts[0] || "").trim();
      const price = Number(String(parts.slice(1).join(separator) || "").replace(/\$/g, "").trim());
      return {
        length,
        price,
      };
    })
    .filter((entry) => entry.length && entry.price > 0);
}

function getPrimaryLengthData(form: ProductFormState) {
  const parsedLengths = parseLengthsText(form.lengthsText);
  if (parsedLengths.length > 0) {
    return {
      parsedLengths,
      primaryLength: parsedLengths[0].length,
      primaryPrice: parsedLengths[0].price,
    };
  }

  const fallbackPrice = Number(form.price || 0);
  return {
    parsedLengths: [],
    primaryLength: form.length.trim(),
    primaryPrice: fallbackPrice,
  };
}

function getBoxPriceFromProduct(product: { price: number; stemsPerBox: number }) {
  return Number(product.price || 0) * Number(product.stemsPerBox || 0);
}

function getLineTotal(item: OrderItem) {
  return (
    getNumericPrice(item.price) *
    Number(item.stemsPerBox || 0) *
    Number(item.boxes || 0)
  );
}

function readGrowerOrders(grower: string): GrowerOrder[] {
  const raw = safeRead<GrowerOrder[]>("orders", []);
  return raw.filter(
    (order) => order.grower === grower && Array.isArray(order.items)
  );
}

function readCategories(): CategoryRecord[] {
  return safeRead<CategoryRecord[]>("growerCategories", []);
}

function saveCategories(categories: CategoryRecord[]) {
  safeSave("growerCategories", categories);
}

function saveCategoryOverrides(records: CategoryOverrideRecord[]) {
  safeSave("growerCategoryOverrides", records);
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB");
}


type ManagedProduct = ProductRecord & {
  sourceType: "base" | "added";
};

export default function GrowerAdminPage() {
  const currentGrower = localStorage.getItem("grower") || "";

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const navigate = useNavigate();
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [orders, setOrders] = useState<GrowerOrder[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingSourceType, setEditingSourceType] = useState<"base" | "added" | null>(
    null
  );
  const [form, setForm] = useState<ProductFormState>(initialFormState);

  const [newCategory, setNewCategory] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [productViewMode, setProductViewMode] = useState<ProductViewMode>("sidebar");

  const [mergingCategoryId, setMergingCategoryId] = useState<string | null>(null);
  const [mergeTargetCategory, setMergeTargetCategory] = useState("");

  useEffect(() => {
    if (!currentGrower) return;
    loadAllData();
  }, [currentGrower]);

  const availableCategories = useMemo(() => {
    return categories
      .map((category) => String(category.name || "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [categories]);

  const stats = useMemo(() => {
    const activeProducts = products.filter((p) => p.isActive !== false).length;
    const pendingOrders = orders.filter(
      (order) => order.status === "pending_review"
    ).length;

    const totalBoxes = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + (item.boxes || 0), 0);
    }, 0);

    const totalStems = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + (item.totalStems || 0), 0);
    }, 0);

    const totalAmount = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + getLineTotal(item), 0);
    }, 0);

    return {
      totalProducts: products.length,
      activeProducts,
      pendingOrders,
      totalOrders: orders.length,
      totalBoxes,
      totalStems,
      totalAmount,
      totalCategories: availableCategories.length,
    };
  }, [products, orders, availableCategories]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (!selectedCategory) return true;
      return String(product.category).toLowerCase() === selectedCategory.toLowerCase();
    });
  }, [products, selectedCategory]);

  const groupedProducts = useMemo(() => {
    return availableCategories.map((category) => ({
      category,
      products: products.filter(
        (product) => String(product.category).toLowerCase() === category.toLowerCase()
      ),
    }));
  }, [products, availableCategories]);

  function loadAllData() {
    const mergedCatalog = getMergedGrowerCatalog(currentGrower);
    const mergedCategories = getMergedGrowerCategories(currentGrower);
    const addedProducts = readAddedProducts().filter(
      (product) => product.grower === currentGrower
    );

    const managedProducts: ManagedProduct[] = mergedCatalog.products.map((product: any) => {
      const isAdded = addedProducts.some(
        (added) =>
          (added.id && added.id === product.id) ||
          (added.slug && added.slug === product.slug)
      );

      return {
        ...product,
        sourceType: isAdded ? "added" : "base",
      };
    });

    setProducts(managedProducts);
    setOrders(readGrowerOrders(currentGrower));
    setCategories(
      mergedCategories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        grower: currentGrower,
        sourceType: category.sourceType,
        originalName: category.originalName,
        originalSlug: category.originalSlug,
        mergedTo: category.mergedTo,
        isHidden: category.isHidden,
      }))
    );
  }

  if (!currentGrower) {
    return <Navigate to="/grower-login" replace />;
  }

  function updateForm<K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(initialFormState);
    setEditingProductId(null);
    setEditingSourceType(null);
    setShowForm(false);
  }

  function openAddForm() {
    setEditingProductId(null);
    setEditingSourceType(null);
    setForm(initialFormState);
    setShowForm(true);
  }

  function openEditForm(product: ManagedProduct) {
    setEditingProductId(product.id);
    setEditingSourceType(product.sourceType);
    const normalizedLengths = normalizeProductLengths(product);

    setForm({
      name: product.name || "",
      description: product.description || "",
      category: product.category || "",
      price: String(product.price ?? ""),
      boxType: product.boxType,
      stemsPerBox: String(product.stemsPerBox ?? ""),
      length: product.length || normalizedLengths[0]?.length || "",
      lengthsText: formatLengthsText(normalizedLengths),
      packing: product.packing || "",
      image: product.image || "",
    });
    setShowForm(true);
    setActiveTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateForm("image", String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  }

  function buildFormProduct(productId?: string): ProductRecord {
    const { parsedLengths, primaryLength, primaryPrice } = getPrimaryLengthData(form);

    return {
      id: productId || `p-${Date.now()}`,
      slug: slugify(form.name.trim()) || `product-${Date.now()}`,
      name: form.name.trim(),
      image: form.image || "",
      description: form.description.trim(),
      category: form.category.trim().toLowerCase(),
      grower: currentGrower,
      price: primaryPrice,
      boxType: form.boxType,
      stemsPerBox: Number(form.stemsPerBox),
      length: primaryLength || undefined,
      lengths: parsedLengths.length > 0 ? parsedLengths : undefined,
      packing: form.packing.trim() || undefined,
      isActive: true,
    };
  }

  function handleSaveProduct() {
    if (!form.name.trim()) {
      alert("Please enter product name.");
      return;
    }

    if (!form.category.trim()) {
      alert("Please select or enter category.");
      return;
    }

    const parsedLengths = parseLengthsText(form.lengthsText);

    if (parsedLengths.length === 0 && (!form.price.trim() || Number(form.price) <= 0)) {
      alert("Please enter at least one valid length and price, or a valid stem price.");
      return;
    }

    if (!form.stemsPerBox.trim() || Number(form.stemsPerBox) <= 0) {
      alert("Please enter valid stems per box.");
      return;
    }

    if (!editingProductId) {
      const allAddedProducts = readAddedProducts();

      const newSlugBase = slugify(form.name);
      const slugExists = allAddedProducts.some(
        (p) => p.slug === newSlugBase && p.grower === currentGrower
      );

      const newProduct: ProductRecord = {
        ...buildFormProduct(),
        slug: slugExists ? `${newSlugBase}-${Date.now()}` : newSlugBase,
      };

      saveAddedProducts([...allAddedProducts, newProduct]);
      loadAllData();
      resetForm();
      alert("Product added successfully.");
      return;
    }

    if (editingSourceType === "added") {
      const allAddedProducts = readAddedProducts();

      const updatedProducts = allAddedProducts.map((product) =>
        product.id === editingProductId
          ? {
              ...product,
              ...buildFormProduct(editingProductId),
              isActive: product.isActive !== false,
            }
          : product
      );

      saveAddedProducts(updatedProducts);
      loadAllData();
      resetForm();
      alert("Added product updated successfully.");
      return;
    }

    if (editingSourceType === "base") {
      const baseProducts = getBaseGrowerProducts(currentGrower);
      const baseProduct = baseProducts.find((product) => product.id === editingProductId);

      if (!baseProduct) {
        alert("Base product not found.");
        return;
      }

      const allOverrides = readProductOverrides();
      const overridePayload: ProductRecord = {
        ...baseProduct,
        ...buildFormProduct(editingProductId),
        grower: currentGrower,
      };

      const existingIndex = allOverrides.findIndex(
        (product) =>
          product.grower === currentGrower &&
          ((product.id && product.id === editingProductId) ||
            (product.slug && product.slug === baseProduct.slug))
      );

      const updatedOverrides =
        existingIndex >= 0
          ? allOverrides.map((item, index) =>
              index === existingIndex ? overridePayload : item
            )
          : [...allOverrides, overridePayload];

      saveProductOverrides(updatedOverrides);
      loadAllData();
      resetForm();
      alert("Base product override saved successfully.");
    }
  }

  function toggleProductStatus(product: ManagedProduct) {
    if (product.sourceType === "added") {
      const allAddedProducts = readAddedProducts();

      const updatedProducts = allAddedProducts.map((item) =>
        item.id === product.id
          ? { ...item, isActive: item.isActive === false ? true : false }
          : item
      );

      saveAddedProducts(updatedProducts);
      loadAllData();
      return;
    }

    const allOverrides = readProductOverrides();
    const baseProducts = getBaseGrowerProducts(currentGrower);
    const baseProduct = baseProducts.find((item) => item.id === product.id);

    if (!baseProduct) return;

    const targetStatus = product.isActive === false ? true : false;

    const overridePayload: ProductRecord = {
      ...baseProduct,
      ...product,
      grower: currentGrower,
      isActive: targetStatus,
    };

    const existingIndex = allOverrides.findIndex(
      (item) =>
        item.grower === currentGrower &&
        ((item.id && item.id === product.id) ||
          (item.slug && item.slug === product.slug))
    );

    const updatedOverrides =
      existingIndex >= 0
        ? allOverrides.map((item, index) =>
            index === existingIndex ? overridePayload : item
          )
        : [...allOverrides, overridePayload];

    saveProductOverrides(updatedOverrides);
    loadAllData();
  }

  function deleteProduct(product: ManagedProduct) {
    const confirmed = window.confirm(`Delete product "${product.name}"?`);
    if (!confirmed) return;

    if (product.sourceType === "added") {
      const allAddedProducts = readAddedProducts();
      const updatedProducts = allAddedProducts.filter((item) => item.id !== product.id);
      saveAddedProducts(updatedProducts);
      loadAllData();

      if (editingProductId === product.id) {
        resetForm();
      }
      return;
    }

    alert("Base products cannot be deleted. You can deactivate them instead.");
  }

  function upsertCategoryOverride(payload: CategoryOverrideRecord) {
    const allOverrides = safeRead<CategoryOverrideRecord[]>("growerCategoryOverrides", []);
    const existingIndex = allOverrides.findIndex(
      (item) =>
        item.grower === currentGrower &&
        (
          (payload.originalSlug && item.originalSlug === payload.originalSlug) ||
          (payload.originalName && item.originalName?.toLowerCase() === payload.originalName.toLowerCase())
        )
    );

    const updated =
      existingIndex >= 0
        ? allOverrides.map((item, index) => (index === existingIndex ? payload : item))
        : [...allOverrides, payload];

    saveCategoryOverrides(updated);
  }

  function handleAddCategory() {
    if (!newCategory.trim()) {
      alert("Please enter category name.");
      return;
    }

    const normalizedName = newCategory.toLowerCase().trim();
    const allCategories = readCategories();
    const newSlug = slugify(normalizedName);

    const exists = allCategories.some(
      (category) => category.slug === newSlug && category.grower === currentGrower
    );

    if (exists) {
      alert("Category already exists.");
      return;
    }

    const newRecord: CategoryRecord = {
      id: `cat-${Date.now()}`,
      name: normalizedName,
      slug: newSlug,
      grower: currentGrower,
      sourceType: "added",
    };

    saveCategories([...allCategories, newRecord]);
    setNewCategory("");
    loadAllData();
  }

  function startEditCategory(category: CategoryRecord) {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  }

  function cancelEditCategory() {
    setEditingCategoryId(null);
    setEditingCategoryName("");
  }

  function saveEditedCategory() {
    if (!editingCategoryId) return;

    const trimmedName = editingCategoryName.toLowerCase().trim();
    if (!trimmedName) {
      alert("Please enter category name.");
      return;
    }

    const category = categories.find((c) => c.id === editingCategoryId);
    if (!category) return;

    const newSlug = slugify(trimmedName);

    if (category.sourceType === "added") {
      const allCategories = readCategories();
      const duplicate = allCategories.some(
        (item) =>
          item.id !== editingCategoryId &&
          item.grower === currentGrower &&
          item.slug === newSlug
      );

      if (duplicate) {
        alert("Another category with this name already exists.");
        return;
      }

      const updatedCategories = allCategories.map((item) =>
        item.id === editingCategoryId
          ? { ...item, name: trimmedName, slug: newSlug }
          : item
      );

      saveCategories(updatedCategories);

      const allAddedProducts = readAddedProducts().map((product) =>
        product.grower === currentGrower && product.category === category.name
          ? { ...product, category: trimmedName }
          : product
      );
      saveAddedProducts(allAddedProducts);

      const allOverrides = readProductOverrides().map((product) =>
        product.grower === currentGrower && product.category === category.name
          ? { ...product, category: trimmedName }
          : product
      );
      saveProductOverrides(allOverrides);

      loadAllData();
      cancelEditCategory();

      if (form.category === category.name) {
        updateForm("category", trimmedName);
      }
      return;
    }

    upsertCategoryOverride({
      id: `cat-override-${Date.now()}`,
      grower: currentGrower,
      originalSlug: category.originalSlug || category.slug,
      originalName: category.originalName || category.name,
      name: trimmedName,
      slug: newSlug,
      mergedTo: undefined,
      isHidden: false,
    });

    loadAllData();
    cancelEditCategory();

    if (form.category === category.name) {
      updateForm("category", trimmedName);
    }
  }

  function startMergeCategory(category: CategoryRecord) {
    setMergingCategoryId(category.id);
    setMergeTargetCategory("");
  }

  function cancelMergeCategory() {
    setMergingCategoryId(null);
    setMergeTargetCategory("");
  }

  function confirmMergeCategory() {
    if (!mergingCategoryId) return;

    const category = categories.find((c) => c.id === mergingCategoryId);
    if (!category) return;

    const target = mergeTargetCategory.toLowerCase().trim();
    if (!target) {
      alert("Please select target category.");
      return;
    }

    if (target === category.name) {
      alert("Target category must be different.");
      return;
    }

    if (category.sourceType === "added") {
      const updatedCategories = readCategories().filter((c) => c.id !== category.id);
      saveCategories(updatedCategories);

      const updatedAddedProducts = readAddedProducts().map((product) =>
        product.grower === currentGrower && product.category === category.name
          ? { ...product, category: target }
          : product
      );
      saveAddedProducts(updatedAddedProducts);

      const updatedOverrides = readProductOverrides().map((product) =>
        product.grower === currentGrower && product.category === category.name
          ? { ...product, category: target }
          : product
      );
      saveProductOverrides(updatedOverrides);
    } else {
      upsertCategoryOverride({
        id: `cat-override-${Date.now()}`,
        grower: currentGrower,
        originalSlug: category.originalSlug || category.slug,
        originalName: category.originalName || category.name,
        name: target,
        slug: slugify(target),
        mergedTo: target,
        isHidden: false,
      });
    }

    loadAllData();
    cancelMergeCategory();

    if (form.category === category.name) {
      updateForm("category", target);
    }
  }

  function toggleHideCategory(category: CategoryRecord) {
    if (category.sourceType === "added") {
      const linkedProducts = products.filter((p) => p.category === category.name);
      if (linkedProducts.length > 0) {
        alert("Added categories with linked products should be merged or emptied first.");
        return;
      }

      const confirmed = window.confirm(`Delete added category "${category.name}"?`);
      if (!confirmed) return;

      const updatedCategories = readCategories().filter((c) => c.id !== category.id);
      saveCategories(updatedCategories);
      loadAllData();
      return;
    }

    const existingOverrides = getCategoryOverrides(currentGrower);
    const existing = existingOverrides.find(
      (item) =>
        (category.originalSlug && item.originalSlug === category.originalSlug) ||
        (category.originalName &&
          item.originalName?.toLowerCase() === category.originalName.toLowerCase())
    );

    upsertCategoryOverride({
      id: existing?.id || `cat-override-${Date.now()}`,
      grower: currentGrower,
      originalSlug: category.originalSlug || category.slug,
      originalName: category.originalName || category.name,
      name: category.name,
      slug: category.slug,
      mergedTo: category.mergedTo,
      isHidden: !category.isHidden,
    });

    loadAllData();
  }

  function deleteCategory(categoryId: string) {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    if (category.sourceType !== "added") {
      alert("Base categories cannot be deleted permanently. Use Merge or Hide.");
      return;
    }

    const linkedProducts = products.filter((p) => p.category === category.name);
    if (linkedProducts.length > 0) {
      alert("Cannot delete category because products are linked to it.");
      return;
    }

    const confirmed = window.confirm(`Delete category "${category.name}"?`);
    if (!confirmed) return;

    const allCategories = readCategories();
    const updatedCategories = allCategories.filter((c) => c.id !== categoryId);
    saveCategories(updatedCategories);
    loadAllData();

    if (form.category === category.name) {
      updateForm("category", "");
    }
  }

  return (
    <section style={pageStyle}>
      <div style={headerRowStyle}>
        <div>
          <p style={eyebrowStyle}>Grower Admin</p>
          <h1 style={titleStyle}>Grower Dashboard</h1>
          <p style={subtitleStyle}>
            Signed in as: <strong>{currentGrower}</strong>
          </p>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("grower");
            window.location.href = "/grower-login";
          }}
          style={logoutButtonStyle}
        >
          Logout
        </button>
      </div>

      <div style={tabsRowStyle}>
        <button
          onClick={() => setActiveTab("overview")}
          style={tabButtonStyle(activeTab === "overview")}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab("products")}
          style={tabButtonStyle(activeTab === "products")}
        >
          Products
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          style={tabButtonStyle(activeTab === "orders")}
        >
          Orders
        </button>
      </div>

      {activeTab === "overview" && (
        <div style={{ display: "grid", gap: "24px" }}>
          <div style={statsGridStyle}>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Total Products</div>
              <div style={statValueStyle}>{stats.totalProducts}</div>
            </div>

            <div style={statCardStyle}>
              <div style={statLabelStyle}>Active Products</div>
              <div style={statValueStyle}>{stats.activeProducts}</div>
            </div>

            <div style={statCardStyle}>
              <div style={statLabelStyle}>Pending Orders</div>
              <div style={statValueStyle}>{stats.pendingOrders}</div>
            </div>

            <div style={statCardStyle}>
              <div style={statLabelStyle}>Total Boxes Ordered</div>
              <div style={statValueStyle}>{stats.totalBoxes}</div>
            </div>

            <div style={statCardStyle}>
              <div style={statLabelStyle}>Total Stems</div>
              <div style={statValueStyle}>{stats.totalStems}</div>
            </div>

            <div style={statCardStyle}>
              <div style={statLabelStyle}>Order Value</div>
              <div style={statValueStyle}>{formatMoney(stats.totalAmount)}</div>
            </div>

            <div style={statCardStyle}>
              <div style={statLabelStyle}>Categories</div>
              <div style={statValueStyle}>{stats.totalCategories}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div style={{ display: "grid", gap: "20px" }}>
          <div style={panelStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>Categories</h2>
                <p style={sectionSubtitleStyle}>
                  Full category control: add, rename, merge, hide, delete added.
                </p>
              </div>
            </div>

            <div style={categoryAddRowStyle}>
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category name"
                style={inputStyle}
              />

              <button style={primaryButtonStyle} onClick={handleAddCategory}>
                Add Category
              </button>
            </div>

            {categories.length === 0 ? (
              <div style={{ ...emptyStateStyle, marginTop: "14px" }}>
                No categories yet.
              </div>
            ) : (
              <div style={categoryListStyle}>
                {categories.map((category) => {
                  const linkedCount = products.filter(
                    (product) => product.category === category.name
                  ).length;

                  const isEditing = editingCategoryId === category.id;
                  const isMerging = mergingCategoryId === category.id;

                  return (
                    <div key={category.id} style={categoryCardStyle}>
                      <div style={{ display: "grid", gap: "6px", flex: 1 }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                          <div style={categoryTitleStyle}>{category.name}</div>
                          <span style={sourceBadgeStyle(category.sourceType === "added" ? "added" : "base")}>
                            {category.sourceType === "added"
                              ? "Added Category"
                              : category.sourceType === "override"
                              ? "Overridden Category"
                              : "Base Category"}
                          </span>
                          {category.isHidden ? (
                            <span style={hiddenBadgeStyle}>Hidden</span>
                          ) : null}
                          {category.mergedTo ? (
                            <span style={mergedBadgeStyle}>Merged to: {category.mergedTo}</span>
                          ) : null}
                        </div>

                        <div style={categoryMetaStyle}>
                          {linkedCount} product{linkedCount === 1 ? "" : "s"}
                        </div>

                        {isEditing ? (
                          <div style={{ display: "grid", gap: "10px", maxWidth: "420px" }}>
                            <input
                              value={editingCategoryName}
                              onChange={(e) => setEditingCategoryName(e.target.value)}
                              style={inputStyle}
                            />
                            <div style={categoryActionsStyle}>
                              <button
                                style={secondaryButtonStyle}
                                onClick={cancelEditCategory}
                              >
                                Cancel
                              </button>

                              <button
                                style={primaryButtonStyle}
                                onClick={saveEditedCategory}
                              >
                                Save Rename
                              </button>
                            </div>
                          </div>
                        ) : null}

                        {isMerging ? (
                          <div style={{ display: "grid", gap: "10px", maxWidth: "420px" }}>
                            <select
                              value={mergeTargetCategory}
                              onChange={(e) => setMergeTargetCategory(e.target.value)}
                              style={inputStyle}
                            >
                              <option value="">Select target category</option>
                              {availableCategories
                                .filter((item) => item !== category.name)
                                .map((item) => (
                                  <option key={item} value={item}>
                                    {item}
                                  </option>
                                ))}
                            </select>

                            <div style={categoryActionsStyle}>
                              <button
                                style={secondaryButtonStyle}
                                onClick={cancelMergeCategory}
                              >
                                Cancel
                              </button>

                              <button
                                style={primaryButtonStyle}
                                onClick={confirmMergeCategory}
                              >
                                Confirm Merge
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {!isEditing && !isMerging ? (
                        <div style={categoryActionsStyle}>
                          <button
                            style={secondaryButtonStyle}
                            onClick={() => startEditCategory(category)}
                          >
                            Rename
                          </button>

                          <button
                            style={secondaryButtonStyle}
                            onClick={() => startMergeCategory(category)}
                          >
                            Merge
                          </button>

                          <button
                            style={secondaryButtonStyle}
                            onClick={() => toggleHideCategory(category)}
                          >
                            {category.isHidden ? "Unhide" : category.sourceType === "added" ? "Delete Added" : "Hide"}
                          </button>

                          <button
                            style={dangerGhostButtonStyle}
                            onClick={() => deleteCategory(category.id)}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={panelStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>
                  {editingProductId ? "Edit Product" : "Add Product"}
                </h2>
                <p style={sectionSubtitleStyle}>
                  Base products create overrides. New products are stored as added products.
                </p>
              </div>

              {!showForm ? (
                <button style={primaryButtonStyle} onClick={openAddForm}>
                  + Add Product
                </button>
              ) : (
                <button style={secondaryButtonStyle} onClick={resetForm}>
                  Close Form
                </button>
              )}
            </div>

            {showForm && (
              <div style={formPanelStyle}>
                <div style={formGridStyle}>
                  <div style={fieldBlockStyle}>
                    <label style={labelStyle}>Product Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => updateForm("name", e.target.value)}
                      placeholder="Premium Roses"
                      style={inputStyle}
                    />
                  </div>

                  <div style={fieldBlockStyle}>
                    <label style={labelStyle}>Category</label>
                    {availableCategories.length > 0 ? (
                      <select
                        value={form.category}
                        onChange={(e) => updateForm("category", e.target.value)}
                        style={inputStyle}
                      >
                        <option value="">Select category</option>
                        {availableCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={form.category}
                        onChange={(e) => updateForm("category", e.target.value)}
                        placeholder="flowers"
                        style={inputStyle}
                      />
                    )}
                  </div>

                  <div style={fieldBlockStyle}>
                    <label style={labelStyle}>Fallback Price / Stem</label>
                    <input
                      type="number"
                      min={0}
                      value={form.price}
                      onChange={(e) => updateForm("price", e.target.value)}
                      placeholder="0.45"
                      style={inputStyle}
                    />
                  </div>

                  <div style={fieldBlockStyle}>
                    <label style={labelStyle}>Box Type</label>
                    <select
                      value={form.boxType}
                      onChange={(e) => updateForm("boxType", e.target.value as BoxType)}
                      style={inputStyle}
                    >
                      {BOX_TYPES.map((boxType) => (
                        <option key={boxType} value={boxType}>
                          {boxType}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={fieldBlockStyle}>
                    <label style={labelStyle}>Stems / Box</label>
                    <input
                      type="number"
                      min={1}
                      value={form.stemsPerBox}
                      onChange={(e) => updateForm("stemsPerBox", e.target.value)}
                      placeholder="25"
                      style={inputStyle}
                    />
                  </div>

                  <div style={fieldBlockStyle}>
                    <label style={labelStyle}>Box Price (Auto)</label>
                    <div style={readonlyInfoStyle}>
                      {formatMoney(getPrimaryLengthData(form).primaryPrice * Number(form.stemsPerBox || 0))}
                    </div>
                  </div>

                  <div style={fieldBlockStyle}>
                    <label style={labelStyle}>Lengths & Prices</label>
                    <textarea
                      value={form.lengthsText}
                      onChange={(e) => updateForm("lengthsText", e.target.value)}
                      placeholder={"40cm:0.45\n50cm:0.55\n60cm:0.65"}
                      style={textareaStyle}
                    />
                  </div>

                  <div style={fieldBlockStyle}>
                    <label style={labelStyle}>Packing</label>
                    <input
                      value={form.packing}
                      onChange={(e) => updateForm("packing", e.target.value)}
                      placeholder="10 stems"
                      style={inputStyle}
                    />
                  </div>

                  <div style={fieldBlockStyle}>
                    <label style={labelStyle}>Upload Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={fileInputStyle}
                    />
                  </div>
                </div>

                <div style={helperNoteStyle}>
                  Enter one length per line using the format: <strong>40cm:0.45</strong>
                </div>

                <div style={fieldBlockStyle}>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    placeholder="Product description"
                    style={textareaStyle}
                  />
                </div>

                {form.image && (
                  <div style={{ marginTop: "18px" }}>
                    <div style={labelStyle}>Image Preview</div>
                    <div style={previewWrapStyle}>
                      <img src={form.image} alt="Preview" style={previewImageStyle} />
                    </div>
                  </div>
                )}

                <div style={formActionsStyle}>
                  <button style={secondaryButtonStyle} onClick={resetForm}>
                    Cancel
                  </button>

                  <button style={primaryButtonStyle} onClick={handleSaveProduct}>
                    {editingProductId ? "Save Changes" : "Save Product"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={panelStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>Browse Products</h2>
                <p style={sectionSubtitleStyle}>
                  Filter by category and switch between different admin views.
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ ...inputStyle, minWidth: "220px" }}
                >
                  <option value="">All Categories</option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  value={productViewMode}
                  onChange={(e) => setProductViewMode(e.target.value as ProductViewMode)}
                  style={{ ...inputStyle, minWidth: "220px" }}
                >
                  <option value="cards">Cards View</option>
                  <option value="sidebar">Sidebar View</option>
                  <option value="grouped">Grouped View</option>
                </select>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div style={emptyStateStyle}>No products found for this selection.</div>
            ) : productViewMode === "cards" ? (
              <div style={productsGridStyle}>
                {filteredProducts.map((product) => (
                  <div key={product.id} style={productCardStyle}>
                    <div style={productImageWrapStyle}>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          style={productImageStyle}
                        />
                      ) : (
                        <div style={imagePlaceholderStyle}>No Image</div>
                      )}
                    </div>

                    <div style={{ padding: "18px" }}>
                      <div style={productTopRowStyle}>
                        <div>
                          <h3 style={productTitleStyle}>{product.name}</h3>
                          <div style={sourceBadgeStyle(product.sourceType)}>
                            {product.sourceType === "base" ? "Base Product" : "Added Product"}
                          </div>
                        </div>

                        <span style={statusBadgeStyle(product.isActive !== false)}>
                          {product.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <p style={productDescStyle}>
                        {product.description || "No description"}
                      </p>

                      <div style={metaGridStyle}>
                        <div style={metaBoxStyle}>
                          <div style={metaLabelStyle}>Category</div>
                          <div style={metaValueStyle}>{product.category}</div>
                        </div>

                        <div style={metaBoxStyle}>
                          <div style={metaLabelStyle}>Box Type</div>
                          <div style={metaValueStyle}>{product.boxType}</div>
                        </div>

                        <div style={metaBoxStyle}>
                          <div style={metaLabelStyle}>Stems / Box</div>
                          <div style={metaValueStyle}>{product.stemsPerBox}</div>
                        </div>

                        <div style={metaBoxStyle}>
                          <div style={metaLabelStyle}>Price / Stem</div>
                          <div style={metaValueStyle}>{formatMoney(product.price)}</div>
                        </div>

                        <div style={metaBoxStyle}>
                          <div style={metaLabelStyle}>Price / Box</div>
                          <div style={metaValueStyle}>
                            {formatMoney(getBoxPriceFromProduct(product))}
                          </div>
                        </div>

                        <div style={{ ...metaBoxStyle, gridColumn: "1 / -1" }}>
                          <div style={metaLabelStyle}>Lengths</div>
                          <div style={metaValueStyle}>
                            {normalizeProductLengths(product).length > 0
                              ? normalizeProductLengths(product)
                                  .map((entry) => `${entry.length} (${formatMoney(entry.price)})`)
                                  .join(" • ")
                              : product.length || "-"}
                          </div>
                        </div>
                      </div>

                      <div style={productActionsRowStyle}>
                        <button
                          style={secondaryButtonStyle}
                          onClick={() => openEditForm(product)}
                        >
                          Edit
                        </button>

                        <button
                          style={secondaryButtonStyle}
                          onClick={() => toggleProductStatus(product)}
                        >
                          {product.isActive !== false ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          style={dangerGhostButtonStyle}
                          onClick={() => deleteProduct(product)}
                        >
                          {product.sourceType === "added" ? "Delete" : "Disable Instead"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : productViewMode === "sidebar" ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "260px 1fr",
                  gap: "18px",
                  alignItems: "start",
                }}
              >
                <aside
                  style={{
                    border: "1px solid #ececec",
                    borderRadius: "16px",
                    padding: "14px",
                    background: "#fafafa",
                    display: "grid",
                    gap: "8px",
                  }}
                >
                  <button
                    onClick={() => setSelectedCategory("")}
                    style={{
                      ...secondaryButtonStyle,
                      textAlign: "left",
                      background: selectedCategory === "" ? "#eef8df" : "#fff",
                      border:
                        selectedCategory === ""
                          ? "1px solid #7dbb2f"
                          : "1px solid #dfdfdf",
                    }}
                  >
                    All Categories
                  </button>

                  {availableCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      style={{
                        ...secondaryButtonStyle,
                        textAlign: "left",
                        background:
                          selectedCategory === category ? "#eef8df" : "#fff",
                        border:
                          selectedCategory === category
                            ? "1px solid #7dbb2f"
                            : "1px solid #dfdfdf",
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </aside>

                <div style={{ display: "grid", gap: "14px" }}>
{filteredProducts.map((product) => (
  <div key={product.id} style={sidebarRowStyle}>
    <div style={sidebarContentStyle}>
      <div style={sidebarThumbWrapStyle}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            style={sidebarThumbImageStyle}
          />
        ) : (
          <div style={sidebarThumbPlaceholderStyle}>No Image</div>
        )}
      </div>

      <div style={sidebarInfoStyle}>
        <div style={sidebarTitleStyle}>{product.name}</div>
        <div style={sidebarMetaStyle}>Category: {product.category}</div>
        <div style={sidebarMetaStyle}>
          Stem Price: {formatMoney(product.price)} • Stems / Box: {product.stemsPerBox}
        </div>
        <div style={sidebarMetaStyle}>
          Box Price: {formatMoney(getBoxPriceFromProduct(product))}
        </div>
        <div style={sidebarMetaStyle}>
          Lengths: {normalizeProductLengths(product).length > 0
            ? normalizeProductLengths(product)
                .map((entry) => `${entry.length} (${formatMoney(entry.price)})`)
                .join(" • ")
            : product.length || "-"}
        </div>
      </div>
    </div>

    <div style={productActionsRowStyle}>
      <button
        style={secondaryButtonStyle}
        onClick={() => openEditForm(product)}
      >
        Edit
      </button>

      <button
        style={secondaryButtonStyle}
        onClick={() => toggleProductStatus(product)}
      >
        {product.isActive !== false ? "Deactivate" : "Activate"}
      </button>
    </div>
  </div>
))}
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "20px" }}>
                {groupedProducts
                  .filter((group) => !selectedCategory || group.category === selectedCategory)
                  .map((group) => (
                    <div key={group.category} style={groupPanelStyle}>
                      <div style={groupTitleStyle}>{group.category}</div>

                      {group.products.length === 0 ? (
                        <div style={{ color: "#777" }}>No products in this category.</div>
                      ) : (
                        <div style={{ display: "grid", gap: "12px" }}>
                          {group.products.map((product) => (
                            <div key={product.id} style={sidebarRowStyle}>
                              <div style={sidebarInfoStyle}>
                                <div style={sidebarTitleStyle}>{product.name}</div>
                                <div style={sidebarMetaStyle}>
                                  Stem Price: {formatMoney(product.price)} • Stems / Box: {product.stemsPerBox}
                                </div>
                                <div style={sidebarMetaStyle}>
                                  Box Price: {formatMoney(getBoxPriceFromProduct(product))}
                                </div>
                                <div style={sidebarMetaStyle}>
                                  Lengths: {normalizeProductLengths(product).length > 0
                                    ? normalizeProductLengths(product)
                                        .map((entry) => `${entry.length} (${formatMoney(entry.price)})`)
                                        .join(" • ")
                                    : product.length || "-"}
                                </div>
                              </div>

                              <div style={productActionsRowStyle}>
                                <button
                                  style={secondaryButtonStyle}
                                  onClick={() => openEditForm(product)}
                                >
                                  Edit
                                </button>

                                <button
                                  style={secondaryButtonStyle}
                                  onClick={() => toggleProductStatus(product)}
                                >
                                  {product.isActive !== false ? "Deactivate" : "Activate"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Orders</h2>
              <p style={sectionSubtitleStyle}>
                Review only the orders assigned to your grower account.
              </p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div style={emptyStateStyle}>No grower orders available.</div>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {orders.map((order) => {
                const totalStems = order.items.reduce(
                  (sum, item) => sum + (item.totalStems || 0),
                  0
                );

                const totalBoxes = order.items.reduce(
                  (sum, item) => sum + (item.boxes || 0),
                  0
                );

                const totalAmount = order.items.reduce(
                  (sum, item) => sum + getLineTotal(item),
                  0
                );

                return (
                  <div
  key={order.id}
  style={{ ...orderPanelStyle, cursor: "pointer" }}
  onClick={() => navigate(`/grower/orders/${order.id}`)}
>
                    <div style={orderHeaderStyle}>
<div>
  <h3 style={orderPanelTitleStyle}>{order.id}</h3>
  <p style={orderPanelSubtitleStyle}>
    Customer: {order.customer?.name || "Unknown"}
  </p>
  <p style={orderPanelMetaStyle}>
    Created: {formatDate(order.createdAt)}
  </p>
</div>

                      <div style={orderStatusBadgeStyle(order.status)}>
                        {formatStatus(order.status)}
                      </div>
                    </div>

                    <div style={orderSummaryGridStyle}>
                      <div style={metaBoxStyle}>
                        <div style={metaLabelStyle}>Items</div>
                        <div style={metaValueStyle}>{order.items.length}</div>
                      </div>

                      <div style={metaBoxStyle}>
                        <div style={metaLabelStyle}>Boxes</div>
                        <div style={metaValueStyle}>{totalBoxes}</div>
                      </div>

                      <div style={metaBoxStyle}>
                        <div style={metaLabelStyle}>Total Stems</div>
                        <div style={metaValueStyle}>{totalStems}</div>
                      </div>

<div style={metaBoxStyle}>
  <div style={metaLabelStyle}>Requested Delivery</div>
  <div style={metaValueStyle}>{formatDate(order.deliveryDate)}</div>
</div>

                      <div style={metaBoxStyle}>
                        <div style={metaLabelStyle}>Total Value</div>
                        <div style={metaValueStyle}>{formatMoney(totalAmount)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

const readonlyInfoStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #d9d9d9",
  background: "#f8fafc",
  color: "#111827",
  fontWeight: 700,
};

const hiddenBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "5px 10px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 800,
  background: "#f8eaea",
  color: "#a33",
};

const mergedBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "5px 10px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 800,
  background: "#eef8df",
  color: "#2d4f08",
};

const sidebarRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  padding: "16px",
  border: "1px solid #ececec",
  borderRadius: "14px",
  background: "#fff",
  flexWrap: "wrap",
};

const sidebarInfoStyle: React.CSSProperties = {
  display: "grid",
  gap: "6px",
};

const sidebarTitleStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 800,
  color: "#222",
};

const sidebarMetaStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#666",
};

const groupPanelStyle: React.CSSProperties = {
  border: "1px solid #ececec",
  borderRadius: "18px",
  padding: "18px",
  background: "#fafafa",
  display: "grid",
  gap: "14px",
};

const groupTitleStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 800,
  color: "#1f1f1f",
  textTransform: "capitalize",
};

const pageStyle: React.CSSProperties = {
  maxWidth: "1320px",
  margin: "0 auto",
  padding: "48px 24px 80px",
};

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  marginBottom: "28px",
};

const eyebrowStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#7dbb2f",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "40px",
  color: "#1f1f1f",
};

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#666",
  fontSize: "15px",
};

const logoutButtonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "1px solid #e2e2e2",
  background: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const tabsRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginBottom: "28px",
};

function tabButtonStyle(active: boolean): React.CSSProperties {
  return {
    padding: "12px 18px",
    borderRadius: "999px",
    border: active ? "1px solid #7dbb2f" : "1px solid #e3e3e3",
    background: active ? "#eef8df" : "#fff",
    color: active ? "#2d4f08" : "#444",
    fontWeight: 700,
    cursor: "pointer",
  };
}

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
};

const statCardStyle: React.CSSProperties = {
  border: "1px solid #ececec",
  borderRadius: "18px",
  padding: "22px",
  background: "#fff",
  boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
};

const statLabelStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#777",
  marginBottom: "8px",
};

const statValueStyle: React.CSSProperties = {
  fontSize: "30px",
  fontWeight: 800,
  color: "#1f1f1f",
};

const panelStyle: React.CSSProperties = {
  border: "1px solid #ececec",
  borderRadius: "20px",
  padding: "24px",
  background: "#fff",
  boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "22px",
  flexWrap: "wrap",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 6px",
  fontSize: "24px",
  color: "#1f1f1f",
};

const sectionSubtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#6d6d6d",
  fontSize: "14px",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "12px",
  border: "none",
  background: "#7dbb2f",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #dfdfdf",
  background: "#fff",
  color: "#222",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerGhostButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #f0d0d0",
  background: "#fff",
  color: "#b33a3a",
  fontWeight: 700,
  cursor: "pointer",
};

const emptyStateStyle: React.CSSProperties = {
  padding: "30px",
  border: "1px dashed #dddddd",
  borderRadius: "14px",
  color: "#777",
  textAlign: "center",
  background: "#fafafa",
};

const productsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "18px",
};

const productCardStyle: React.CSSProperties = {
  border: "1px solid #ececec",
  borderRadius: "18px",
  overflow: "hidden",
  background: "#fff",
  boxShadow: "0 8px 22px rgba(0,0,0,0.04)",
};

const productImageWrapStyle: React.CSSProperties = {
  height: "220px",
  background: "#f4f4f4",
};

const productImageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const imagePlaceholderStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#888",
  fontWeight: 700,
};

const productTopRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "flex-start",
  marginBottom: "10px",
};

const productTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "22px",
  color: "#1f1f1f",
};

const sidebarContentStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  minWidth: 0,
  flex: 1,
};

const sidebarThumbWrapStyle: React.CSSProperties = {
  width: "72px",
  height: "72px",
  minWidth: "72px",
  borderRadius: "12px",
  overflow: "hidden",
  border: "1px solid #e8e8e8",
  background: "#f5f5f5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const sidebarThumbImageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const sidebarThumbPlaceholderStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#888",
  fontWeight: 700,
  textAlign: "center",
  padding: "6px",
};

function statusBadgeStyle(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
    background: active ? "#eaf7d8" : "#f3f3f3",
    color: active ? "#3f6b0b" : "#666",
    whiteSpace: "nowrap",
  };
}

function sourceBadgeStyle(sourceType: "base" | "added"): React.CSSProperties {
  return {
    display: "inline-flex",
    marginTop: "6px",
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 800,
    background: sourceType === "base" ? "#eef3ff" : "#ecfbef",
    color: sourceType === "base" ? "#1f3c88" : "#267a3f",
  };
}

const productDescStyle: React.CSSProperties = {
  margin: "0 0 14px",
  color: "#666",
  fontSize: "14px",
  lineHeight: 1.7,
};

const metaGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  marginBottom: "16px",
};

const metaBoxStyle: React.CSSProperties = {
  border: "1px solid #ededed",
  borderRadius: "12px",
  padding: "12px",
  background: "#fafafa",
};

const metaLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#777",
  marginBottom: "4px",
};

const metaValueStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 800,
  color: "#222",
};

const productActionsRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const orderPanelStyle: React.CSSProperties = {
  border: "1px solid #ececec",
  borderRadius: "18px",
  padding: "18px",
  background: "#fff",
};

const orderHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "16px",
};

const orderPanelTitleStyle: React.CSSProperties = {
  margin: "0 0 6px",
  fontSize: "20px",
  color: "#1f1f1f",
};

const orderPanelSubtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#666",
  fontSize: "14px",
};

const orderPanelMetaStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#777",
  fontSize: "13px",
};

function orderStatusBadgeStyle(status: string): React.CSSProperties {
  const isPending = status === "pending_review";
  const isApproved = status === "approved";

  return {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
    background: isApproved ? "#e8f7da" : isPending ? "#fff4d8" : "#f0f0f0",
    color: isApproved ? "#39710b" : isPending ? "#8a6700" : "#555",
    whiteSpace: "nowrap",
  };
}

const orderSummaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
  marginBottom: "16px",
};

const formPanelStyle: React.CSSProperties = {
  border: "1px solid #ececec",
  borderRadius: "18px",
  padding: "20px",
  background: "#fafafa",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const fieldBlockStyle: React.CSSProperties = {
  display: "grid",
  gap: "8px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#444",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #d9d9d9",
  background: "#fff",
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "110px",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #d9d9d9",
  background: "#fff",
  outline: "none",
  resize: "vertical",
};

const helperNoteStyle: React.CSSProperties = {
  marginTop: "14px",
  marginBottom: "14px",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #dbe7ff",
  background: "#f8fbff",
  color: "#35518f",
  fontSize: "13px",
  lineHeight: 1.7,
};

const fileInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  borderRadius: "10px",
  border: "1px solid #d9d9d9",
  background: "#fff",
};

const previewWrapStyle: React.CSSProperties = {
  width: "220px",
  height: "220px",
  borderRadius: "16px",
  overflow: "hidden",
  border: "1px solid #e6e6e6",
  background: "#fff",
};

const previewImageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const formActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "18px",
  flexWrap: "wrap",
};

const categoryAddRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: "12px",
  alignItems: "center",
};

const categoryListStyle: React.CSSProperties = {
  display: "grid",
  gap: "12px",
  marginTop: "16px",
};

const categoryCardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "14px",
  border: "1px solid #ececec",
  borderRadius: "14px",
  padding: "14px",
  background: "#fafafa",
  flexWrap: "wrap",
};

const categoryTitleStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 800,
  color: "#222",
  marginBottom: "4px",
};

const categoryMetaStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#777",
};

const categoryActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};
