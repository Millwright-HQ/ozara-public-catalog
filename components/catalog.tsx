'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogItem } from '../lib/catalog';

const money = (cents: number) =>
  `LKR ${(cents / 100).toLocaleString('en-LK', { maximumFractionDigits: 2 })}`;
const priceText = (p: CatalogItem) =>
  p.minPriceCents === p.maxPriceCents
    ? money(p.minPriceCents)
    : `${money(p.minPriceCents)} – ${money(p.maxPriceCents)}`;
const cover = (p: CatalogItem) => p.images.find((i) => !i.variantId) ?? p.images[0];

type Src = (base: string, w: number) => string;

export function Catalog({ items, cdnUrl }: { items: CatalogItem[]; cdnUrl: string }) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const src: Src = (base, w) =>
    base.startsWith('data:') || base.startsWith('http') ? base : `${cdnUrl}/${base}/${w}.webp`;

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of items) for (const c of p.categories) seen.set(c.id, c.path);
    return [...seen].sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((p) => {
      if (category && !p.categories.some((c) => c.id === category)) return false;
      if (!needle) return true;
      return [p.name, p.brand ?? '', ...p.variants.map((v) => v.sku)].some((t) =>
        t.toLowerCase().includes(needle),
      );
    });
  }, [items, q, category]);

  // The open product lives in the URL hash so it can be shared.
  useEffect(() => {
    const sync = () => setOpenSlug(decodeURIComponent(location.hash.slice(1)) || null);
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const current = openSlug ? items.find((p) => p.slug === openSlug) : undefined;

  return (
    <>
      <section className="tools" aria-label="Find products">
        <label className="search">
          <span className="sr">Search products or SKUs</span>
          <input
            type="search"
            placeholder="Search by name, SKU or brand"
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label className="select">
          <span className="sr">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map(([id, path]) => (
              <option key={id} value={id}>
                {path}
              </option>
            ))}
          </select>
        </label>
      </section>
      <p className="count" aria-live="polite">
        {shown.length} of {items.length} products
      </p>
      {shown.length === 0 && <p className="state">No products match your search.</p>}
      <ul className="grid">
        {shown.map((p) => {
          const c = cover(p);
          return (
            <li key={p.id}>
              <button
                type="button"
                className="card"
                onClick={() => {
                  location.hash = p.slug;
                }}
              >
                <div className="pic">
                  {c && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src(c.base, 640)} alt={c.alt || p.name} loading="lazy" />
                  )}
                </div>
                <div className="body">
                  {p.brand && <p className="brand">{p.brand}</p>}
                  <h3>{p.name}</h3>
                  <p className="price">{priceText(p)}</p>
                  <p className="meta">
                    {p.variants.length} SKU{p.variants.length === 1 ? '' : 's'}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      {current && (
        <Detail
          key={current.id}
          p={current}
          src={src}
          onClose={() => {
            history.replaceState(null, '', location.pathname);
            setOpenSlug(null);
          }}
        />
      )}
    </>
  );
}

function Detail({ p, src, onClose }: { p: CatalogItem; src: Src; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(cover(p));

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="d-name"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
    >
      <article>
        <button className="close" aria-label="Close" onClick={() => ref.current?.close()}>
          ×
        </button>
        <div className="d-grid">
          <div className="gallery">
            <div className="stage">
              {active && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src(active.base, 1024)} alt={active.alt || p.name} />
              )}
            </div>
            {p.images.length > 1 && (
              <div className="thumbs">
                {p.images.map((img) => (
                  <button
                    key={img.base}
                    type="button"
                    aria-label={img.alt || 'Photo'}
                    aria-current={img.base === active?.base}
                    onClick={() => setActive(img)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src(img.base, 320)} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="info">
            {p.brand && <p className="brand">{p.brand}</p>}
            <h2 id="d-name">{p.name}</h2>
            <p className="price">{priceText(p)}</p>
            <p className="desc">{p.description}</p>
            {p.highlights.length > 0 && (
              <ul className="highlights">
                {p.highlights.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
            <h3>Also part of</h3>
            <ul className="chips">
              {p.categories.map((c) => (
                <li key={c.id}>{c.path}</li>
              ))}
            </ul>
            <h3>SKUs and prices</h3>
            <table className="skus">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Option</th>
                  <th className="num">Price</th>
                </tr>
              </thead>
              <tbody>
                {p.variants.map((v) => (
                  <tr key={v.id}>
                    <td className="sku">{v.sku}</td>
                    <td>{v.label || '–'}</td>
                    <td className="num">
                      {money(v.priceCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </dialog>
  );
}
