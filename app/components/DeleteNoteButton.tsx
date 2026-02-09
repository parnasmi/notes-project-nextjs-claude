"use client";

import { useRef, useState } from "react";
import { deleteNote } from "@/lib/actions/notes";

export function DeleteNoteButton({ noteId }: { noteId: string }) {
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openDialog() {
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  async function handleDelete() {
    setLoading(true);
    const result = await deleteNote(noteId);

    if (result?.error) {
      alert(result.error);
      setLoading(false);
    } else {
      closeDialog();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        disabled={loading}
        className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Delete"}
      </button>

      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl backdrop:bg-black/50"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Delete Note
        </h2>
        <p className="mb-6 text-gray-600">
          Are you sure you want to delete this note? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={closeDialog}
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </dialog>
    </>
  );
}
