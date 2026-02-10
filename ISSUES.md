# Issues & Bugs Report

This document tracks all bugs and security issues identified during the code review.

---

## Critical Security Issues

### 1. Missing Ownership Validation on Note Access

**Location:** `app/notes/[id]/page.tsx:5-7`
**Severity:** CRITICAL
**Status:** Open

The note editor page only checks if the user is authenticated, but does not verify that the user owns the note before displaying it. Any authenticated user can access any other user's notes by guessing or enumerating note IDs.

```typescript
export default async function NoteEditorPage({ params }: { params: Params }) {
  await requireAuth();  // Only checks authentication, not ownership!
  const { id } = await params;
  // Note is displayed without checking if user owns it
```

**Impact:** Complete unauthorized access to all private notes by any authenticated user.

---

### 2. No Database Query to Fetch/Validate Note

**Location:** `app/notes/[id]/page.tsx`
**Severity:** CRITICAL
**Status:** Open

The page displays the note ID but never queries the database to check if:

- The note exists
- The user owns the note
- The note content is fetched securely

---

### 3. Hardcoded Secret in `.env` File

**Location:** `.env:1`
**Severity:** CRITICAL
**Status:** Open

The `.env` file contains a hardcoded, weak secret:

```
BETTER_AUTH_SECRET=thisissupersecureandmustbe32charsorlongerotherwisewegetanerror
```

**Issues:**

- This appears to be a placeholder/example secret
- Should never be committed to version control
- Should be randomly generated per deployment

---

## High Security Issues

### 4. XSS via Shared Note Slug Reflection

**Location:** `app/share/[slug]/page.tsx:9`
**Severity:** HIGH
**Status:** Open

The shared note page directly renders the `slug` parameter in the HTML without sanitization:

```tsx
<h1 className='text-2xl font-bold'>Shared Note - {slug}</h1>
```

While Next.js escapes basic HTML by default, this pattern is risky.

---

### 5. Potential XSS via Note ID Reflection

**Location:** `app/notes/[id]/page.tsx:12`
**Severity:** HIGH
**Status:** Open

Same issue as above - the note `id` is directly rendered:

```tsx
<h1 className='text-2xl font-bold'>Note Editor - {id}</h1>
```

---

### 6. Missing Input Sanitization for TipTap Content

**Location:** `lib/actions/notes.ts`
**Severity:** HIGH
**Status:** FIXED

~~The `contentJson` was validated only as a string, with no validation that it's valid JSON or that it doesn't contain malicious content.~~

**Fix applied:** Added comprehensive TipTap JSON validation with allowlisted node types, mark types, and attributes. Content is now re-serialized after validation.

---

## Medium Security Issues

### 7. No CSRF Protection on Server Actions

**Location:** `lib/actions/notes.ts`
**Severity:** MEDIUM
**Status:** Open

While Next.js Server Actions have some built-in protections, there's no explicit CSRF token validation.

---

### 8. No Rate Limiting on Authentication Endpoints

**Location:** `app/auth/page.tsx`
**Severity:** MEDIUM
**Status:** Open

There's no rate limiting on sign-in/sign-up attempts, allowing:

- Brute force password attacks
- Account enumeration
- DoS via resource exhaustion

---

### 9. Missing Trusted Origins Configuration

**Location:** `lib/auth.ts`
**Severity:** MEDIUM
**Status:** Open

The better-auth configuration doesn't specify trusted origins:

```typescript
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  // No trustedOrigins configured
```

---

### 10. No Session Expiration Configuration

**Location:** `lib/auth.ts`
**Severity:** LOW
**Status:** Open

Sessions may persist indefinitely without explicit expiration settings.

---

## Bugs

### 11. Notes List Page Doesn't Display Notes

**Location:** `app/notes/page.tsx:18`
**Severity:** HIGH
**Status:** Open

The notes list page calls `requireAuth()` but never fetches the user's notes from the database:

```tsx
<p className='text-gray-600'>Your notes will appear here</p>
// No database query to fetch user's notes
```

---

### 12. Database Path Mismatch

**Location:** `lib/db.ts:5` vs `.env`
**Severity:** MEDIUM
**Status:** FIXED

~~The database path was hardcoded in `db.ts` instead of using the `DB_PATH` environment variable.~~

**Fix applied:** Now uses `process.env.DB_PATH ?? "./data/app.db"`.

---

### 13. Missing Server Actions

**Location:** `lib/actions/notes.ts`
**Severity:** HIGH
**Status:** Open

Only `createNote` is implemented. Missing actions per SPEC.md:

- `updateNote(id, content)`
- `deleteNote(id)`
- `toggleShare(id)`
- `getUserNotes()`
- `getSharedNote(slug)`

---

### 14. Shared Note Page Doesn't Fetch Note Content

**Location:** `app/share/[slug]/page.tsx`
**Severity:** HIGH
**Status:** Open

The shared note page is a placeholder that doesn't:

- Query the database for the note by slug
- Check if the note is actually shared (`is_shared = 1`)
- Display the note content
- Return 404 for invalid/unshared slugs

---

### 15. No Error Boundary in Client Components

**Location:** Various client components
**Severity:** MEDIUM
**Status:** Open

The `NoteForm` and `AuthPage` components handle errors in state, but there's no React Error Boundary to catch unexpected runtime errors.

---

### 16. LogoutButton Doesn't Handle Errors

**Location:** `app/components/LogoutButton.tsx:9-11`
**Severity:** LOW
**Status:** Open

```typescript
async function handleLogout() {
  await authClient.signOut(); // No error handling
  router.push('/auth');
}
```

If signOut fails, the user is still redirected to `/auth`.

---

### 17. AuthPage Doesn't Refresh Router Cache

**Location:** `app/auth/page.tsx:35`
**Severity:** LOW
**Status:** Open

After successful login, using `router.push` without `router.refresh()` may show stale data from cached server components.

---

## Summary

| #   | Issue                        | Severity | Status    |
| --- | ---------------------------- | -------- | --------- |
| 1   | Missing ownership validation | CRITICAL | Open      |
| 2   | No DB query for note         | CRITICAL | Open      |
| 3   | Hardcoded secret             | CRITICAL | Open      |
| 4   | XSS via slug reflection      | HIGH     | Open      |
| 5   | XSS via ID reflection        | HIGH     | Open      |
| 6   | Missing TipTap sanitization  | HIGH     | **FIXED** |
| 7   | No CSRF protection           | MEDIUM   | Open      |
| 8   | No rate limiting             | MEDIUM   | Open      |
| 9   | No trusted origins           | MEDIUM   | Open      |
| 10  | No session expiration        | LOW      | Open      |
| 11  | Notes list incomplete        | HIGH     | Open      |
| 12  | DB path mismatch             | MEDIUM   | **FIXED** |
| 13  | Missing server actions       | HIGH     | Open      |
| 14  | Shared page incomplete       | HIGH     | Open      |
| 15  | No error boundary            | MEDIUM   | Open      |
| 16  | Logout error handling        | LOW      | Open      |
| 17  | Router cache stale           | LOW      | Open      |
