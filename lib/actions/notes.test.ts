import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createNote,
  updateNote,
  deleteNote,
  getNotesByUser,
  getNoteById,
  toggleShare,
  getSharedNote,
} from "./notes";
import { redirect } from "next/navigation";
const { mockDb, mockSession } = vi.hoisted(() => ({
  mockDb: {
    run: vi.fn(),
    prepare: vi.fn().mockReturnValue({
      run: vi.fn().mockReturnValue({ changes: 1 }),
      get: vi.fn(),
      all: vi.fn(),
    }),
  },
  mockSession: {
    user: {
      id: "test-user-id",
      name: "Test User",
      email: "test@example.com",
    },
    session: {
      id: "test-session-id",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    },
  },
}));

vi.mock("@/lib/db", () => ({ db: mockDb }));
vi.mock("@/lib/session", () => ({
  getSession: vi.fn().mockResolvedValue(mockSession),
  requireAuth: vi.fn().mockResolvedValue(mockSession),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockImplementation(async () => new Map()),
}));

describe("Notes Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createNote", () => {
    it("should create a note with valid input", async () => {
      const validContent = JSON.stringify({
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "content" }] },
        ],
      });

      await createNote({
        title: "New Note",
        contentJson: validContent,
      });

      expect(mockDb.prepare).toHaveBeenCalled();
      // Should redirect to the new note
      expect(redirect).toHaveBeenCalledWith(
        expect.stringMatching(/^\/notes\/[a-z0-9-]+$/),
      );
    });

    it("should return error for invalid title", async () => {
      const result = await createNote({
        title: "",
        contentJson: "{}",
      });

      expect(result).toHaveProperty("error");
      expect(mockDb.prepare).not.toHaveBeenCalled();
    });

    it("should return error for invalid content format", async () => {
      const result = await createNote({
        title: "Title",
        contentJson: '{"type": "invalid"}',
      });

      expect(result).toHaveProperty(
        "error",
        "Invalid note content format. Please try again.",
      );
    });
  });

  describe("getNotesByUser", () => {
    it("should fetch notes for the current user", async () => {
      const mockNotes = [
        { id: "1", title: "Note 1", created_at: 123, updated_at: 123 },
      ];
      mockDb.prepare().all.mockReturnValue(mockNotes);

      const notes = await getNotesByUser();

      expect(notes).toEqual(mockNotes);
      expect(mockDb.prepare().all).toHaveBeenCalledWith(mockSession.user.id);
    });
  });

  describe("getNoteById", () => {
    it("should fetch a single note if owned by user", async () => {
      const mockNote = {
        id: "1",
        user_id: mockSession.user.id,
        title: "Note 1",
      };
      mockDb.prepare().get.mockReturnValue(mockNote);

      const note = await getNoteById("1");

      expect(note).toEqual(mockNote);
      expect(mockDb.prepare().get).toHaveBeenCalledWith(
        "1",
        mockSession.user.id,
      );
    });

    it("should return null if note not found", async () => {
      mockDb.prepare().get.mockReturnValue(undefined);

      const note = await getNoteById("999");

      expect(note).toBeNull();
    });
  });

  describe("updateNote", () => {
    it("should update note with valid input", async () => {
      const validContent = JSON.stringify({
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "updated" }] },
        ],
      });

      mockDb.prepare().run.mockReturnValue({ changes: 1 });

      await updateNote("1", {
        title: "Updated Title",
        contentJson: validContent,
      });

      expect(mockDb.prepare).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/notes/1");
    });

    it("should return error if update fails (e.g. not owner)", async () => {
      mockDb.prepare().run.mockReturnValue({ changes: 0 });

      const result = await updateNote("1", {
        title: "Title",
        contentJson: JSON.stringify({ type: "doc", content: [] }),
      });

      expect(result).toHaveProperty("error");
    });
  });

  describe("deleteNote", () => {
    it("should delete note if owned by user", async () => {
      mockDb.prepare().run.mockReturnValue({ changes: 1 });

      await deleteNote("1");

      expect(mockDb.prepare).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/notes");
    });
  });

  describe("toggleShare", () => {
    it("should enable sharing and return a slug if not shared", async () => {
      mockDb.prepare().get.mockReturnValue({ is_shared: 0 });
      vi.clearAllMocks(); // Clear the setup call

      const result = await toggleShare("1");

      // console.log(mockDb.prepare.mock.calls.map(c => c[0]));
      expect(result).toHaveProperty("is_shared", true);
      expect(result).toHaveProperty("shared_slug");
      expect(mockDb.prepare).toHaveBeenCalledTimes(2); // One for get, one for update
    });

    it("should disable sharing if already shared", async () => {
      mockDb.prepare().get.mockReturnValue({ is_shared: 1 });

      const result = await toggleShare("1");

      expect(result).toHaveProperty("is_shared", false);
      expect(result).toHaveProperty("shared_slug", null);
    });

    it("should return error if note not found", async () => {
      mockDb.prepare().get.mockReturnValue(undefined);

      const result = await toggleShare("999");

      expect(result).toHaveProperty("error");
    });
  });

  describe("getSharedNote", () => {
    it("should fetch note by slug if shared", async () => {
      const mockSharedNote = { title: "Shared", content_json: "{}" };
      mockDb.prepare().get.mockReturnValue(mockSharedNote);

      const note = await getSharedNote("some-slug");

      expect(note).toEqual(mockSharedNote);
    });

    it("should return null if shared slug not found", async () => {
      mockDb.prepare().get.mockReturnValue(undefined);

      const note = await getSharedNote("missing");

      expect(note).toBeNull();
    });
  });
});
