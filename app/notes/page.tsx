import Link from "next/link";
import { getNotesByUser } from "@/lib/actions/notes";

export default async function NotesPage() {
  const notes = await getNotesByUser();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Your Notes</h1>
        <Link
          href="/notes/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          New Note
        </Link>
      </div>

      {notes.length === 0 ? (
        <p className="text-gray-600">Your notes will appear here</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                href={`/notes/${note.id}`}
                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h2 className="font-medium text-gray-900">{note.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Updated {new Date(note.updated_at).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
