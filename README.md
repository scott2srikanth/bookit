# DigiKatha

**A sanctuary for every story.**

DigiKatha is a private, single-writer hub for shaping ideas, drafting manuscripts, preserving story worlds, and preparing books for publication. It uses Next.js, Tailwind CSS, shadcn/ui conventions, Drizzle ORM, Cloudflare Workers, and D1.

## Highlights

- Story shelf, guided setup, manuscript editor, autosave, and safety versions
- Character, location, and continuity story bible
- EPUB, editable DOCX, and print/PDF export
- Optional AI drafting and Voice Muse dictation
- Password-protected writer account with revocable sessions and login rate limiting
- Cloudflare-compatible storage with no native Node.js database module or writable-filesystem dependency

## Local development

Requirements: Node.js 22 or newer.

```bash
npm install
cp .dev.vars.example .dev.vars
npm run auth:hash-password
```

Put the generated value and your writer email in `.dev.vars`, then initialize and run the local D1 database:

```bash
npm run db:migrate:local
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). `.dev.vars` is ignored by Git.

## Cloudflare deployment

### Cloudflare dashboard build settings

For a GitHub-connected Worker, open **Workers & Pages → digikatha → Settings → Build** and use these exact values:

```text
Build command: npm run cloudflare:build
Deploy command: npm run cloudflare:deploy
Non-production deploy command: npx opennextjs-cloudflare upload
Root directory: /
Production branch: main
```

Do not use `npm run build` as the Cloudflare build command. That produces only the Next.js output; `cloudflare:build` also creates the compiled `.open-next` Worker configuration required by the deploy phase. Apply D1 migrations separately because the default Workers Builds token may not have D1 migration permission.

Authenticate Wrangler and create the production D1 database once:

```bash
npx wrangler login
npx wrangler d1 create digikatha-db
```

Copy the returned database ID into `wrangler.jsonc`, replacing `REPLACE_WITH_D1_DATABASE_ID`. Then configure production:

```bash
npm run db:migrate:remote
npx wrangler secret put AUTH_EMAIL
npx wrangler secret put AUTH_PASSWORD_HASH
npm run deploy
```

Generate `AUTH_PASSWORD_HASH` with `npm run auth:hash-password`. To enable the optional AI and Whisper features, also run `npx wrangler secret put OPENAI_API_KEY`.

For dashboard deployments, `AUTH_EMAIL` and `APP_ORIGIN` are configured as non-sensitive Worker variables in `wrangler.jsonc`. Add only `AUTH_PASSWORD_HASH` under **Settings → Variables and Secrets** as an encrypted runtime secret.

Attach `book.skrdy.com` as a custom domain to the deployed `bookit` Worker in Cloudflare. D1 is the only persistent application store; the Worker does not write to its local filesystem.

## Security model

- PBKDF2-SHA256 password hashing with a unique salt and Cloudflare Workers' supported maximum of 100,000 iterations
- Random 256-bit session tokens; only SHA-256 token hashes are stored
- Production `__Host-` cookie with `Secure`, `HttpOnly`, and `SameSite=Strict`
- Origin validation for state-changing API calls and a safe same-site redirect policy
- IP-derived, hashed login rate-limit keys with temporary lockout
- Server-side secrets only; manuscript content reaches an AI provider only on an explicit AI action

This is intentionally a single-writer application, not a multi-tenant account system.

## Verification

```bash
npm run lint
npm run build
npm audit --omit=dev
```
