import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "diabetes_products_v1";

export type Product = {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  photo?: string; // base64 data URI
  carbsPer100g: number;
  totalWeight: number;
  favorite: boolean;
  cookingEnabled?: boolean;
  cookingFactor?: number;
  createdAt: number;
  updatedAt: number;
};

export async function getProducts(): Promise<Product[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Product[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function saveProducts(products: Product[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(products));
}

export async function addProduct(
  p: Omit<Product, "id" | "createdAt" | "updatedAt" | "favorite"> & {
    favorite?: boolean;
  }
): Promise<Product> {
  const products = await getProducts();
  const now = Date.now();
  const newP: Product = {
    ...p,
    id: `${now}-${Math.random().toString(36).slice(2, 9)}`,
    favorite: p.favorite ?? false,
    createdAt: now,
    updatedAt: now,
  };
  products.unshift(newP);
  await saveProducts(products);
  return newP;
}

export async function updateProduct(
  id: string,
  patch: Partial<Product>
): Promise<Product | null> {
  const products = await getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const updated: Product = {
    ...products[idx],
    ...patch,
    id: products[idx].id,
    updatedAt: Date.now(),
  };
  products[idx] = updated;
  await saveProducts(products);
  return updated;
}

export async function deleteProduct(id: string): Promise<void> {
  const products = await getProducts();
  await saveProducts(products.filter((p) => p.id !== id));
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.id === id) ?? null;
}
