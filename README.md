# OZARA public catalog

Static website (no build step) that shows every product except drafts: name, description, photos,
categories, brand and every SKU with its price. Sold out and discontinued products are included and badged.

- Preview with fake data: serve this folder and open `/?demo=1` (uses `demo.json`).
- Go live: set `apiUrl` and `cdnUrl` in `config.js`, deploy this folder to Vercel (framework: Other, no build).
- Data comes from `GET /v1/catalog/public-catalog` in `aussie-backend-catalog-service`. It answers only when
  the request's `Origin` is listed in the SSM parameter `/aussie/<stage>/config/public-catalog-origins`
  (comma separated). Add the same origin to the API's `allowedOrigins` (CDK context) so browsers pass CORS.
  Order: set the SSM parameter, deploy infra with the origin, then deploy the catalog service.
