import { Catalog } from '../components/catalog';
import { type CatalogItem, loadCatalog } from '../lib/catalog';

export const revalidate = 60;

export default async function Page() {
  let items: CatalogItem[] = [];
  let failed = false;
  try {
    items = await loadCatalog();
  } catch (e) {
    console.error('catalog load failed', e instanceof Error ? e.message : e);
    failed = true;
  }
  return (
    <>
      <header className="top">
        <div className="wrap top-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src="/logo.svg" alt="OZARA" />
          <span className="tag">Product catalog</span>
        </div>
      </header>
      <main className="wrap">
        {failed ? (
          <p className="state">Could not load the catalog. Please refresh in a moment.</p>
        ) : (
          <Catalog items={items} cdnUrl={process.env.NEXT_PUBLIC_CDN_URL ?? ''} />
        )}
      </main>
    </>
  );
}
