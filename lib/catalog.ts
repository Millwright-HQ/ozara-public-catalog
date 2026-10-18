import 'server-only';
import demo from '../data/demo.json';

export interface CatalogItem {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'ARCHIVED';
  soldOut: boolean;
  brand?: string;
  description: string;
  highlights: string[];
  categories: { id: string; name: string; path: string }[];
  images: { base: string; alt: string; variantId: string | null }[];
  variants: {
    id: string;
    sku: string;
    label: string;
    priceCents: number;
    compareAtCents?: number;
  }[];
  minPriceCents: number;
  maxPriceCents: number;
}

/** Products from the OZARA API. The key stays on the server; the browser only gets the result. */
export async function loadCatalog(): Promise<CatalogItem[]> {
  if (process.env.CATALOG_DEMO === '1') return demo.items as CatalogItem[];
  const url = process.env.CATALOG_API_URL;
  const key = process.env.CATALOG_API_KEY;
  if (!url || !key) throw new Error('CATALOG_API_URL and CATALOG_API_KEY must be set');
  const res = await fetch(url, {
    headers: { accept: 'application/json', 'x-catalog-key': key },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Catalog API answered ${res.status}`);
  return ((await res.json()) as { items: CatalogItem[] }).items;
}
