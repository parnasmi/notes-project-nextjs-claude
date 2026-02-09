# Technical Specification — Note Taking Web App

## 1. Overview

A local-first, self-hosted note-taking web application where authenticated users can create, manage, and optionally share notes publicly via unguessable links.

Notes are rich-text documents built with TipTap, stored as JSON in a SQLite database, accessed via Bun's native SQLite client using raw SQL.

## 2. Tech Stack

### Core

| Component | Technology           |
| --------- | -------------------- |
| Framework | Next.js (App Router) |
| Runtime   | Bun                  |
| Language  | TypeScript           |
| Styling   | TailwindCSS          |

### Auth

| Component      | Technology                  |
| -------------- | --------------------------- |
| Authentication | better-auth                 |
| Session model  | Cookie-based (server-first) |

### Editor

| Component        | Technology           |
| ---------------- | -------------------- |
| Rich Text Editor | TipTap               |
| Storage format   | TipTap JSON document |

### Database

| Component | Technology                 |
| --------- | -------------------------- |
| DB        | SQLite (file-based)        |
| Access    | Bun built-in SQLite client |
| Queries   | Raw SQL (no ORM)           |

## 3. Architecture

### High-Level Flow

```
Browser (Client)
       ↓
Next.js Server Components / Server Actions
       ↓
Auth middleware (better-auth)
       ↓
SQLite (Bun)
```

- Server Actions handle all mutations (create/update/delete)
- Read operations are either Server Components or Route Handlers
- No client-side DB access
- Notes belong strictly to one user

## 4. Authentication & Authorization

### Authentication

Users must be authenticated to:

- Create notes
- Edit notes
- Delete notes
- View private notes

### Authorization Rules

| Action            | Auth Required | Ownership Required |
| ----------------- | ------------- | ------------------ |
| Create note       | Yes           | —                  |
| Edit note         | Yes           | Yes                |
| Delete note       | Yes           | Yes                |
| View private note | Yes           | Yes                |
| View shared note  | No            | No                 |

## 5. Note Sharing Model

### Public Sharing

Sharing generates a random, unguessable public slug.

Example:

```
/share/9f3k2a7mLq
```

### Behavior

- Public notes are read-only
- Public access does not require authentication
- Public view uses a separate read-only editor renderer

### Unsharing

When sharing is disabled:

- The public link returns `404 Not Found`
- (Security-friendly, avoids leaking existence)

## 6. Autosave Strategy

### Autosave on debounce

Suggested behavior:

- Save after 1–2s of inactivity
- Also save on:
  - Page unload
  - Route change

### UI shows:

- "Saving…"
- "Saved"
- "Error saving"

## 7. Data Model (SQLite)

### Authentication Tables (better-auth)

The following tables are managed by better-auth and must exist in the database.

#### User Table

Table Name: `user`

