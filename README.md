# OZARA public catalog

Next.js site for shops: every product except drafts (sold out and discontinued ones included, badged),
with name, description, photos, brand, categories and every SKU with its price. No stock or cost data.

## Run
- `pnpm install`, copy `.env.example` to `.env.local`, then `pnpm dev`.
- `CATALOG_DEMO=1` shows fake sample products (`data/demo.json`) without calling the API.

## Environment (all server-side except the CDN URL)
| Variable | Meaning |
| --- | --- |
| `CATALOG_API_URL` | Full URL of `GET /v1/catalog/public-catalog` |
| `CATALOG_API_KEY` | Shared secret, sent as `x-catalog-key`; never reaches the browser |
| `NEXT_PUBLIC_CDN_URL` | Image CDN root (same as the main website) |

## How the API is locked
`aussie-backend-catalog-service` answers `/v1/catalog/public-catalog` only when `x-catalog-key` equals the SSM
parameter `/aussie/<stage>/config/public-catalog-key`. Unset = closed to everyone. The site fetches on the
server (cached 60 s), so no CORS changes are needed.

## Go live
1. Make a long random key. Store it in SSM as `/aussie/<stage>/config/public-catalog-key` and in Vercel as `CATALOG_API_KEY`.
2. Deploy the catalog service (dev, then main, per the usual flow).
3. Import this repo into Vercel (framework Next.js), set the three variables, deploy.
