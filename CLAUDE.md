# CLAUDE.md

We're building the app described in @SPEC.MD. Read that file for general architectural tasks or to double-check the exact database structure, tech stack or application architecture.

Keep your replies extremely concise and focus on conveying the key information. No unnecessary fluff, no long code snippets.

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

A local-first, self-hosted note-taking web application with:
- User authentication via better-auth
- Rich-text editing with TipTap
- Public note sharing via unguessable slugs
- SQLite database with raw SQL (no ORM)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Runtime**: Bun
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Auth**: better-auth (cookie-based sessions)
- **Editor**: TipTap with StarterKit
- **Database**: SQLite via Bun's native client
- **Validation**: Zod

## Commands

```bash
bun dev        # Start development server
bun build      # Production build
bun start      # Start production server
bun lint       # Run ESLint
```

## Project Structure

```
app/               # Next.js App Router pages and layouts
  layout.tsx       # Root layout with Geist fonts
  globals.css      # Global styles with Tailwind
public/            # Static assets
```

## Architecture Guidelines

- **Server Components first**: Use RSC for data fetching
- **Server Actions for mutations**: createNote, updateNote, deleteNote, toggleShare
- **No client-side DB access**: All DB operations go through server
- **Raw SQL with prepared statements**: Use Bun's SQLite client directly
- **Notes owned by single user**: Strict ownership model

## Database

- SQLite file stored at `./data/app.db`
- Tables: user, session, account, verification (better-auth), notes
- Use Unix timestamps for dates
- TipTap content stored as JSON string in `content_json`

## Path Aliases

Use `@/*` for imports from project root (configured in tsconfig.json).

## Key Patterns

- Autosave: Debounce 1-2s after typing stops
- Note sharing: Random slug, returns 404 when unshared (security-friendly)
- Auth: Check session in all protected routes/actions
- Ownership: Validate user owns note before edit/delete