```sql
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

| Field          | Type    | Description                                                 |
| -------------- | ------- | ----------------------------------------------------------- |
| id             | TEXT    | Unique identifier for each user (primary key)               |
| name           | TEXT    | User's chosen display name                                  |
| email          | TEXT    | User's email address for communication and login            |
| email_verified | INTEGER | Whether the user's email is verified (0 or 1)               |
| image          | TEXT    | User's image URL (optional)                                 |
| created_at     | INTEGER | Unix timestamp of when the user account was created         |
| updated_at     | INTEGER | Unix timestamp of the last update to the user's information |

#### Session Table

Table Name: `session`

```sql
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX idx_session_user_id ON session(user_id);
CREATE INDEX idx_session_token ON session(token);
```

| Field      | Type    | Description                                         |
| ---------- | ------- | --------------------------------------------------- |
| id         | TEXT    | Unique identifier for each session (primary key)    |
| user_id    | TEXT    | The ID of the user (foreign key)                    |
| token      | TEXT    | The unique session token                            |
| expires_at | INTEGER | Unix timestamp when the session expires             |
| ip_address | TEXT    | The IP address of the device (optional)             |
| user_agent | TEXT    | The user agent information of the device (optional) |
| created_at | INTEGER | Unix timestamp of when the session was created      |
| updated_at | INTEGER | Unix timestamp of when the session was updated      |

#### Account Table

Table Name: `account`

```sql
CREATE TABLE account (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,
  scope TEXT,
  id_token TEXT,
  password TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX idx_account_user_id ON account(user_id);
```

| Field                    | Type    | Description                                                                          |
| ------------------------ | ------- | ------------------------------------------------------------------------------------ |
| id                       | TEXT    | Unique identifier for each account (primary key)                                     |
| user_id                  | TEXT    | The ID of the user (foreign key)                                                     |
| account_id               | TEXT    | The ID of the account as provided by SSO, or equal to userId for credential accounts |
| provider_id              | TEXT    | The ID of the provider (e.g., "credential", "google", "github")                      |
| access_token             | TEXT    | The access token returned by the provider (optional)                                 |
| refresh_token            | TEXT    | The refresh token returned by the provider (optional)                                |
| access_token_expires_at  | INTEGER | Unix timestamp when the access token expires (optional)                              |
| refresh_token_expires_at | INTEGER | Unix timestamp when the refresh token expires (optional)                             |
| scope                    | TEXT    | The scope of the account returned by the provider (optional)                         |
| id_token                 | TEXT    | The ID token returned from the provider (optional)                                   |
| password                 | TEXT    | The hashed password for email/password authentication (optional)                     |
| created_at               | INTEGER | Unix timestamp of when the account was created                                       |
| updated_at               | INTEGER | Unix timestamp of when the account was updated                                       |

#### Verification Table

Table Name: `verification`

```sql
CREATE TABLE verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_verification_identifier ON verification(identifier);
```

| Field      | Type    | Description                                                 |
| ---------- | ------- | ----------------------------------------------------------- |
| id         | TEXT    | Unique identifier for each verification (primary key)       |
| identifier | TEXT    | The identifier for the verification request (e.g., email)   |
| value      | TEXT    | The value to be verified (e.g., verification token)         |
| expires_at | INTEGER | Unix timestamp when the verification request expires        |
| created_at | INTEGER | Unix timestamp of when the verification request was created |
| updated_at | INTEGER | Unix timestamp of when the verification request was updated |

### Notes Table

```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content_json TEXT NOT NULL,
  is_shared INTEGER NOT NULL DEFAULT 0,
  shared_slug TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_shared_slug ON notes(shared_slug);
```

### Data Notes

- `content_json` stores TipTap JSON as string
- `created_at` / `updated_at` stored as Unix timestamps
- `shared_slug` is NULL when not shared

## 8. Note Lifecycle

### Create

- Empty TipTap document
- Default title: "Untitled Note"
- Assigned to authenticated user

### Read

- Private notes: owner only
- Shared notes: public read-only

### Update

- Owner only
- Overwrites entire document
- `updated_at` refreshed on save

### Delete

- Hard delete (no trash / soft delete)
- Shared links immediately invalid

## 9. API / Server Actions

### Server Actions (Recommended)

| Action                    | Purpose              |
| ------------------------- | -------------------- |
| `createNote()`            | Create new note      |
| `updateNote(id, content)` | Save changes         |
| `deleteNote(id)`          | Delete note          |
| `toggleShare(id)`         | Share / unshare note |
| `getUserNotes()`          | List user's notes    |
| `getSharedNote(slug)`     | Public access        |

All actions:

- Validate session
- Validate ownership where required
- Use prepared SQL statements

## 10. TipTap Configuration

### Extensions

- StarterKit (base)
- Bold
- Italic
- Heading (levels 1–3)
- BulletList
- Code
- CodeBlock
- HorizontalRule

### Disabled / Excluded

- Images
- Tables
- Mentions
- History collaboration
- Real-time cursors

## 11. UI Pages

### Authenticated

- `/notes` — Notes list
- `/notes/[id]` — Editor view

### Public

- `/share/[slug]` — Read-only note view

## 12. Error Handling & Edge Cases

| Scenario            | Response              |
| ------------------- | --------------------- |
| Unauthorized access | 403                   |
| Missing note        | 404                   |
| Invalid shared slug | 404                   |
| Autosave failure    | Non-blocking UI error |
| Deleted note        | Redirect to `/notes`  |

## 13. Local-First Considerations

- SQLite stored on disk (e.g. `./data/app.db`)
- Single-writer model (acceptable for self-hosted)
- No horizontal scaling assumptions
- Backups via file copy

## 14. Non-Goals (Explicitly Out of Scope)

- Real-time collaboration
- Version history
- Folders / tags
- Search
- Offline sync
- Mobile native apps

## 15. Extensibility Hooks (Future-Proofing)

- Add tags table later
- Add `note_versions` table if versioning needed
- Convert SQLite to Postgres if scaling later
- Public notes could later allow comments

## 16. TODO

### High Priority

- [ ] Implement server actions with session validation (createNote, updateNote, deleteNote, toggleShare, getUserNotes, getSharedNote)
- [ ] Add ownership validation in all note mutation operations (edit/delete)
- [ ] Configure baseURL in auth setup (lib/auth.ts) for production environment
- [ ] Configure baseURL in auth client (lib/auth-client.ts)

### Medium Priority

- [ ] Add session expiration configuration to better-auth setup
- [ ] Add error handling for database operations
- [ ] Add trusted origins configuration for security
- [ ] Consider database migration strategy for future schema changes

### Implementation Gaps

- [ ] Notes list page - fetch and display user's notes
- [ ] Note editor page - implement TipTap editor with autosave
- [ ] Shared note page - public read-only view
- [ ] Authorization middleware/helpers for protected routes
