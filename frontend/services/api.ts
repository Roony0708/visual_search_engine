const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ProductMatch {
  id: string;
  name: string;
  price: number;
  similarity: number;
  image_url: string;
  category: string;
}

export interface SearchResponse {
  query_image: string;
  matches: ProductMatch[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string | null;
  image_path: string;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UploadResponse {
  image_url: string;
  embedding: number[];
  filename: string;
}

export async function searchByImage(
  file: File,
  topK: number = 10
): Promise<SearchResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("top_k", String(topK));

  const res = await fetch(`${API_BASE_URL}/search`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Search failed: ${res.statusText}`);
  }

  return res.json();
}

export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/upload-image`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.statusText}`);
  }

  return res.json();
}

export async function getProducts(
  skip: number = 0,
  limit: number = 20,
  category?: string
): Promise<Product[]> {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });
  if (category) params.set("category", category);

  const res = await fetch(`${API_BASE_URL}/products?${params}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.statusText}`);
  }

  return res.json();
}

export async function getProduct(id: string): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/product/${id}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch product: ${res.statusText}`);
  }

  return res.json();
}

export async function getCategories(): Promise<
  { category: string; count: number }[]
> {
  const res = await fetch(`${API_BASE_URL}/products/categories`);

  if (!res.ok) {
    throw new Error(`Failed to fetch categories: ${res.statusText}`);
  }

  return res.json();
}

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/health`);
  return res.json();
}
