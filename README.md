# BookIt

A polished, private, local-first book writing studio built with Next.js, Tailwind CSS, shadcn/ui conventions, Drizzle ORM, and embedded SQLite.

## Features

- Guided book setup with an instant eight-chapter outline
- Book library with live chapter and word-count progress
- Distraction-free manuscript editor with local autosave
- Automatic safety versions before large chapter changes
- Character, location, and continuity story bible
- Publishing metadata and seven-keyword preparation
- Standards-based EPUB, editable DOCX, and print/PDF export
- Optional server-side OpenAI chapter drafting
- Responsive professional interface with no analytics or cloud dependency

## Run locally

Requirements: Node.js 22 LTS or newer.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). The server binds only to the local machine.

## Optional AI

Copy `.env.example` to `.env.local` and add an OpenAI API key:

```env
OPENAI_API_KEY=your_key
```

The key remains server-side. Manuscript text is sent to the provider only when **Draft with AI** is selected.

## Data and backups

The embedded database is created at `data/bookit.db`. Back up the whole `data` directory while BookIt is stopped. SQLite uses WAL journaling, foreign keys, a busy timeout, and query indexes.

## Production check

```bash
npm run build
npm start
```

This application is intentionally designed for one author on one trusted computer. Do not expose it directly to the public internet without adding authentication and a reverse proxy.
