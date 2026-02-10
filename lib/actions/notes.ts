"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";

import { parseTipTapContent } from "@/lib/utils/tiptap";

const createNoteSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be 255 characters or less"),
  contentJson: z.string().max(1_000_000, "Note content is too large"),
});

export async function createNote(data: { title: string; contentJson: string }) {
  const session = await requireAuth();

  const parsed = createNoteSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, contentJson } = parsed.data;

  // Validate TipTap JSON structure
  const tipTapResult = parseTipTapContent(contentJson);
  if (!tipTapResult.valid) {
    return { error: "Invalid note content format. Please try again." };
  }

  // Re-serialize the validated content to ensure clean JSON
  const sanitizedContent = JSON.stringify(tipTapResult.content);

  const id = crypto.randomUUID();
  const now = Date.now();

  try {
    const stmt = db.prepare(`
      INSERT INTO notes (id, user_id, title, content_json, is_shared, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `);

    stmt.run(id, session.user.id, title, sanitizedContent, now, now);
  } catch {
    // Log error internally but don't expose details to client
    console.error("Failed to create note");
    return { error: "Unable to create note. Please try again later." };
  }

  redirect(`/notes/${id}`);
}

// Types for note queries
export type NoteSummary = {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
};

export type Note = {
  id: string;
  user_id: string;
  title: string;
  content_json: string;
  is_shared: number;
  shared_slug: string | null;
  created_at: number;
  updated_at: number;
};

export async function getNotesByUser(): Promise<NoteSummary[]> {
  const session = await requireAuth();

  const stmt = db.prepare(`
    SELECT id, title, created_at, updated_at
    FROM notes
    WHERE user_id = ?
    ORDER BY updated_at DESC
  `);

  return stmt.all(session.user.id) as NoteSummary[];
}

export async function getNoteById(id: string): Promise<Note | null> {
  const session = await requireAuth();

  const stmt = db.prepare(`
    SELECT * FROM notes WHERE id = ? AND user_id = ?
  `);

  const note = stmt.get(id, session.user.id) as Note | undefined;
  return note ?? null;
}

const updateNoteSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be 255 characters or less"),
  contentJson: z.string().max(1_000_000, "Note content is too large"),
});

export async function updateNote(
  id: string,
  data: { title: string; contentJson: string },
) {
  const session = await requireAuth();

  const parsed = updateNoteSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, contentJson } = parsed.data;

  // Validate TipTap JSON structure
  const tipTapResult = parseTipTapContent(contentJson);
  if (!tipTapResult.valid) {
    return { error: "Invalid note content format. Please try again." };
  }

  const sanitizedContent = JSON.stringify(tipTapResult.content);
  const now = Date.now();

  try {
    const stmt = db.prepare(`
      UPDATE notes SET title = ?, content_json = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `);

    const result = stmt.run(title, sanitizedContent, now, id, session.user.id);
    if (result.changes === 0) {
      return {
        error: "Note not found or you don't have permission to edit it.",
      };
    }
  } catch {
    console.error("Failed to update note");
    return { error: "Unable to update note. Please try again later." };
  }

  redirect(`/notes/${id}`);
}

export async function deleteNote(id: string) {
  const session = await requireAuth();

  try {
    const stmt = db.prepare(`
      DELETE FROM notes WHERE id = ? AND user_id = ?
    `);

    const result = stmt.run(id, session.user.id);
    if (result.changes === 0) {
      return {
        error: "Note not found or you don't have permission to delete it.",
      };
    }
  } catch {
    console.error("Failed to delete note");
    return { error: "Unable to delete note. Please try again later." };
  }

  redirect("/notes");
}

export async function toggleShare(id: string) {
  const session = await requireAuth();

  // Get current note state
  const getStmt = db.prepare(
    "SELECT is_shared FROM notes WHERE id = ? AND user_id = ?",
  );
  const note = getStmt.get(id, session.user.id) as
    | { is_shared: number }
    | undefined;

  if (!note) {
    return { error: "Note not found or you don't have permission." };
  }

  const now = Date.now();

  if (note.is_shared) {
    // Turn off sharing
    const stmt = db.prepare(`
      UPDATE notes SET is_shared = 0, shared_slug = NULL, updated_at = ?
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(now, id, session.user.id);
    return { is_shared: false, shared_slug: null };
  } else {
    // Turn on sharing with new slug
    const slug = crypto.randomUUID().slice(0, 12);
    const stmt = db.prepare(`
      UPDATE notes SET is_shared = 1, shared_slug = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(slug, now, id, session.user.id);
    return { is_shared: true, shared_slug: slug };
  }
}

export type SharedNote = {
  title: string;
  content_json: string;
};

export async function getSharedNote(slug: string): Promise<SharedNote | null> {
  const stmt = db.prepare(`
    SELECT title, content_json FROM notes
    WHERE shared_slug = ? AND is_shared = 1
  `);

  const note = stmt.get(slug) as SharedNote | undefined;
  return note ?? null;
}
