# TechBytes

Editorial tech news site: Express + EJS (server-rendered HTML), vanilla CSS/JS, MongoDB (Mongoose). Readers browse, search, comment, and subscribe. Staff publish from `/admin`.

## Local setup

1. Install [Node.js 20+](https://nodejs.org/) and either [MongoDB Community](https://www.mongodb.com/try/download/community) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.
2. Clone the repo and install packages:

```bash
npm install
copy .env.example .env
```

On macOS/Linux use `cp .env.example .env`.

3. Edit `.env`:
   - **Local Mongo:** `MONGODB_URI=mongodb://127.0.0.1:27017/techbytes`
   - **Atlas:** paste the connection string. If you see `querySrv EBADRESP`, use Atlas’s **standard** `mongodb://` URI (not `mongodb+srv://`) — some Windows DNS resolvers fail SRV lookups.
   - Set `JWT_SECRET` to a long random string.
   - SMTP fields are optional. Newsletter emails still save without them.

4. Seed demo content (wipes TechBytes collections; refused in production):

```bash
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Seed staff (password `ChangeMe123!`):

| Email | Role |
| --- | --- |
| amina@techbytes.local | admin |
| jonas@techbytes.local | editor |
| priya@techbytes.local | author |

Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login).

### Scripts

- `npm run dev` — nodemon
- `npm start` — production-style `node src/server.js`
- `npm run seed` — sample users, categories, posts, comments

## Feeds and SEO

- RSS: `/rss.xml`
- Sitemap: `/sitemap.xml`
- Robots: `/robots.txt` (blocks `/admin` and `/api/`)
- Pages include canonical URLs, Open Graph, Twitter cards, and JSON-LD (`NewsArticle` on stories, `WebSite` + `SearchAction` on the homepage)

## Deploy (Vercel + Atlas)

Vercel detects `src/app.js` (it imports Express and exports the app) and runs it as one function. `npm start` is only for a long-running Node process (local, Render, Railway). Static files in `public/` are served from Vercel’s CDN. EJS templates live in `views/` so the Express builder includes them.

### MongoDB Atlas

1. Create a cluster and a database user.
2. **Network Access:** allow `0.0.0.0/0`. Vercel’s egress IPs change.
3. Copy the connection string. Add `/techbytes` (or your db name) before the `?` query string.
4. Prefer the standard `mongodb://host1:27017,host2:27017,...` string if `+srv` DNS fails.

### Vercel

1. Push this repo to GitHub and import it at [vercel.com/new](https://vercel.com/new). Framework preset is Express (`vercel.json`).
2. Environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET` — long random string (the dev fallback is rejected when `NODE_ENV=production`)
   - `SITE_URL` — optional. Set it to your production origin with no trailing slash (`https://your-domain.com`). If you omit it, canonical URLs use the Vercel hostname.
   - SMTP vars if you want welcome emails
3. **Storage → Blob → Create.** Link the store to this project so image uploads receive `BLOB_READ_WRITE_TOKEN`. Without it, the public site still runs and cover fields still accept pasted image URLs; the admin upload button returns an error.
4. Deploy. Seed once from your machine (the script refuses `NODE_ENV=production`, and it wipes TechBytes collections):

```bash
npm run seed
```

Use the same `MONGODB_URI` in `.env` that the Vercel project uses.

`trust proxy` is already enabled. JWT cookies use `secure: true` in production, so the site must be served over HTTPS (Vercel does this).

### Render or Railway

1. Push this repo to GitHub and create a web service from it.
2. Build: `npm install` · Start: `npm start`
3. Same environment variables as above. `SITE_URL` should be the service HTTPS URL. `PORT` is set by the host.
4. After the first deploy, run `npm run seed` once from a shell or from your machine. Do not seed again unless you intend to wipe content.

**Uploads:** on Render or Railway, files in `public/uploads` live on the instance disk and disappear on redeploy. On Vercel they go to Blob instead.

## Project layout

```
src/models          Mongoose schemas
src/controllers     Public + admin handlers
src/routes          URL mapping
views/              EJS templates (project root so Vercel includes them)
src/middleware      Auth, uploads, rate limits, cache headers
public/             CSS, JS, local uploads
scripts/seed.js     Demo data
```

## Future ideas

- Confirm-link newsletter (double opt-in) and unsubscribe tokens
- Redis-backed rate limits so they survive multiple instances
- Full-text search with Atlas Search or Meilisearch instead of `$text`
- Comment notifications to authors; nested replies
- Scheduled-post worker (cron) instead of “check on request”
- Image `srcset` / AVIF and a real favicon/PWA manifest
- Playwright tests for publish → public article → search
- Role “subscriber” paywall or email-only digest builder
- 2FA for admin logins
