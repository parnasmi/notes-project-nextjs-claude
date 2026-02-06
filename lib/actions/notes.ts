"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";

const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  contentJson: z.string(),
});

export async function createNote(data: { title: string; contentJson: string }) {
  const session = await requireAuth();

  const parsed = createNoteSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { title, contentJson } = parsed.data;
  const id = crypto.randomUUID();
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO notes (id, user_id, title, content_json, is_shared, created_at, updated_at)
    VALUES (?, ?, ?, ?, 0, ?, ?)
  `);

  stmt.run(id, session.user.id, title, contentJson, now, now);

  redirect(`/notes/${id}`);
}
