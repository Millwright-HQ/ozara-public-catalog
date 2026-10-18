'use strict';

const cfg = window.CATALOG_CONFIG;
const $ = (id) => document.getElementById(id);
const demo = new URLSearchParams(location.search).has('demo');

let items = [];

// Text only, never innerHTML: product data is shown as plain text.
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...kids.flat().filter((k) => k !== undefined && k !== null && k !== false));
  return el;
}

const money = (cents) =>
  `${cfg.currency} ${(cents / 100).toLocaleString('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const priceText = (p) =>
  p.minPriceCents === p.maxPriceCents
    ? money(p.minPriceCents)
    : `${money(p.minPriceCents)} – ${money(p.maxPriceCents)}`;
const imgUrl = (base, w) => `${demo ? '' : cfg.cdnUrl}/${base}/${w}.webp`;
const imgSrc = (base, w) => (base.startsWith('data:') || base.startsWith('http') ? base : imgUrl(base, w));

function cover(p) {
  return p.images.find((i) => !i.variantId) ?? p.images[0];
}

function showState(text) {
  const el = $('state');
  el.textContent = text;
  el.hidden = !text;
}

function card(p) {
  const c = cover(p);
  return h(
    'li',
    {},
    h(
      'button',
      { class: 'card', type: 'button', onclick: () => open(p) },
      h(
        'div',
        { class: `pic${p.soldOut || p.status === 'ARCHIVED' ? ' faded' : ''}` },
        c && h('img', { src: imgSrc(c.base, 640), alt: c.alt || p.name, loading: 'lazy' }),
        p.soldOut && h('span', { class: 'badge out' }, 'Sold out'),
        p.status === 'ARCHIVED' && h('span', { class: 'badge' }, 'Discontinued'),
      ),
      h(
        'div',
        { class: 'body' },
        p.brand && h('p', { class: 'brand' }, p.brand),
        h('h3', {}, p.name),
        h('p', { class: 'price' }, priceText(p)),
        h('p', { class: 'meta' }, `${p.variants.length} SKU${p.variants.length === 1 ? '' : 's'}`),
      ),
    ),
  );
}

function render() {
  const q = $('q').value.trim().toLowerCase();
  const cat = $('category').value;
  const avail = $('avail').value;
  const shown = items.filter((p) => {
    if (cat && !p.categories.some((c) => c.id === cat)) return false;
    if (avail === 'in' && p.soldOut) return false;
    if (avail === 'out' && !p.soldOut) return false;
    if (!q) return true;
    return [p.name, p.brand ?? '', ...p.variants.map((v) => v.sku)].some((t) =>
      t.toLowerCase().includes(q),
    );
  });
  $('grid').replaceChildren(...shown.map(card));
  $('count').textContent = `${shown.length} of ${items.length} products`;
  showState(shown.length ? '' : 'No products match your search.');
}

function fillCategories() {
  const seen = new Map();
  for (const p of items) for (const c of p.categories) seen.set(c.id, c.path);
  const sorted = [...seen].sort((a, b) => a[1].localeCompare(b[1]));
  $('category').replaceChildren(
    h('option', { value: '' }, 'All categories'),
    ...sorted.map(([id, path]) => h('option', { value: id }, path)),
  );
}

// ── Detail dialog ──────────────────────────────────────────────────────────

function open(p, push = true) {
  $('d-brand').textContent = p.brand ?? '';
  $('d-brand').hidden = !p.brand;
  $('d-name').textContent = p.name;
  $('d-badges').replaceChildren(
    ...[p.soldOut && h('span', { class: 'badge out' }, 'Sold out'), p.status === 'ARCHIVED' && h('span', { class: 'badge' }, 'Discontinued')].filter(Boolean),
  );
  $('d-price').textContent = priceText(p);
  $('d-desc').textContent = p.description;
  $('d-highlights').replaceChildren(...p.highlights.map((t) => h('li', {}, t)));
  $('d-cats').replaceChildren(...p.categories.map((c) => h('li', {}, c.path)));
  $('d-skus').replaceChildren(
    ...p.variants.map((v) =>
      h(
        'tr',
        {},
        h('td', { class: 'sku' }, v.sku),
        h('td', {}, v.label || '–'),
        h(
          'td',
          { class: 'num' },
          v.compareAtCents > v.priceCents && h('s', {}, money(v.compareAtCents)),
          money(v.priceCents),
        ),
      ),
    ),
  );
  const show = (img) => {
    $('d-img').src = imgSrc(img.base, 1024);
    $('d-img').alt = img.alt || p.name;
    for (const b of $('d-thumbs').children) b.setAttribute('aria-current', String(b.dataset.base === img.base));
  };
  $('d-thumbs').replaceChildren(
    ...(p.images.length > 1 ? p.images : []).map((img) =>
      h('button', { type: 'button', 'data-base': img.base, 'aria-label': img.alt || 'Photo', onclick: () => show(img) }, h('img', { src: imgSrc(img.base, 320), alt: '' })),
    ),
  );
  const first = cover(p);
  $('d-img').hidden = !first;
  if (first) show(first);
  if (push) history.replaceState(null, '', `#${p.slug}`);
  if (!$('detail').open) $('detail').showModal();
}

function closeDetail() {
  if ($('detail').open) $('detail').close();
}
$('close').addEventListener('click', closeDetail);
$('detail').addEventListener('click', (e) => {
  if (e.target === $('detail')) closeDetail(); // click on the backdrop
});
$('detail').addEventListener('close', () => history.replaceState(null, '', location.pathname + location.search));

function openFromHash() {
  const slug = decodeURIComponent(location.hash.slice(1));
  const p = slug && items.find((x) => x.slug === slug);
  if (p) open(p, false);
}

// ── Load ───────────────────────────────────────────────────────────────────

async function load() {
  if (!demo && !cfg.apiUrl) {
    showState('The catalog address is not set yet (config.js).');
    return;
  }
  showState('Loading catalog…');
  try {
    const res = await fetch(demo ? 'demo.json' : cfg.apiUrl, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    items = (await res.json()).items;
  } catch {
    showState('Could not load the catalog. Please refresh in a moment.');
    return;
  }
  fillCategories();
  render();
  openFromHash();
}

let timer;
$('q').addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(render, 120);
});
$('category').addEventListener('change', render);
$('avail').addEventListener('change', render);
window.addEventListener('hashchange', openFromHash);
load();
