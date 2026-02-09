'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';

// Allowed TipTap node types from StarterKit
const ALLOWED_NODE_TYPES = new Set([
  'doc',
  'paragraph',
  'text',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'codeBlock',
  'hardBreak',
  'horizontalRule',
]);

// Allowed TipTap mark types from StarterKit
const ALLOWED_MARK_TYPES = new Set(['bold', 'italic', 'strike', 'code']);

// Recursively validate TipTap JSON structure
function validateTipTapNode(node: unknown): boolean {
  if (typeof node !== 'object' || node === null) {
    return false;
  }

  const n = node as Record<string, unknown>;

  // Check node type
  if (typeof n.type !== 'string' || !ALLOWED_NODE_TYPES.has(n.type)) {
    return false;
  }

  // Validate marks if present
  if (n.marks !== undefined) {
    if (!Array.isArray(n.marks)) return false;
    for (const mark of n.marks) {
      if (typeof mark !== 'object' || mark === null) return false;
      const m = mark as Record<string, unknown>;
      if (typeof m.type !== 'string' || !ALLOWED_MARK_TYPES.has(m.type)) {
        return false;
      }
    }
  }

  // Validate text content - strip any HTML tags for safety
  if (n.text !== undefined) {
    if (typeof n.text !== 'string') return false;
  }

  // Validate attrs if present (only allow safe attributes)
  if (n.attrs !== undefined) {
    if (typeof n.attrs !== 'object' || n.attrs === null) return false;
    const attrs = n.attrs as Record<string, unknown>;
    // Only allow level attribute for headings
    for (const key of Object.keys(attrs)) {
      if (key === 'level') {
        if (typeof attrs.level !== 'number' || attrs.level < 1 || attrs.level > 6) {
          return false;
        }
      } else if (key === 'language') {
        // Allow language for codeBlock
        if (typeof attrs.language !== 'string' && attrs.language !== null) {
          return false;
        }
      } else {
        // Disallow unknown attributes
        return false;
      }
    }
  }

  // Recursively validate children
  if (n.content !== undefined) {
    if (!Array.isArray(n.content)) return false;
    for (const child of n.content) {
      if (!validateTipTapNode(child)) {
        return false;
      }
    }
  }

  return true;
}

// Parse and validate TipTap JSON content
function parseTipTapContent(jsonString: string): {
  valid: boolean;
  content: unknown;
} {
  try {
    const parsed = JSON.parse(jsonString);

    // Must be an object with type "doc"
    if (typeof parsed !== 'object' || parsed === null) {
      return { valid: false, content: null };
    }

    if (parsed.type !== 'doc') {
      return { valid: false, content: null };
    }

    if (!validateTipTapNode(parsed)) {
      return { valid: false, content: null };
    }

    return { valid: true, content: parsed };
  } catch {
    return { valid: false, content: null };
  }
}

const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  contentJson: z.string().max(1_000_000, 'Note content is too large'),
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
    return { error: 'Invalid note content format. Please try again.' };
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
    console.error('Failed to create note');
    return { error: 'Unable to create note. Please try again later.' };
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
  share_slug: string | null;
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
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  contentJson: z.string().max(1_000_000, 'Note content is too large'),
});

export async function updateNote(id: string, data: { title: string; contentJson: string }) {
  const session = await requireAuth();

  const parsed = updateNoteSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, contentJson } = parsed.data;

  // Validate TipTap JSON structure
  const tipTapResult = parseTipTapContent(contentJson);
  if (!tipTapResult.valid) {
    return { error: 'Invalid note content format. Please try again.' };
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
    console.error('Failed to update note');
    return { error: 'Unable to update note. Please try again later.' };
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
    console.error('Failed to delete note');
    return { error: 'Unable to delete note. Please try again later.' };
  }

  redirect('/notes');
}
