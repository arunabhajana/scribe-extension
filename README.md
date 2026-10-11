# Scribe Extension

[![Repository](https://img.shields.io/badge/GitHub-scribe--extension-181717?logo=github)](https://github.com/arunabhajana/scribe-extension)

Scribe is a lightweight Chrome extension for capturing, organizing, and editing notes in a compact popup. It includes Markdown preview, folders, drafts, trash, themes, and account-scoped cloud sync.

## Features

- Local-first notes: changes are saved to IndexedDB before cloud sync.
- Supabase email/password sign-in, registration, and email verification.
- Batched cloud sync with offline queuing, cursor-based change pulls, retries, and conflict copies.
- Supabase Realtime wakeups for quick remote updates, with periodic sync as a fallback.
- Notes, folders, drafts, trash, pinning, Markdown preview, and customizable appearance.
- Google and GitHub sign-in buttons are visual placeholders and are not connected yet.

## Requirements

- Node.js 20 or newer and npm.
- Google Chrome or another Chromium-based browser with Manifest V3 support.
- A Supabase project for authentication and cloud sync.

## Run locally

```bash
npm install
cp .env.example .env.local
```

Add the Supabase project URL and publishable key to `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

The legacy `VITE_SUPABASE_ANON_KEY` variable is also accepted. Never use a Supabase service-role key in this client-side extension.

Build and load the extension:

```bash
npm run build
```

1. Open `chrome://extensions` and enable **Developer mode**.
2. Select **Load unpacked** and choose this repository's `dist` directory.
3. Pin **Scribe Notes** from Chrome's Extensions menu to open it.

After changing source files, run `npm run build` again and reload the extension from `chrome://extensions`.

## Supabase setup

Apply the Scribe database migrations from the [scribe-backend repository](https://github.com/arunabhajana/scribe-backend) to your Supabase project:

1. `20261014000000_versioned_batch_sync.sql` creates the authenticated batch-sync RPC, version tracking, and change cursor used by the Windows app and extension.
2. `20261015000000_realtime_sync_wakeups.sql` enables a user-scoped Realtime notification on the compact sync cursor table. The notification does not include note content.

The extension stores a pending local outbox and sync cursor per account in IndexedDB. It sends writes in batches of up to 50 operations, pulls remote changes on startup and when notified, and retains a 60-second periodic pull as a fallback. Cloud sync pauses while the note body is actively being edited and resumes when editing ends. Realtime requires the second migration; without it, the periodic and focus/reconnect sync still work.

In Supabase Dashboard → **Authentication → URL Configuration**, configure email confirmation according to your project. The popup may close while the user verifies their email; they can then reopen Scribe and sign in. The current flow uses Supabase's hosted confirmation page and does not require a custom domain or extension ID.

The extension requests Chrome's `storage` permission for the Supabase session and access to `https://*.supabase.co/*` for Supabase API calls. If your project uses a custom API domain, add it to `host_permissions` in `public/manifest.json`.

## Development commands

```bash
npm run dev       # Open the Vite development preview
npm run build     # Type-check and build the unpacked extension into dist/
npm run preview   # Preview the production build in a browser
npm run lint      # Run ESLint
```

## Project layout

- `src/App.tsx` — popup screens, auth state, and application coordination.
- `src/components/` — notes, editor, settings, and authentication UI.
- `src/data/cloudSync.ts` — IndexedDB account cache and batch sync protocol.
- `public/manifest.json` — Chrome Manifest V3 settings and permissions.
- `AUTH_SETUP.md` — additional Supabase authentication notes.

## License

No license has been added yet. All rights are reserved unless a license is provided.
