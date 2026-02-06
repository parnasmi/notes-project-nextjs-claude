import Link from "next/link";
import { requireAuth } from "@/lib/session";

export default async function NotesPage() {
  await requireAuth();

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
      <p className="text-gray-600">Your notes will appear here</p>
    </div>
  );
}
