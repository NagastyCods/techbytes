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

## Deploy (Render or Railway + Atlas)

### MongoDB Atlas

1. Create a cluster and a database user.
2. **Network Access:** allow `0.0.0.0/0` (Render/Railway IPs change) or the host’s egress IPs.
3. Copy the connection string. Add `/techbytes` (or your db name) before the `?` query string.
4. Prefer the standard `mongodb://host1:27017,host2:27017,...` string if `+srv` DNS fails.

### Render

1. Push this repo to GitHub.
2. **New → Web Service**, connect the repo.
3. Build: `npm install` · Start: `npm start`
4. Environment:
   - `NODE_ENV=production`
   - `PORT` — Render sets this; you can omit it
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `SITE_URL` — `https://your-service.onrender.com` (no trailing slash)
   - SMTP vars if you want welcome emails
5. After first deploy, open a **one-off shell** (or GitHub Action) and run `npm run seed` **once**. Do not seed production again unless you intend to wipe content.

**Uploads:** files in `public/uploads` live on the instance disk and **disappear on redeploy**. For real traffic, swap Multer for Cloudinary or S3 (notes are in `src/middleware/upload.js`).

### Railway

1. **New project → GitHub repo**.
2. Set the same environment variables (`SITE_URL` = your Railway HTTPS URL).
3. Start command: `npm start`.
4. Attach a MongoDB plugin *or* keep using Atlas (`MONGODB_URI`).

`trust proxy` is already enabled so rate limits and secure cookies work behind Render/Railway. JWT cookies use `secure: true` when `NODE_ENV=production` — HTTPS is required.

## Project layout

```
src/models          Mongoose schemas
src/controllers     Public + admin handlers
src/routes          URL mapping
src/views           EJS templates
src/middleware      Auth, uploads, rate limits, cache headers
public/             CSS, JS, local uploads
scripts/seed.js     Demo data
```

## Future ideas

- Cloudinary (or S3) for images so deploys don’t wipe covers
- Confirm-link newsletter (double opt-in) and unsubscribe tokens
- Redis-backed rate limits so they survive multiple instances
- Full-text search with Atlas Search or Meilisearch instead of `$text`
- Comment notifications to authors; nested replies
- Scheduled-post worker (cron) instead of “check on request”
- Image `srcset` / AVIF and a real favicon/PWA manifest
- Playwright tests for publish → public article → search
- Role “subscriber” paywall or email-only digest builder
- 2FA for admin logins
